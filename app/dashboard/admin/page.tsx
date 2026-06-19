"use client";

import { useState, useEffect } from "react";
import { Settings, Shield, Users, Activity, AlertCircle, Loader2, RefreshCw, CheckCircle, Eye, EyeOff, UserPlus, Clock, FileText, Key, Globe, Lock, Bell, Sliders, ToggleLeft, Server, Database, Download, Upload, Code, Mail, Smartphone, CreditCard } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import { useAdminUsers, useAuditLogs, useComplianceRecords } from "@/lib/hooks";

const SYSTEM_USERS = [
  { name: "Rajesh Mehta", email: "rajesh@samp.com", role: "Property Manager", property: "Oceanview Hotel", status: "active" },
  { name: "Sneha Kapoor", email: "sneha@samp.com", role: "Property Manager", property: "Cityscape Apts", status: "active" },
  { name: "Priya Sharma", email: "priya@samp.com", role: "Front Desk", property: "Oceanview Hotel", status: "active" },
  { name: "Ravi Kumar", email: "ravi@samp.com", role: "Housekeeping Staff", property: "Oceanview Hotel", status: "active" },
  { name: "Anita Desai", email: "anita@samp.com", role: "Finance Manager", property: "Global", status: "active" },
  { name: "Arjun Nair", email: "arjun@samp.com", role: "Maintenance Staff", property: "Oceanview Hotel", status: "inactive" },
  { name: "Priya Nair", email: "priya.n@samp.com", role: "HR Manager", property: "Global", status: "active" },
];

const AUDIT_LOGS = [
  { user: "Rajesh M.", action: "Updated rate plan — Deluxe King", time: "2 min ago" },
  { user: "Priya S.", action: "Checked in guest Room 1204", time: "15 min ago" },
  { user: "Anita D.", action: "Approved PO #PO-024", time: "1 hr ago" },
  { user: "Ravi K.", action: "Completed HK task Room 203", time: "2 hrs ago" },
  { user: "System", action: "Auto-backup completed", time: "3 hrs ago" },
  { user: "Sneha K.", action: "Modified corporate rate", time: "4 hrs ago" },
  { user: "Rajesh M.", action: "Added new property — Grand Palace Hotel", time: "6 hrs ago" },
];

const COMPLIANCE_ITEMS = [
  { label: "Fire Safety Certificate", status: "Valid", badge: "teal" as const, expiry: "31 Dec 2026" },
  { label: "Liquor License", status: "30d left", badge: "amber" as const, expiry: "15 Jul 2026" },
  { label: "RERA Registration", status: "Valid", badge: "teal" as const, expiry: "31 Mar 2027" },
  { label: "Pollution Clearance", status: "Expired", badge: "red" as const, expiry: "10 Jan 2026" },
  { label: "Fire NOC", status: "Valid", badge: "teal" as const, expiry: "30 Sep 2026" },
  { label: "GST Registration", status: "Valid", badge: "teal" as const, expiry: "—" },
];

function SkeletonLine() {
  return <div className="h-4 rounded animate-pulse mb-2" style={{ background: "#E2E8F0" }} />;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { users, isLoading: loadingUsers, mutate: mutateUsers } = useAdminUsers();
  const { logs, isLoading: loadingLogs, mutate: mutateLogs } = useAuditLogs(50);
  const { records, isLoading: loadingRecords, mutate: mutateRecords } = useComplianceRecords();

  const displayUsers = (users && (users as any[]).length > 0) ? (users as any[]) : SYSTEM_USERS;
  const displayLogs = (logs && (logs as any[]).length > 0) ? (logs as any[]) : AUDIT_LOGS;
  const displayCompliance = (records && (records as any[]).length > 0) ? (records as any[]) : COMPLIANCE_ITEMS;
  const isLoadingDisplay = (loadingUsers || loadingLogs || loadingRecords) && !users && !logs;

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  function handleRefresh() {
    setIsLoading(true);
    mutateUsers(); mutateLogs(); mutateRecords();
    setActionFeedback({ type: "success", message: "Dashboard refreshed" });
    setTimeout(() => setIsLoading(false), 800);
  }

  const activeUsers = displayUsers.filter((u: any) => u.is_active === true || u.status === "active").length;
  const inactiveUsers = displayUsers.filter((u: any) => u.is_active === false || u.status !== "active").length;
  const validCompliance = displayCompliance.filter((c: any) => c.status === "active" || c.badge === "teal").length;

  const TABS = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "users", label: "User Management", icon: Users },
    { key: "compliance", label: "Compliance", icon: Shield },
    { key: "audit", label: "Audit Log", icon: FileText },
    { key: "system", label: "System", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Admin & Configuration</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Global configuration, security, audit logs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setActionFeedback({ type: "success", message: "Settings saved" })}>
            <Sliders className="w-3.5 h-3.5" /> Save Settings
          </Button>
          <button onClick={handleRefresh} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
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

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap"
              style={{
                background: isActive ? "#1A3C5E" : "#F5F7FA",
                color: isActive ? "#FFFFFF" : "#64748B",
              }}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader title="System Health" />
              {isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <SkeletonLine key={i} />)}</div>
              ) : (
                <div className="space-y-2 text-sm">
                  {[
                    { label: "API Uptime", value: "99.97%", color: "#2BAE8E" },
                    { label: "Avg Response", value: "142ms", color: "#2BAE8E" },
                    { label: "Active Sessions", value: "247", color: "#1A3C5E" },
                    { label: "DB Connections", value: "18/50", color: "#1A3C5E" },
                    { label: "Cache Hit Rate", value: "94.2%", color: "#2BAE8E" },
                    { label: "Error Rate (24h)", value: "0.03%", color: "#2BAE8E" },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between">
                      <span style={{ color: "#64748B" }}>{s.label}</span>
                      <span className="font-medium" style={{ color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <CardHeader title="Compliance Vault" subtitle={`${validCompliance}/${displayCompliance.length} valid`} />
              {isLoadingDisplay && !displayCompliance.length ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <SkeletonLine key={i} />)}</div>
              ) : (
                <div className="space-y-2 text-sm">
                  {displayCompliance.slice(0, 5).map((c: any, i: number) => {
                    const label = c.certificate_type || c.label;
                    const status = c.status || c.status;
                    const badgeVariant = c.status === "active" || c.badge === "teal" ? "teal" as const : (c.status === "expired" || c.badge === "red" ? "red" as const : "amber" as const);
                    return (
                    <div key={c.id || i} className="flex items-center justify-between">
                      <span style={{ color: "#1A2E44" }}>{label}</span>
                      <Badge variant={badgeVariant}>{status}</Badge>
                    </div>
                  )})}
                </div>
              )}
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Audit Log" subtitle="Recent activity" />
              {isLoadingDisplay ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <SkeletonLine key={i} />)}</div>
              ) : (
                <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
                  {displayLogs.slice(0, 5).map((a: any, i: number) => {
                    const userName = a.user?.first_name ? `${a.user.first_name} ${a.user.last_name || ""}` : a.user || "System";
                    const actionText = `${a.action} ${a.entity_type}`;
                    const timeStr = a.created_at ? new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : a.time;
                    return (
                    <div key={a.id || i} className="flex justify-between py-1">
                      <span style={{ color: "#1A2E44" }}>
                        <span className="font-medium">{userName}</span> — {actionText}
                      </span>
                      <span className="shrink-0 ml-2" style={{ color: "#64748B" }}>{timeStr}</span>
                    </div>
                  )})}
                </div>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="Role Management" subtitle="12 system roles defined" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                { role: "Super Admin", count: 1, color: "#E53E3E" },
                { role: "Executive", count: 2, color: "#1A3C5E" },
                { role: "Property Manager", count: 2, color: "#1A3C5E" },
                { role: "Front Desk", count: 3, color: "#2BAE8E" },
                { role: "HK Staff", count: 8, color: "#2BAE8E" },
                { role: "Maintenance", count: 4, color: "#F5A623" },
                { role: "Finance", count: 2, color: "#1A3C5E" },
                { role: "HR", count: 1, color: "#2BAE8E" },
              ].map((r) => (
                <div key={r.role} className="p-3 rounded-lg flex items-center justify-between" style={{ background: "#F5F7FA" }}>
                  <span style={{ color: "#1A2E44" }}>{r.role}</span>
                  <span className="font-bold" style={{ color: r.color }}>{r.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {activeTab === "users" && (
        <Card>
          <CardHeader
              title="User Management"
              subtitle={`${displayUsers.length} users · ${activeUsers} active · ${inactiveUsers} inactive`}
            action={
              <Button variant="secondary" size="sm" onClick={() => setActionFeedback({ type: "success", message: "Add user form opened" })}>
                <UserPlus className="w-3.5 h-3.5" /> Add User
              </Button>
            }
          />
          {loadingUsers ? (
            <div className="space-y-1">{[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded animate-pulse" style={{ background: "#F5F7FA" }} />)}</div>
          ) : (
            <Table
              data={displayUsers}
              keyExtractor={(u: any) => u.id || Math.random()}
              columns={[
                { key: "name", header: "Name", render: (u: any) => <span className="font-medium text-sm">{u.first_name} {u.last_name || ""}</span> },
                { key: "email", header: "Email", render: (u: any) => <span className="text-xs" style={{ color: "#64748B" }}>{u.email}</span> },
                { key: "role", header: "Role", render: (u: any) => <Badge variant="gray">{u.user_roles?.[0]?.role?.name || u.role || "—"}</Badge> },
                { key: "property", header: "Scope", render: (u: any) => <span className="text-xs" style={{ color: "#64748B" }}>{u.user_roles?.[0]?.property_id ? "Specific" : "Global"}</span> },
                { key: "status", header: "Status", render: (u: any) => (
                  <Badge variant={u.is_active !== false ? "teal" : "red"}>{u.is_active !== false ? "active" : "inactive"}</Badge>
                )},
              ]}
            />
          )}
        </Card>
      )}

      {activeTab === "compliance" && (
        <Card>
          <CardHeader title="Compliance Vault" subtitle="Certificate & license management" />
          {loadingRecords ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <SkeletonLine key={i} />)}</div>
          ) : (
          <div className="grid gap-3">
            {displayCompliance.length === 0 ? (
              <div className="text-center py-8"><Shield className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} /><p className="text-sm" style={{ color: "#64748B" }}>No compliance records</p></div>
            ) : displayCompliance.map((c: any, i: number) => {
              const label = c.certificate_type || c.label;
              const expiry = c.expiry_date ? new Date(c.expiry_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : c.expiry || "N/A";
              const isActive = c.status === "active" || c.badge === "teal";
              const isExpired = c.status === "expired" || c.badge === "red";
              const badgeVariant = isActive ? "teal" as const : isExpired ? "red" as const : "amber" as const;
              const statusText = c.status || c.status;
              return (
              <div key={c.id || i} className="flex items-center justify-between p-4 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" style={{ color: isActive ? "#2BAE8E" : isExpired ? "#E53E3E" : "#F5A623" }} />
                  <div>
                    <div className="font-medium text-sm" style={{ color: "#1A2E44" }}>{label}</div>
                    <div className="text-xs" style={{ color: "#64748B" }}>Expires: {expiry}</div>
                  </div>
                </div>
                <Badge variant={badgeVariant}>{statusText}</Badge>
              </div>
            )})}
          </div>
          )}
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid #E2E8F0" }}>
            <p className="text-xs" style={{ color: "#64748B" }}>
              <AlertCircle className="w-3 h-3 inline mr-1" />
              {displayCompliance.filter((c: any) => c.status !== "active" && c.badge !== "teal").length} items require attention
            </p>
          </div>
        </Card>
      )}

      {activeTab === "audit" && (
        <Card>
          <CardHeader title="Audit Log" subtitle="Full activity history" />
          <div className="space-y-1 text-sm">
            {loadingLogs ? (
              [...Array(5)].map((_, i) => <SkeletonLine key={i} />)
            ) : displayLogs.length === 0 ? (
              <div className="text-center py-8"><FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} /><p className="text-sm" style={{ color: "#64748B" }}>No audit logs</p></div>
            ) : (
              displayLogs.map((a: any, i: number) => {
                const userName = a.user?.first_name ? `${a.user.first_name} ${a.user.last_name || ""}` : a.user || "System";
                const initial = userName.charAt(0);
                const timeStr = a.created_at ? new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : a.time;
                return (
                <div key={a.id || i} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < displayLogs.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#2C3547" }}>
                      {initial}
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: "#1A2E44" }}>{userName}</span>
                      <span className="ml-1" style={{ color: "#64748B" }}>{a.action} {a.entity_type}</span>
                    </div>
                  </div>
                  <span className="text-xs shrink-0 ml-2" style={{ color: "#64748B" }}>{timeStr}</span>
                </div>
              )})
            )}
          </div>
        </Card>
      )}

      {activeTab === "system" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Security Settings" subtitle="Authentication & access control" />
              <div className="space-y-4">
                {[
                  { label: "Multi-Factor Authentication", desc: "Require OTP for all admin logins", enabled: true },
                  { label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", enabled: true },
                  { label: "Password Expiry", desc: "Force password change every 90 days", enabled: true },
                  { label: "IP Whitelisting", desc: "Restrict dashboard access to office IPs", enabled: false },
                  { label: "Login Notifications", desc: "Email alert on new device login", enabled: true },
                  { label: "Rate Limiting", desc: "Max 5 failed attempts before temporary lockout", enabled: true },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{s.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>{s.desc}</div>
                    </div>
                    <div
                      onClick={() => setActionFeedback({ type: "success", message: `${s.label} toggled ${s.enabled ? "OFF" : "ON"}` })}
                      className="w-10 h-5 rounded-full cursor-pointer transition-colors relative"
                      style={{ background: s.enabled ? "#2BAE8E" : "#CBD5E1" }}
                    >
                      <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-all" style={{ left: s.enabled ? "5px" : "21px" }} />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => setActionFeedback({ type: "success", message: "Security settings saved" })}>
                <Shield className="w-3.5 h-3.5" /> Save Security Settings
              </Button>
            </Card>
            <Card>
              <CardHeader title="System Configuration" subtitle="Global system parameters" />
              <div className="space-y-3">
                {[
                  { key: "APP_NAME", value: "Enterprise HMS", editable: true },
                  { key: "TIMEZONE", value: "Asia/Kolkata (UTC+5:30)", editable: true },
                  { key: "CURRENCY", value: "INR (₹)", editable: true },
                  { key: "DATE_FORMAT", value: "DD-MMM-YYYY", editable: true },
                  { key: "MAX_LOGIN_ATTEMPTS", value: "5", editable: false },
                  { key: "SESSION_DURATION", value: "1800 seconds", editable: false },
                  { key: "API_RATE_LIMIT", value: "100 req/min", editable: true },
                  { key: "MAINTENANCE_MODE", value: "Disabled", editable: true },
                ].map((c) => (
                  <div key={c.key} className="flex items-center justify-between py-1.5">
                    <div>
                      <code className="text-xs font-mono" style={{ color: "#1A3C5E" }}>{c.key}</code>
                      <div className="text-xs" style={{ color: "#64748B" }}>{c.value}</div>
                    </div>
                    <Badge variant={c.editable ? "teal" : "gray"}>{c.editable ? "editable" : "system"}</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setActionFeedback({ type: "success", message: "Configuration updated" })}>
                <Sliders className="w-3.5 h-3.5" /> Edit Configuration
              </Button>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Backup & Restore" subtitle="Database and file backups" />
              <div className="space-y-3">
                {[
                  { type: "Full Database", size: "2.4 GB", date: "17 Jun 2026, 02:00 AM", status: "success" },
                  { type: "Media Files", size: "8.1 GB", date: "17 Jun 2026, 02:30 AM", status: "success" },
                  { type: "Configuration", size: "12 MB", date: "17 Jun 2026, 02:35 AM", status: "success" },
                  { type: "Logs Archive", size: "450 MB", date: "16 Jun 2026, 02:00 AM", status: "success" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(42,157,143,0.15)" }}>
                        <Database className="w-4 h-4" style={{ color: "#2BAE8E" }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{b.type}</div>
                        <div className="text-xs" style={{ color: "#64748B" }}>{b.size} · {b.date}</div>
                      </div>
                    </div>
                    <Badge variant="teal">{b.status}</Badge>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setActionFeedback({ type: "success", message: "Manual backup initiated" })}>
                  <Download className="w-3.5 h-3.5" /> Create Backup
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setActionFeedback({ type: "success", message: "Restore wizard opened" })}>
                  <Upload className="w-3.5 h-3.5" /> Restore
                </Button>
              </div>
              <div className="mt-3 pt-3 text-xs flex items-center gap-1" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
                <RefreshCw className="w-3 h-3" />
                Auto-backup runs daily at 2:00 AM. Last: <span className="font-medium" style={{ color: "#1A2E44" }}>Successful</span>
              </div>
            </Card>
            <Card>
              <CardHeader title="API Keys & Integrations" subtitle="Third-party service connections" />
              <div className="space-y-3">
                {[
                  { name: "Payment Gateway — Razorpay", key: "rzp_live_••••••••••", status: "active", lastUsed: "2 min ago" },
                  { name: "SMS Gateway — Twilio", key: "AC••••••••••••••", status: "active", lastUsed: "15 min ago" },
                  { name: "Email — SendGrid", key: "SG••••••••••••••••", status: "active", lastUsed: "5 min ago" },
                  { name: "Channel Manager — SiteMinder", key: "sm_••••••••••••••", status: "active", lastUsed: "1 hr ago" },
                  { name: "Analytics — Google Analytics", key: "UA-•••••••••", status: "inactive", lastUsed: "N/A" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: a.status === "active" ? "rgba(42,157,143,0.15)" : "rgba(148,163,184,0.15)" }}>
                        <Code className="w-3.5 h-3.5" style={{ color: a.status === "active" ? "#2BAE8E" : "#94A3B8" }} />
                      </div>
                      <div>
                        <div className="text-xs font-medium" style={{ color: "#1A2E44" }}>{a.name}</div>
                        <code className="text-[10px] font-mono" style={{ color: "#94A3B8" }}>{a.key}</code>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={a.status === "active" ? "teal" : "gray"}>{a.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setActionFeedback({ type: "success", message: "New API key generated" })}>
                  <Key className="w-3.5 h-3.5" /> Generate Key
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setActionFeedback({ type: "success", message: "Integration wizard opened" })}>
                  <Globe className="w-3.5 h-3.5" /> Add Integration
                </Button>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Notification Templates" subtitle="System email & SMS templates" />
            <div className="space-y-3">
              {[
                { name: "Welcome Email", channel: "Email", lastEdited: "10 Jun 2026", status: "active", icon: Mail },
                { name: "Booking Confirmation", channel: "Email", lastEdited: "08 Jun 2026", status: "active", icon: Mail },
                { name: "Check-in Reminder", channel: "SMS", lastEdited: "05 Jun 2026", status: "active", icon: Smartphone },
                { name: "Invoice Notification", channel: "Email", lastEdited: "01 Jun 2026", status: "active", icon: Mail },
                { name: "Feedback Request", channel: "Email", lastEdited: "28 May 2026", status: "draft", icon: Mail },
                { name: "Maintenance Alert", channel: "SMS", lastEdited: "25 May 2026", status: "active", icon: Smartphone },
                { name: "Promotional Offer", channel: "Both", lastEdited: "20 May 2026", status: "draft", icon: Bell },
              { name: "System Alert", channel: "SMS", lastEdited: "18 May 2026", status: "active", icon: Smartphone },
              ].map((t, i) => {
                const Icon = t.icon;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: t.status === "active" ? "rgba(42,157,143,0.15)" : "rgba(245,166,35,0.15)" }}>
                        <Icon className="w-4 h-4" style={{ color: t.status === "active" ? "#2BAE8E" : "#F5A623" }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{t.name}</div>
                        <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: "#64748B" }}>
                          <span>{t.channel}</span>
                          <span>·</span>
                          <span>Last edited: {t.lastEdited}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={t.status === "active" ? "teal" : "amber"}>{t.status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => setActionFeedback({ type: "success", message: `${t.name} template opened for editing` })}>
                        <FileText className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => setActionFeedback({ type: "success", message: "New template editor opened" })}>
              <Bell className="w-3.5 h-3.5" /> Create New Template
            </Button>
          </Card>

          <Card>
            <CardHeader title="Server Status Monitor" subtitle="Real-time system health" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { service: "Web Server", status: "operational", uptime: "99.99%", icon: Server },
                { service: "Database", status: "operational", uptime: "99.97%", icon: Database },
                { service: "Redis Cache", status: "operational", uptime: "100%", icon: Database },
                { service: "Email Service", status: "degraded", uptime: "98.2%", icon: Mail },
                { service: "SMS Gateway", status: "operational", uptime: "99.9%", icon: Smartphone },
                { service: "Payment Gateway", status: "operational", uptime: "99.99%", icon: CreditCard },
                { service: "CDN", status: "operational", uptime: "100%", icon: Globe },
              { service: "Backup Service", status: "operational", uptime: "99.95%", icon: Database },
              { service: "Monitoring Stack", status: "operational", uptime: "100%", icon: Activity },
              { service: "Load Balancer", status: "operational", uptime: "99.99%", icon: Server },
              { service: "CI/CD Pipeline", status: "operational", uptime: "99.8%", icon: RefreshCw },
              { service: "DNS Servers", status: "operational", uptime: "100%", icon: Globe },
            ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.service} className="p-3 rounded-lg text-center" style={{ background: "#F5F7FA" }}>
                    <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.status === "operational" ? "#2BAE8E" : "#F5A623" }} />
                    <div className="text-xs font-medium" style={{ color: "#1A2E44" }}>{s.service}</div>
                    <div className="text-[10px]" style={{ color: "#64748B" }}>{s.uptime}</div>
                    <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: s.status === "operational" ? "#2BAE8E" : "#F5A623" }} />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
              <span><RefreshCw className="w-3 h-3 inline mr-1" /> Overall uptime this month</span>
              <span className="font-semibold" style={{ color: "#2BAE8E" }}>99.94%</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
