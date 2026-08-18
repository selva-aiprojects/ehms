"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Send, Check } from "lucide-react";
import toast from "react-hot-toast";
import { urlBase64ToUint8Array, subscriptionPayload } from "@/lib/push-client";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted" || !("serviceWorker" in navigator)) {
        if (!cancelled) setSubscribed(false);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setSubscribed(Boolean(sub));
      } catch {
        if (!cancelled) setSubscribed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const enable = async () => {
    setBusy(true);
    try {
      if (!("Notification" in window)) throw new Error("Notifications not supported");
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error("Notification permission was denied.");
        return;
      }
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        toast.error("Push is not configured on this server.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscriptionPayload(sub)),
      });
      if (!res.ok) throw new Error("Failed to register subscription");
      setSubscribed(true);
      toast.success("Push notifications enabled!");
    } catch (err) {
      console.error("[push enable]", err);
      const message = err instanceof Error ? err.message : "Could not enable notifications.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast("Push notifications disabled.");
    } catch (err) {
      console.error("[push disable]", err);
      toast.error("Could not disable notifications.");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "HostSphere",
          body: "This is a test push notification 🎉",
          url: "/dashboard",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.sent ? "Test notification sent!" : "No active subscriptions yet.");
    } catch (err) {
      console.error("[push test]", err);
      const message = err instanceof Error ? err.message : "Failed to send test notification.";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
        style={{ background: "var(--hs-bg-cream)", border: "1px solid var(--hs-border-light)" }}
        aria-label="Notifications"
        title="Notifications"
      >
        {subscribed ? (
          <Bell className="w-4 h-4" style={{ color: "var(--hs-primary-navy)" }} />
        ) : (
          <BellOff className="w-4 h-4" style={{ color: "var(--hs-text-muted)" }} />
        )}
        {permission === "granted" && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ background: "var(--hs-green)" }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg z-50 overflow-hidden animate-scale-in"
          style={{ background: "var(--color-white)", border: "1px solid var(--color-border)" }}
        >
          <div
            className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)" }}
          >
            Notifications
          </div>

          <div className="p-4">
            {permission === "unsupported" ? (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Your browser doesn&apos;t support web push notifications.
              </p>
            ) : subscribed ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-success)" }}>
                  <Check className="w-4 h-4" />
                  Push notifications are on
                </div>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  You&apos;ll get instant alerts on this device for bookings, housekeeping and
                  maintenance updates.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={sendTest}
                    disabled={sending}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: "var(--hs-bg-cream)",
                      border: "1px solid var(--hs-border-light)",
                      color: "var(--color-text)",
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending ? "Sending…" : "Send test"}
                  </button>
                  <button
                    onClick={disable}
                    disabled={busy}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "var(--color-danger)" }}
                  >
                    Disable
                  </button>
                </div>
              </div>
            ) : permission === "granted" ? (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Permission granted but no active push subscription yet.
                </p>
                <button
                  onClick={enable}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--hs-primary-navy)" }}
                >
                  <Bell className="w-3.5 h-3.5" />
                  {busy ? "Connecting…" : "Subscribe device"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Get instant alerts on this device for bookings, housekeeping and maintenance
                  updates — even when the app is closed.
                </p>
                <button
                  onClick={enable}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--hs-primary-navy)" }}
                >
                  <Bell className="w-3.5 h-3.5" />
                  {busy ? "Requesting…" : "Enable notifications"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
