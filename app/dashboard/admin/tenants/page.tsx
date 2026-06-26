"use client";

import { useState, useEffect } from "react";
import {
  Building2, Hotel, Home, Briefcase, Server, Database, Shield,
  Ban, CheckCircle, X, Loader2, AlertCircle, Globe, ChevronDown,
  Search, RefreshCw, MoreHorizontal, Edit3, ArrowUpRight
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
          <Shield className="w-10 h-10 mx-auto mb-2" style={{ color: "#E53E3E" }} />
          <p className="font-medium" style={{ color: "#1A3C5E" }}>Platform admin access required</p>
          <p className="text-sm" style={{ color: "#64748B" }}>Only eHMS platform superadmins can manage tenants.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A3C5E" }}>Tenant Management</h1>
          <p className="text-sm" style={{ color: "#64748B" }}>Provision, edit, and suspend organization shards</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadTenants} className="p-2 rounded-lg transition-colors"
            style={{ color: "#64748B" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/tenants"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)", color: "#FFF" }}
          >
            <Globe className="w-4 h-4" /> New Shard
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#2BAE8E" }} />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 py-8 text-sm" style={{ color: "#E53E3E" }}>
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
                  background: "#FFFFFF",
                  border: `1px solid ${suspended ? "rgba(229,62,62,0.15)" : "#E2E8F0"}`,
                  opacity: suspended ? 0.75 : 1,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: suspended ? "rgba(229,62,62,0.08)" : "rgba(43,174,142,0.08)" }}
                    >
                      <Building2 className="w-5 h-5" style={{ color: suspended ? "#E53E3E" : "#2BAE8E" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: "#1A3C5E" }}>{t.name}</h3>
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(43,174,142,0.08)", color: "#2BAE8E", border: "1px solid rgba(43,174,142,0.15)" }}
                        >{t.code}</span>
                        {suspended && (
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E" }}
                          >
                            <Ban className="w-3 h-3" /> Suspended
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono" style={{ color: "#94A3B8" }}>schema: {t.schema_name}</span>
                        {t.domain && <span className="text-xs" style={{ color: "#94A3B8" }}>{t.domain}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(getWorkspaces(t).length > 0 ? getWorkspaces(t) : verticals.map(v => ({ type: v, name: VERTICAL_LABELS[v]?.label || v, is_primary: false }))).map((ws) => {
                          const meta = VERTICAL_LABELS[ws.type];
                          const Icon = meta?.icon || Building2;
                          return (
                            <span key={ws.type + ws.name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                              style={{ background: ws.is_primary ? "rgba(43,174,142,0.1)" : "rgba(43,174,142,0.06)", color: ws.is_primary ? "#2BAE8E" : "rgba(43,174,142,0.7)", border: `1px solid ${ws.is_primary ? "rgba(43,174,142,0.2)" : "rgba(43,174,142,0.1)"}` }}
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
                      style={{ color: "#64748B" }}
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

function getWorkspaces(tenant: TenantRecord): { type: string; name: string; is_primary: boolean }[] {
  const ws = (tenant.config || {}).workspaces as { type: string; name: string; is_primary?: boolean }[] | undefined;
  if (ws && Array.isArray(ws) && ws.length > 0) {
    return ws.map((w) => ({ type: w.type, name: w.name, is_primary: w.is_primary || false }));
  }
  const verts = ((tenant.config || {}).verticals as string[]) || ["hotels"];
  return verts.map((v, i) => ({ type: v, name: tenant.name || v, is_primary: i === 0 }));
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
    setWorkspaces((prev) => [...prev, { type: "hotels", name: "", is_primary: false }]);
  }

  function removeWorkspace(index: number) {
    setWorkspaces((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((w) => w.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  }

  function setPrimary(index: number) {
    setWorkspaces((prev) =>
      prev.map((w, i) => ({ ...w, is_primary: i === index }))
    );
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
      <div className="relative w-full max-w-lg rounded-2xl p-6 bg-white shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
          style={{ color: "#64748B" }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(43,174,142,0.1)" }}
          >
            <Globe className="w-5 h-5" style={{ color: "#2BAE8E" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{tenant.name}</h3>
            <p className="text-xs font-mono" style={{ color: "#94A3B8" }}>{tenant.code} &middot; {tenant.schema_name}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#1A2E44" }}>
              Subscribed Platform Features
            </label>
            <div className="grid grid-cols-2 gap-2">
              {verticalOptions.map((v) => {
                const sel = selected.includes(v.key);
                const Icon = v.icon;
                return (
                  <button key={v.key} type="button" onClick={() => toggle(v.key)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left"
                    style={{
                      background: sel ? "rgba(43,174,142,0.08)" : "#F5F7FA",
                      border: `1px solid ${sel ? "rgba(43,174,142,0.25)" : "#E2E8F0"}`,
                      color: sel ? "#2BAE8E" : "#64748B",
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

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#1A2E44" }}>
              Workspace Names
            </label>
            <div className="space-y-2">
              {workspaces.map((ws, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ background: "#F5F7FA", border: "1px solid #E2E8F0" }}
                >
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <select value={ws.type} onChange={(e) => updateWorkspace(i, "type", e.target.value)}
                      className="text-xs rounded-lg px-2 py-1.5 border"
                      style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
                    >
                      {verticalOptions.map((v) => (
                        <option key={v.key} value={v.key}>{v.label}</option>
                      ))}
                    </select>
                    <input type="text" value={ws.name} onChange={(e) => updateWorkspace(i, "name", e.target.value)}
                      placeholder="Workspace name" maxLength={100}
                      className="text-xs rounded-lg px-2 py-1.5 border"
                      style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
                    />
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer shrink-0"
                    title="Set as primary workspace"
                  >
                    <input type="radio" name="ws-primary" checked={ws.is_primary}
                      onChange={() => setPrimary(i)}
                      style={{ accentColor: "#2BAE8E" }}
                    />
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>Primary</span>
                  </label>
                  {workspaces.length > 1 && (
                    <button onClick={() => removeWorkspace(i)}
                      className="p-1 rounded hover:bg-red-50"
                      style={{ color: "#E53E3E" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addWorkspace}
                className="w-full py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ border: "1px dashed #CBD5E1", color: "#64748B" }}
              >
                + Add Workspace
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
              style={{ background: isSuspended ? "rgba(229,62,62,0.05)" : "#F5F7FA", border: `1px solid ${isSuspended ? "rgba(229,62,62,0.15)" : "#E2E8F0"}` }}
            >
              <input type="checkbox" checked={isSuspended} onChange={(e) => setIsSuspended(e.target.checked)}
                style={{ accentColor: "#E53E3E" }}
              />
              <div>
                <div className="text-sm font-medium" style={{ color: isSuspended ? "#E53E3E" : "#1A3C5E" }}>
                  {isSuspended ? "Suspended" : "Active"}
                </div>
                <div className="text-xs" style={{ color: "#94A3B8" }}>
                  Suspended tenants block all authentication while preserving data
                </div>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ border: "1px solid #E2E8F0", color: "#64748B" }}
            >
              Cancel
            </button>
            <button onClick={() => onSave({ verticals: selected, suspended: isSuspended, workspaces })} disabled={saving || selected.length === 0}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
