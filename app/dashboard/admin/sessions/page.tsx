"use client";

import { useState, useEffect } from "react";
import { Clock, Monitor, Smartphone, Globe, AlertCircle, Loader2, RefreshCw, CheckCircle, LogOut } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useAdminSessions } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-12 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

export default function AdminSessionsPage() {
  const { sessions, isLoading, isError, mutate } = useAdminSessions();
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const activeSessions = (sessions || []) as any[];
  const deviceTypes = activeSessions.reduce((acc: Record<string, number>, s: any) => {
    const d = s.device_info?.type || "unknown";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Active Sessions</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Monitor active user sessions across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)",
            color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}`,
          }}
        >
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Active", value: activeSessions.length.toString(), color: "#2BAE8E", icon: Monitor },
          { label: "Desktop", value: (deviceTypes.desktop || deviceTypes.windows || deviceTypes.mac || 0).toString(), color: "#1A3C5E", icon: Monitor },
          { label: "Mobile", value: (deviceTypes.mobile || deviceTypes.android || deviceTypes.ios || 0).toString(), color: "#F5A623", icon: Smartphone },
          { label: "Web", value: (deviceTypes.web || deviceTypes.browser || 0).toString(), color: "#64748B", icon: Globe },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl p-4" style={{ background: s.color }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <Icon className="w-5 h-5 opacity-60 text-white" />
              </div>
              <div className="text-xs text-white/80">{s.label}</div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Active User Sessions" subtitle={`${activeSessions.length} session(s)`} />
        {isLoading ? (
          <div className="space-y-1">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#E53E3E" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>Failed to load sessions</p>
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-8">
            <Monitor className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No active sessions</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activeSessions.map((s: any) => {
              const deviceType = s.device_info?.type || "web";
              const DeviceIcon = deviceType === "mobile" ? Smartphone : deviceType === "tablet" ? Monitor : Monitor;
              const loggedIn = s.logged_in_at ? new Date(s.logged_in_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
              const lastActive = s.last_active_at ? new Date(s.last_active_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <DeviceIcon className="w-4 h-4 shrink-0" style={{ color: "#1A3C5E" }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "#1A2E44" }}>
                        {s.user?.first_name} {s.user?.last_name || ""}
                      </div>
                      <div className="text-xs truncate" style={{ color: "#64748B" }}>{s.user?.email}</div>
                    </div>
                  </div>
                  <div className="hidden md:block text-xs" style={{ color: "#64748B" }}>
                    <div>IP: {s.ip_address || "—"}</div>
                    <div className="truncate max-w-[200px]">{s.user_agent?.slice(0, 60) || "—"}</div>
                  </div>
                  <div className="hidden lg:block text-xs text-right" style={{ color: "#94A3B8" }}>
                    <div>Logged in: {loggedIn}</div>
                    <div>Last active: {lastActive}</div>
                  </div>
                  <Badge variant="teal">active</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
