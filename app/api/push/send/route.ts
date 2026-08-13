import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendPush, isPushEnabled, type PushSubscriptionRecord } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Sends a push notification to a target user's subscriptions.
 * Body: { user_id?, title, body?, url? }
 * - user_id defaults to the current user (test notifications).
 * - Admin/super_admin users may target any user in the tenant.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role") || "";
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isPushEnabled()) {
      return NextResponse.json(
        { error: "Web push is not configured (VAPID keys missing)" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { user_id, title, body: bodyText, url } = body || {};

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const canBroadcast = ["super_admin", "executive", "platform_super_admin"].includes(role);
    const targetUserId = user_id && canBroadcast ? user_id : userId;

    const sql = getDb();
    const rows = (await sql`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE user_id = ${targetUserId}::uuid
    `) as unknown as PushSubscriptionRecord[];

    if (!rows.length) {
      return NextResponse.json({ sent: 0, message: "No active subscriptions for this user" });
    }

    let sent = 0;
    const stale: string[] = [];

    await Promise.all(
      rows.map(async (sub) => {
        try {
          await sendPush(sub, { title, body: bodyText, url });
          sent++;
        } catch (err) {
          // 404/410 = subscription expired → clean up.
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            stale.push(sub.endpoint);
          } else {
            console.error("[push send]", statusCode || err);
          }
        }
      })
    );

    if (stale.length) {
      await sql`
        DELETE FROM push_subscriptions WHERE endpoint = ANY(${stale})
      `;
    }

    return NextResponse.json({ sent, cleaned: stale.length });
  } catch (error) {
    console.error("[push send]", error);
    const message = error instanceof Error ? error.message : "Failed to send notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
