"use client";

import Link from "next/link";
import { WifiOff, RotateCcw } from "lucide-react";

export default function OfflinePage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--hs-bg-cream)" }}
    >
      <div className="w-full max-w-md text-center animate-fade-in">
        <div
          className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{
            background: "var(--hs-primary-navy)",
            boxShadow: "0 12px 32px rgba(37,82,48,0.25)",
          }}
        >
          <WifiOff className="w-9 h-9 text-white" />
        </div>

        <h1
          className="text-3xl font-bold mb-3"
          style={{ color: "var(--hs-text-dark)", fontFamily: "var(--font-playfair)" }}
        >
          You&apos;re Offline
        </h1>

        <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--hs-text-muted)" }}>
          It looks like your connection dropped. Don&apos;t worry — HostSphere saved your app shell
          so you can get back to work the moment you reconnect.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--hs-primary-navy)" }}
          >
            <RotateCcw className="w-4 h-4" />
            Retry Connection
          </button>

          <Link
            href="/"
            className="block w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{
              color: "var(--hs-primary-navy)",
              border: "1px solid var(--hs-border-light)",
              background: "var(--hs-surface-white)",
            }}
          >
            Back to Home
          </Link>
        </div>

        <p className="text-xs mt-8" style={{ color: "var(--hs-text-muted)" }}>
          HostSphere · Hospitality Management Suite
        </p>
      </div>
    </main>
  );
}
