import webpush from "web-push";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@hostsphere.app";

let configured = false;

function ensureConfigured() {
  if (!configured && PUBLIC_KEY && PRIVATE_KEY) {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  }
}

export function isPushEnabled(): boolean {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  icon?: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Sends a push notification to a single stored subscription.
 * Returns true on success; throws on 404/410 (stale subscription) via caller cleanup.
 */
export async function sendPush(
  sub: PushSubscriptionRecord,
  payload: PushPayload
): Promise<boolean> {
  if (!isPushEnabled()) return false;
  ensureConfigured();

  await webpush.sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    },
    JSON.stringify({
      title: payload.title,
      body: payload.body || "",
      url: payload.url || "/",
      icon: payload.icon || "/pwa-192.png",
    })
  );
  return true;
}
