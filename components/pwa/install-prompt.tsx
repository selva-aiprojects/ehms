"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Plus, Home } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "hs_pwa_install_dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone();
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [iosHint] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return isIOS();
  });
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return Boolean(localStorage.getItem(DISMISS_KEY));
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
    setCanInstall(false);
    if (outcome === "accepted") dismiss();
  };

  if (dismissed || installed || (!canInstall && !iosHint)) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[90] animate-slide-up"
      role="dialog"
      aria-label="Install HostSphere app"
    >
      <div
        className="rounded-2xl p-4 shadow-2xl"
        style={{
          background: "var(--hs-surface-white)",
          border: "1px solid var(--hs-border-light)",
          boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--hs-primary-navy)" }}
          >
            <Download className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--hs-text-dark)" }}>
              Install HostSphere
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--hs-text-muted)" }}>
              {iosHint && !canInstall
                ? "Tap Share, then choose Add to Home Screen for the full app experience."
                : "Get the app on your home screen for faster access, offline support and notifications."}
            </p>
          </div>

          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70 shrink-0"
            style={{ color: "var(--hs-text-muted)" }}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          {canInstall && (
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--hs-primary-navy)" }}
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          )}
          {iosHint && !canInstall && (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                color: "var(--hs-text-dark)",
                background: "var(--hs-bg-cream)",
                border: "1px solid var(--hs-border-light)",
              }}
            >
              <Share className="w-4 h-4" style={{ color: "var(--hs-secondary-gold)" }} />
              <Plus className="w-3 h-3" style={{ color: "var(--hs-secondary-gold)" }} />
              <Home className="w-4 h-4" style={{ color: "var(--hs-secondary-gold)" }} />
              <span className="ml-1">Add to Home Screen</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
