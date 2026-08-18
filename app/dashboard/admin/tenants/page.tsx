"use client";

import { useState, useEffect } from "react";
import {
  Building2, Hotel, Home, Briefcase, Server, Database, Shield,
  Ban, CheckCircle, X, Loader2, AlertCircle, Globe, ChevronDown,
  Search, RefreshCw, MoreHorizontal, Edit3, ArrowUpRight, Mail
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface TenantRecord {
  id: string;
  name: string;
  code: string;
  schema_name: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  domain: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
}

const VERTICAL_LABELS: Record<string, { label: string; icon: typeof Building2 }> = {
  hotels: { label: "Hotels & Resorts", icon: Hotel },
  apartments: { label: "Serviced Apartments", icon: Building2 },
  rental: { label: "Apartment Rental", icon: Home },
  workplace: { label: "Workplace", icon: Briefcase },
};

export default function AdminTenantsPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<TenantRecord | null>(null);
  const [saving, setSaving] = useState(false);

  function loadTenants() {
    setLoading(true);
    setError(null);
    fetch("/api/admin/tenants")
      .then((r) => r.json())
      .then((data) => {
        if (data.tenants) setTenants(data.tenants);
        else setError(data.error || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTenants(); }, []);

  async function handleUpdate(code: string, payload: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        loadTenants();
        setEditTarget(null);
      } else {
        alert(data.error || "Update failed");
      }
    } catch {
      alert("Network error");
    }
    setSaving(false);
  }

  function getVerticals(t: TenantRecord): string[] {
    const c = t.config || {};
    return (c.verticals as string[]) || ["hotels", "apartments", "rental", "workplace"];
  }

  function getWorkspaces(t: TenantRecord): { type: string; name: string; is_primary: boolean }[] {
    const c = t.config || {};
    const ws = c.workspaces as { type: string; name: string; is_primary: boolean }[] | undefined;
    return ws && ws.length > 0 ? ws : [];
  }

  function isSuspended(t: TenantRecord): boolean {
    return (t.config || {}).suspended === true;
  }

  if (!user || !user.is_platform_admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-danger)" }} />
          <p className="font-medium" style={{ color: "var(--color-navy)" }}>Platform admin access required</p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Only eHMS platform superadmins can manage tenants.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>Tenant Management</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Provision, edit, and suspend organization shards</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadTenants} className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/tenants"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)", color: "var(--color-on-dark)" }}
          >
            <Globe className="w-4 h-4" /> New Shard
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 py-8 text-sm" style={{ color: "var(--color-danger)" }}>
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {tenants.map((t) => {
            const verticals = getVerticals(t);
            const suspended = isSuspended(t);
            return (
              <div key={t.id}
                className="rounded-xl p-5 transition-all hover:shadow-md"
                style={{
                  background: "var(--color-white)",
                  border: `1px solid ${suspended ? "rgba(var(--color-danger-rgb),0.15)" : "var(--color-border)"}`,
                  opacity: suspended ? 0.75 : 1,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: suspended ? "rgba(var(--color-danger-rgb),0.08)" : "rgba(var(--color-primary-rgb),0.08)" }}
                    >
                      <Building2 className="w-5 h-5" style={{ color: suspended ? "var(--color-danger)" : "var(--color-primary)" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: "var(--color-navy)" }}>{t.name}</h3>
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(var(--color-primary-rgb),0.08)", color: "var(--color-primary)", border: "1px solid rgba(var(--color-primary-rgb),0.15)" }}
                        >{t.code}</span>
                        {suspended && (
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: "rgba(var(--color-danger-rgb),0.08)", color: "var(--color-danger)" }}
                          >
                            <Ban className="w-3 h-3" /> Suspended
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono" style={{ color: "var(--color-text-faint)" }}>schema: {t.schema_name}</span>
                        {t.domain && <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>{t.domain}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(getWorkspaces(t).length > 0 ? getWorkspaces(t) : verticals.map(v => ({ type: v, name: VERTICAL_LABELS[v]?.label || v, is_primary: false }))).map((ws) => {
                          const meta = VERTICAL_LABELS[ws.type];
                          const Icon = meta?.icon || Building2;
                          return (
                            <span key={ws.type + ws.name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                              style={{ background: ws.is_primary ? "rgba(var(--color-primary-rgb),0.1)" : "rgba(var(--color-primary-rgb),0.06)", color: ws.is_primary ? "var(--color-primary)" : "rgba(var(--color-primary-rgb),0.7)", border: `1px solid ${ws.is_primary ? "rgba(var(--color-primary-rgb),0.2)" : "rgba(var(--color-primary-rgb),0.1)"}` }}
                            >
                              <Icon className="w-3 h-3" /> {ws.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditTarget(t)}
                      className="p-2 rounded-lg transition-colors text-xs font-medium"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <EditTenantModal
          tenant={editTarget}
          saving={saving}
          onSave={(payload) => handleUpdate(editTarget.code, payload)}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

function getWorkspaces(tenant: TenantRecord): { type: string; name: string; is_primary: boolean; suspended: boolean }[] {
  const ws = (tenant.config || {}).workspaces as { type: string; name: string; is_primary?: boolean; suspended?: boolean }[] | undefined;
  if (ws && Array.isArray(ws) && ws.length > 0) {
    return ws.map((w) => ({ type: w.type, name: w.name, is_primary: w.is_primary || false, suspended: w.suspended || false }));
  }
  const verts = ((tenant.config || {}).verticals as string[]) || ["hotels"];
  return verts.map((v, i) => ({ type: v, name: VERTICAL_LABELS[v]?.label || v, is_primary: i === 0, suspended: false }));
}

function EditTenantModal({
  tenant, saving, onSave, onClose,
}: {
  tenant: TenantRecord;
  saving: boolean;
  onSave: (payload: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const verticals = ((tenant.config || {}).verticals as string[]) || ["hotels", "apartments", "rental", "workplace"];
  const suspended = (tenant.config || {}).suspended === true;
  const existingWorkspaces = getWorkspaces(tenant);

  const [selected, setSelected] = useState<string[]>(verticals);
  const [isSuspended, setIsSuspended] = useState(suspended);
  const [workspaces, setWorkspaces] = useState(existingWorkspaces);
  const [contactEmail, setContactEmail] = useState(tenant.contact_email || ((tenant.config || {}).contact_email as string) || "");
  const [resetResult, setResetResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);
  const [deleteCheck, setDeleteCheck] = useState<{
    checking: boolean;
    result: { safe_to_delete: boolean; service_counts: Record<string, number>; total_services: number } | null;
    error: string | null;
  }>({ checking: false, result: null, error: null });

  function toggle(v: string) {
    setSelected((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }

  function updateWorkspace(index: number, field: string, value: string | boolean) {
    setWorkspaces((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w))
    );
  }

  function addWorkspace() {
    setWorkspaces((prev) => [...prev, { type: "hotels", name: "", is_primary: false, suspended: false }]);
  }

  async function confirmRemoveWorkspace(index: number) {
    setDeletingIdx(index);
    setDeleteCheck({ checking: true, result: null, error: null });
    const ws = workspaces[index];
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.code}/workspaces/${ws.type}`);
      const data = await res.json();
      if (res.ok) {
        setDeleteCheck({ checking: false, result: data, error: null });
      } else {
        setDeleteCheck({ checking: false, result: null, error: data.error || "Check failed" });
      }
    } catch {
      setDeleteCheck({ checking: false, result: null, error: "Network error" });
    }
  }

  function executeRemoveWorkspace(index: number) {
    setWorkspaces((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((w) => w.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
    setDeletingIdx(null);
    setDeleteCheck({ checking: false, result: null, error: null });
  }

  function setPrimary(index: number) {
    setWorkspaces((prev) =>
      prev.map((w, i) => ({ ...w, is_primary: i === index }))
    );
  }

  async function handleResetPassword() {
    if (!confirm("This will generate a new password and email it to the tenant admin. Continue?")) return;
    if (!contactEmail) {
      setResetResult({ ok: false, msg: "Please enter a contact email before resetting the password." });
      return;
    }
    setResetting(true);
    setResetResult(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.code}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_email: contactEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetResult({ ok: true, msg: data.message });
      } else {
        setResetResult({ ok: false, msg: data.error || "Reset failed" });
      }
    } catch {
      setResetResult({ ok: false, msg: "Network error" });
    }
    setResetting(false);
  }

  const verticalOptions = [
    { key: "hotels", label: "Hotels & Resorts", icon: Hotel },
    { key: "apartments", label: "Serviced Apartments", icon: Building2 },
    { key: "rental", label: "Apartment Rental", icon: Home },
    { key: "workplace", label: "Workplace", icon: Briefcase },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full max-w-4xl rounded-2xl p-6 bg-white shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(var(--color-primary-rgb),0.1)" }}
          >
            <Globe className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>{tenant.name}</h3>
            <p className="text-xs font-mono" style={{ color: "var(--color-text-faint)" }}>{tenant.code} &middot; {tenant.schema_name}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
              <Mail className="w-3.5 h-3.5 inline mr-1" /> Contact Email
            </label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
              placeholder="admin@org.com"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-navy)" }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text)" }}>
                Subscribed Features
              </label>
              <div className="grid grid-cols-1 gap-2">
                {verticalOptions.map((v) => {
                  const sel = selected.includes(v.key);
                  const Icon = v.icon;
                  return (
                    <button key={v.key} type="button" onClick={() => toggle(v.key)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
                      style={{
                        background: sel ? "rgba(var(--color-primary-rgb),0.08)" : "var(--color-light)",
                        border: `1px solid ${sel ? "rgba(var(--color-primary-rgb),0.25)" : "var(--color-border)"}`,
                        color: sel ? "var(--color-primary)" : "var(--color-text-muted)",
                      }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {v.label}
                      {sel && <CheckCircle className="w-3 h-3 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  Workspace Names
                </label>
                <button onClick={addWorkspace}
                  className="text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded transition-colors"
                  style={{ color: "var(--color-primary)" }}
                >
                  + Add Workspace
                </button>
              </div>
              <div className="space-y-3">
                {workspaces.map((ws, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "var(--color-light)", border: "1px solid var(--color-border)" }}
                  >
                    <div className="flex-1 space-y-2">
                      <select value={ws.type} onChange={(e) => updateWorkspace(i, "type", e.target.value)}
                        className="w-full text-sm rounded-lg px-3 py-2 border"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-navy)" }}
                      >
                        {verticalOptions.map((v) => (
                          <option key={v.key} value={v.key}>{v.label}</option>
                        ))}
                      </select>
                      <input type="text" value={ws.name} onChange={(e) => updateWorkspace(i, "name", e.target.value)}
                        placeholder="Enter workspace name (e.g. Grand Hyatt)"
                        maxLength={100}
                        className="w-full text-sm rounded-lg px-3 py-2 border"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-navy)" }}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium"
                        title="Set as primary workspace"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <input type="radio" name="ws-primary" checked={ws.is_primary}
                          onChange={() => setPrimary(i)}
                          style={{ accentColor: "var(--color-primary)" }}
                        />
                        Primary
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium"
                        title="Suspend this workspace"
                        style={{ color: ws.suspended ? "var(--color-danger)" : "var(--color-text-muted)" }}
                      >
                        <input type="checkbox" checked={ws.suspended}
                          onChange={(e) => updateWorkspace(i, "suspended", e.target.checked)}
                          style={{ accentColor: "var(--color-danger)" }}
                        />
                        Suspend
                      </label>
                      {workspaces.length > 1 && (
                        <button onClick={() => confirmRemoveWorkspace(i)}
                          className="p-1 rounded hover:bg-red-50 text-xs mt-0.5"
                          style={{ color: "var(--color-danger)" }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delete workspace confirmation */}
          {deletingIdx !== null && (
            <div className="rounded-lg p-4" style={{ background: "rgba(var(--color-danger-rgb),0.04)", border: "1px solid rgba(var(--color-danger-rgb),0.15)" }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--color-danger)" }}>Remove Workspace</span>
              </div>
              {deleteCheck.checking ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking for provisioned services...
                </div>
              ) : deleteCheck.error ? (
                <p className="text-xs" style={{ color: "var(--color-danger)" }}>{deleteCheck.error}</p>
              ) : deleteCheck.result ? (
                <div>
                  {deleteCheck.result.safe_to_delete ? (
                    <>
                      <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
                        No services provisioned for this workspace. Are you sure you want to remove <strong>{workspaces[deletingIdx]?.name}</strong>?
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => { setDeletingIdx(null); setDeleteCheck({ checking: false, result: null, error: null }); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                        >
                          Cancel
                        </button>
                        <button onClick={() => executeRemoveWorkspace(deletingIdx)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                          style={{ background: "var(--color-danger)" }}
                        >
                          Yes, Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs mb-2" style={{ color: "var(--color-danger)" }}>
                        Cannot remove <strong>{workspaces[deletingIdx]?.name}</strong> — {deleteCheck.result.total_services} service(s) are provisioned:
                      </p>
                      <ul className="text-xs space-y-1 mb-3" style={{ color: "var(--color-text-muted)" }}>
                        {Object.entries(deleteCheck.result.service_counts)
                          .filter(([, count]) => count > 0)
                          .map(([label, count]) => (
                            <li key={label} className="flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-danger)" }} />
                              {label}: {count}
                            </li>
                          ))}
                      </ul>
                      <button onClick={() => { setDeletingIdx(null); setDeleteCheck({ checking: false, result: null, error: null }); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                style={{ background: isSuspended ? "rgba(var(--color-danger-rgb),0.05)" : "var(--color-light)", border: `1px solid ${isSuspended ? "rgba(var(--color-danger-rgb),0.15)" : "var(--color-border)"}` }}
              >
                <input type="checkbox" checked={isSuspended} onChange={(e) => setIsSuspended(e.target.checked)}
                  style={{ accentColor: "var(--color-danger)" }}
                />
                <div>
                  <div className="text-sm font-medium" style={{ color: isSuspended ? "var(--color-danger)" : "var(--color-navy)" }}>
                    {isSuspended ? "Suspended" : "Active"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                    Blocks authentication, preserves data
                  </div>
                </div>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>Admin Actions</span>
              </div>
              <button type="button" onClick={handleResetPassword} disabled={resetting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-warning)" }}
              >
                {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                {resetting ? "Resetting..." : "Reset Password & Resend Welcome"}
              </button>
              {resetResult && (
                <div className={`mt-2 rounded-lg px-3 py-2 text-xs flex items-start gap-2 ${
                  resetResult.ok ? "text-green-700" : "text-red-600"
                }`}
                  style={{ background: resetResult.ok ? "rgba(var(--color-primary-rgb),0.08)" : "rgba(var(--color-danger-rgb),0.08)" }}
                >
                  {resetResult.ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                  <span>{resetResult.msg}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            >
              Cancel
            </button>
            <button onClick={() => onSave({ verticals: selected, suspended: isSuspended, workspaces, contact_email: contactEmail || null })} disabled={saving || selected.length === 0}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
