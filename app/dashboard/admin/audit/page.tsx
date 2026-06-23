"use client";

import { useState } from "react";
import { FileText, Activity, AlertTriangle, Info, Shield, Filter, Loader2, RefreshCw, Search, X } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useAuditLogs, useAdminAuditEvents } from "@/lib/hooks";

const SEVERITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: "rgba(229,62,62,0.1)", text: "#E53E3E", dot: "#E53E3E" },
  error: { bg: "rgba(229,62,62,0.08)", text: "#E53E3E", dot: "#E53E3E" },
  warning: { bg: "rgba(245,166,35,0.1)", text: "#F5A623", dot: "#F5A623" },
  info: { bg: "rgba(42,157,143,0.1)", text: "#2BAE8E", dot: "#2BAE8E" },
};

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState("activity");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const { logs, isLoading: loadingLogs, mutate: mutateLogs } = useAuditLogs(100);
  const { auditEvents, isLoading: loadingEvents, mutate: mutateEvents } = useAdminAuditEvents({ limit: 100 });

  const filteredLogs = (logs || []).filter((l: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const userName = l.user?.first_name ? `${l.user.first_name} ${l.user.last_name || ""}` : l.user || "";
    return userName.toLowerCase().includes(q) || (l.action || "").toLowerCase().includes(q) || (l.entity_type || "").toLowerCase().includes(q);
  });

  const filteredEvents = (auditEvents || []).filter((e: any) => {
    if (severityFilter && e.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Audit Trail</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>System-wide activity monitoring and event tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { mutateLogs(); mutateEvents(); }}
            className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {[
          { key: "activity", label: "Activity Log", icon: FileText },
          { key: "events", label: "System Events", icon: Activity },
          { key: "summary", label: "Summary", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap"
              style={{ background: isActive ? "#1A3C5E" : "#F5F7FA", color: isActive ? "#FFFFFF" : "#64748B" }}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "activity" && (
        <Card>
          <CardHeader title="Activity Log" subtitle="User actions across the system"
            action={
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                <input type="text" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by user or action..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none w-48"
                  style={{ borderColor: "#E2E8F0" }} />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="w-3 h-3" style={{ color: "#94A3B8" }} />
                  </button>
                )}
              </div>
            } />
          {loadingLogs ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#94A3B8" }} /></div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "#94A3B8" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredLogs.map((a: any, i: number) => {
                const userName = a.user?.first_name ? `${a.user.first_name} ${a.user.last_name || ""}` : a.user || "System";
                const initial = userName.charAt(0);
                const timeStr = a.created_at ? new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : a.time;
                return (
                  <div key={a.id || i} className="flex items-center justify-between py-2.5 px-1"
                    style={{ borderBottom: i < filteredLogs.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "#2C3547" }}>
                        {initial}
                      </div>
                      <div>
                        <span className="font-medium text-sm" style={{ color: "#1A2E44" }}>{userName}</span>
                        <span className="ml-1 text-xs" style={{ color: "#64748B" }}>{a.action} {a.entity_type}</span>
                      </div>
                    </div>
                    <span className="text-xs shrink-0 ml-2" style={{ color: "#94A3B8" }}>{timeStr}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === "events" && (
        <Card>
          <CardHeader title="System Events" subtitle="Automated system alerts & events"
            action={
              <div className="flex items-center gap-2">
                {["", "info", "warning", "error", "critical"].map((s) => (
                  <button key={s || "all"} onClick={() => setSeverityFilter(s)}
                    className="px-2 py-1 text-[10px] font-medium rounded transition-all"
                    style={{
                      background: severityFilter === s ? "#1A3C5E" : "#F5F7FA",
                      color: severityFilter === s ? "#FFFFFF" : "#64748B",
                    }}>
                    {s || "All"}
                  </button>
                ))}
              </div>
            } />
          {loadingEvents ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#94A3B8" }} /></div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-6 h-6 mx-auto mb-2" style={{ color: "#94A3B8" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No system events recorded</p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredEvents.map((e: any, i: number) => {
                const colors = SEVERITY_COLORS[e.severity] || SEVERITY_COLORS.info;
                const SevIcon = e.severity === "error" || e.severity === "critical" ? AlertTriangle : Info;
                return (
                  <div key={e.id || i} className="flex items-start gap-3 py-3 px-1"
                    style={{ borderBottom: i < filteredEvents.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: colors.bg }}>
                      <SevIcon className="w-4 h-4" style={{ color: colors.text }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{e.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>{e.description || e.event_type}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={e.severity === "critical" ? "red" : e.severity === "error" ? "red" : e.severity === "warning" ? "amber" : "teal"}>{e.severity}</Badge>
                      <span className="text-[10px]" style={{ color: "#94A3B8" }}>
                        {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === "summary" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader title="Activity Stats" subtitle="Last 7 days" />
            <div className="space-y-3 text-sm">
              {[
                { label: "Total Actions", value: (logs || []).length, color: "#1A3C5E" },
                { label: "Unique Users", value: [...new Set((logs || []).map((l: any) => l.user_id))].length, color: "#2BAE8E" },
                { label: "System Events", value: (auditEvents || []).length, color: "#F5A623" },
              ].map((s) => (
                <div key={s.label} className="flex justify-between items-center p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <span style={{ color: "#64748B" }}>{s.label}</span>
                  <span className="font-bold text-lg" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Severity Breakdown" />
            <div className="space-y-2">
              {["info", "warning", "error", "critical"].map((sev) => {
                const count = (auditEvents || []).filter((e: any) => e.severity === sev).length;
                const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.info;
                return (
                  <div key={sev} className="flex items-center justify-between p-2 rounded-lg" style={{ background: colors.bg }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: colors.dot }} />
                      <span className="text-sm capitalize" style={{ color: colors.text }}>{sev}</span>
                    </div>
                    <span className="font-semibold" style={{ color: colors.text }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="Recent Activity Types" />
            <div className="space-y-2">
              {(Object.entries(
                (logs || []).reduce((acc, l: any) => {
                  const key = l.action || "unknown";
                  (acc as Record<string, number>)[key] = ((acc as Record<string, number>)[key] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([action, count]) => (
                <div key={action} className="flex items-center justify-between py-1">
                  <span className="text-sm" style={{ color: "#1A2E44" }}>{action}</span>
                  <Badge variant="gray">{count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
