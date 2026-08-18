/** Converts a base64url VAPID public key to a Uint8Array for PushManager.subscribe. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Encodes a raw ArrayBuffer (p256dh / auth) as base64 for server storage. */
export function encodePushKey(key: ArrayBuffer | null): string {
  return btoa(String.fromCharCode(...new Uint8Array(key!)));
}

export interface PushKeys {
  p256dh: string;
  auth: string;
}

/** Builds the JSON-safe key payload from a browser PushSubscription. */
export function subscriptionPayload(sub: PushSubscription): { endpoint: string; keys: PushKeys } {
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: encodePushKey(sub.getKey("p256dh")),
      auth: encodePushKey(sub.getKey("auth")),
    },
  };
}
