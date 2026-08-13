"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { urlBase64ToUint8Array, subscriptionPayload } from "@/lib/push-client";

/**
 * Registers the service worker and wires up:
 *  1. Update-available toast (new SW version → prompt to refresh)
 *  2. Web push subscription sync (only when the user has granted permission)
 *
 * Registration is production-only to avoid caching stale HMR chunks in `next dev`.
 * For local testing, append ?pwa=1 or set localStorage.hs_pwa_dev="1".
 */
export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const devOverride =
      new URLSearchParams(window.location.search).get("pwa") === "1" ||
      (() => {
        try {
          return localStorage.getItem("hs_pwa_dev") === "1";
        } catch {
          return false;
        }
      })();
    if (process.env.NODE_ENV !== "production" && !devOverride) return;

    let registration: ServiceWorkerRegistration | null = null;
    let refreshing = false;

    // Reload once the new SW takes control after the user accepts the update.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[PWA] Service worker registration failed", err);
        }
        return;
      }

      // ── Update-available toast ──
      registration.addEventListener("updatefound", () => {
        const newWorker = registration?.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New content available — offer a refresh.
            toast(
              (t) => (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">New update available</p>
                    <p className="text-xs opacity-70">Restart to get the latest version.</p>
                  </div>
                  <button
                    onClick={() => {
                      newWorker.postMessage({ type: "SKIP_WAITING" });
                      toast.dismiss(t.id);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              ),
              { duration: 10000, id: "pwa-update" }
            );
          }
        });
      });

      // ── Web push subscription sync ──
      try {
        await syncPushSubscription(registration);
      } catch {
        /* push is optional — never block the app */
      }
    };

    register();

    // Re-sync push after login state changes (the app mounts per-session).
    window.addEventListener("focus", () => {
      navigator.serviceWorker.ready.then((reg) => syncPushSubscription(reg)).catch(() => {});
    });
  }, []);

  return null;
}

async function syncPushSubscription(registration: ServiceWorkerRegistration) {
  if (!("Notification" in window) || typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

  // Only touch push when the user has already granted permission.
  if (Notification.permission !== "granted") return;

  let subscription: PushSubscription | null = null;
  try {
    subscription = await registration.pushManager.getSubscription();
  } catch {
    return;
  }

  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });
    } catch {
      return; // permission revoked / unsupported
    }
  }

  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscriptionPayload(subscription)),
    });
  } catch {
    /* offline or server error — retry on next focus */
  }
}
