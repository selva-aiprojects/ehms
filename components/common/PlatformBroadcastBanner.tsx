"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Sparkles, AlertTriangle, ShieldAlert, X, ExternalLink, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useJourney } from "@/components/providers/JourneyProvider";

interface Broadcast {
  id: string;
  title: string;
  content: string;
  category: "announcement" | "feature" | "advertisement" | "maintenance" | "billing_reminder";
  priority: "normal" | "high" | "urgent";
  action_url: string | null;
  action_label: string | null;
}

export default function PlatformBroadcastBanner() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { activeJourney } = useJourney();

  useEffect(() => {
    // Don't show banners to Platform Super Admins on their own admin pages
    if (user?.is_platform_admin) return;

    // Load dismissed IDs from localStorage with a 30-day (monthly) expiry
    try {
      const saved = localStorage.getItem("ehms_dismissed_broadcasts");
      if (saved) {
        const data = JSON.parse(saved) as Record<string, number>;
        const activeDismissals = new Set<string>();
        const cleanData: Record<string, number> = {};
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        Object.entries(data).forEach(([id, dismissedAt]) => {
          if (now - dismissedAt < thirtyDaysMs) {
            activeDismissals.add(id);
            cleanData[id] = dismissedAt;
          }
        });

        setDismissedIds(activeDismissals);
        localStorage.setItem("ehms_dismissed_broadcasts", JSON.stringify(cleanData));
      }
    } catch {
      // Ignore
    }

    async function loadBroadcasts() {
      try {
        const res = await fetch(`/api/broadcasts/active?vertical=${activeJourney}`);
        if (res.ok) {
          const data = await res.json();
          setBroadcasts(data.broadcasts || []);
        }
      } catch {
        // Silently skip if network error
      }
    }

    loadBroadcasts();
  }, [user, activeJourney]);

  const dismiss = (id: string) => {
    const next = new Set(dismissedIds);
    next.add(id);
    setDismissedIds(next);
    try {
      const saved = localStorage.getItem("ehms_dismissed_broadcasts");
      const currentData = saved ? (JSON.parse(saved) as Record<string, number>) : {};
      currentData[id] = Date.now();
      localStorage.setItem("ehms_dismissed_broadcasts", JSON.stringify(currentData));
    } catch {
      // Ignore
    }
  };

  const visibleBroadcasts = broadcasts.filter((b) => !dismissedIds.has(b.id));

  if (visibleBroadcasts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {visibleBroadcasts.map((b) => {
        let bgClass = "bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white border-indigo-700/50";
        let icon = <Megaphone className="w-5 h-5 text-indigo-300 shrink-0" />;
        let badge = "Service Provider Notice";

        if (b.category === "feature") {
          bgClass = "bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white border-purple-700/50";
          icon = <Sparkles className="w-5 h-5 text-purple-300 shrink-0 animate-pulse" />;
          badge = "New Feature Available";
        } else if (b.category === "billing_reminder") {
          bgClass = "bg-gradient-to-r from-amber-900 via-yellow-900 to-amber-950 text-white border-amber-700/50";
          icon = <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />;
          badge = "Billing & Subscription Alert";
        } else if (b.category === "maintenance" || b.priority === "urgent") {
          bgClass = "bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 text-white border-rose-700/50";
          icon = <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0" />;
          badge = "Urgent System Notification";
        } else if (b.category === "advertisement") {
          bgClass = "bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white border-emerald-700/50";
          icon = <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />;
          badge = "CybeHMS Offer & Upgrade";
        }

        return (
          <div
            key={b.id}
            className={`relative rounded-2xl p-4 md:p-5 shadow-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${bgClass}`}
          >
            <div className="flex items-start md:items-center gap-3.5 pr-8 md:pr-0">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm shrink-0">
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/15 text-white/90">
                    {badge}
                  </span>
                </div>
                <h4 className="text-base font-bold tracking-wide text-white">
                  {b.title}
                </h4>
                <p className="text-sm text-white/80 mt-0.5 leading-relaxed max-w-3xl">
                  {b.content}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center shrink-0">
              {b.action_url && (
                <a
                  href={b.action_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold text-xs shadow hover:bg-slate-100 transition-all active:scale-95"
                >
                  {b.action_label || "Learn More"} <ChevronRight className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => dismiss(b.id)}
                title="Dismiss banner"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
