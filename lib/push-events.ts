/**
 * lib/push-events.ts — Best-effort event-driven push notifications.
 *
 * After a domain event (new booking, housekeeping task, maintenance ticket),
 * call notifyPropertyUsers() to alert every user who has push enabled and is
 * scoped to the affected property (or has a global role).
 *
 * IMPORTANT: These helpers NEVER throw — a push failure must not roll back or
 * slow down the primary API mutation. All errors are swallowed and logged.
 *
 * NOTE ON FIRING: use with Next.js `after()` in route handlers so the push
 * work runs after the response is sent and is guaranteed to complete on
 * serverless runtimes:
 *
 *   after(() => notifyPropertyUsers(propertyId, { title, body }, { roles: ["front_desk"] }));
 */
import { getDb } from "@/lib/db";
import { sendPush, isPushEnabled, type PushSubscriptionRecord } from "@/lib/push";

export interface PushEventPayload {
  title: string;
  body: string;
  url?: string;
}

export interface NotifyOptions {
  /** Only notify users holding one of these roles (by role name). */
  roles?: string[];
  /** Acting user id — excluded from recipients so you don't notify the actor. */
  excludeUserId?: string;
}

interface UserSubscription extends PushSubscriptionRecord {
  user_id: string;
}

/**
 * Sends a push notification to every enabled subscriber assigned to the
 * given property — department roles scoped to that property plus global
 * roles (super_admin / executive / property_manager with no property scope).
 *
 * Optionally filter by role name (e.g. only "front_desk" + "property_manager"
 * for booking events) to avoid notification fatigue.
 */
export async function notifyPropertyUsers(
  propertyId: string,
  payload: PushEventPayload,
  opts: NotifyOptions = {},
  schema?: string
): Promise<void> {
  if (!isPushEnabled()) return;
  try {
    const sql = getDb(schema);

    const roleFilter = opts.roles?.length
      ? sql`AND r.name = ANY(${opts.roles})`
      : sql``;

    const subs = (await sql`
      SELECT ps.user_id, ps.endpoint, ps.p256dh, ps.auth
      FROM push_subscriptions ps
      WHERE ps.user_id IN (
        SELECT DISTINCT ur.user_id
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE (ur.property_id = ${propertyId}::uuid OR ur.property_id IS NULL)
          ${roleFilter}
      )
      ${opts.excludeUserId ? sql`AND ps.user_id <> ${opts.excludeUserId}::uuid` : sql``}
    `) as unknown as UserSubscription[];

    if (!subs.length) return;

    await deliver(subs, payload, sql, "[push-events property]");
  } catch (err) {
    // Never break the primary operation.
    console.error("[push-events notifyPropertyUsers]", err);
  }
}

/**
 * Sends a push notification to a single user's subscriptions (e.g. a
 * task assigned directly to them). Fire-and-forget.
 */
export async function notifyUser(
  userId: string,
  payload: PushEventPayload,
  schema?: string
): Promise<void> {
  if (!isPushEnabled()) return;
  try {
    const sql = getDb(schema);
    const subs = (await sql`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE user_id = ${userId}::uuid
    `) as unknown as PushSubscriptionRecord[];

    if (!subs.length) return;

    await deliver(subs, payload, sql, "[push-events user]");
  } catch (err) {
    console.error("[push-events notifyUser]", err);
  }
}

async function deliver(
  subs: PushSubscriptionRecord[],
  payload: PushEventPayload,
  sql: ReturnType<typeof getDb>,
  logTag: string
): Promise<void> {
  const stale: string[] = [];
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await sendPush(sub, {
          title: payload.title,
          body: payload.body,
          url: payload.url || "/dashboard",
        });
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) stale.push(sub.endpoint);
        else console.error(logTag, statusCode || err);
      }
    })
  );

  if (stale.length) {
    await sql`
      DELETE FROM push_subscriptions WHERE endpoint = ANY(${stale})
    `;
  }
}
