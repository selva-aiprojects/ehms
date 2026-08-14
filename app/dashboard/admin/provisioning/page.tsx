"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Loader2, RefreshCw, CheckCircle, AlertCircle, PackageCheck,
  Shield, Globe, CreditCard, Zap, ChevronDown, ChevronRight,
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface TenantRecord {
  id: string;
  name: string;
  code: string;
  schema_name: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
  created_at: string;
}

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tier: string;
  price: number | null;
  billing_period: string;
  is_active: boolean;
}

interface Vertical {
  code: string;
  label: string;
  subscribed: boolean;
}

interface FlagRow {
  flag_key: string;
  name: string;
  category: string;
  status: string;
  default_enabled: boolean;
  availability: Array<{ vertical_name: string; min_tier: string | null }>;
  granted: boolean | null;
}

interface Subscription {
  tenant_id: string;
  plan_id: string | null;
  plan_name: string | null;
  tier: string;
  status: string;
  subscribed_verticals: string[];
  price: number | null;
  billing_period: string;
}

const STATUS_OPTIONS = ["active", "trial", "paused", "cancelled"];

const CATEGORY_LABELS: Record<string, string> = {
  hospitality: "Hospitality Core",
  commercial: "Commercial",
  industrial: "Industrial & Logistics",
  land: "Land Promotion",
  admin: "Infrastructure",
  ai_agents: "AI Agents",
  maintenance: "Maintenance",
};

export default function ProvisioningPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    tenant: TenantRecord;
    subscription: Subscription | null;
    plans: Plan[];
    verticals: Vertical[];
    flags: FlagRow[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [form, setForm] = useState<{
    plan_id: string;
    tier: string;
    status: string;
    subscribed_verticals: string[];
    price: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>("hospitality");

  const loadTenants = useCallback(() => {
    fetch("/api/admin/tenants")
      .then((r) => r.json())
      .then((data) => {
        if (data.tenants) setTenants(data.tenants);
        else setError(data.error || "Failed to load tenants");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  async function openTenant(code: string) {
    setSelected(code);
    setDetailLoading(true);
    setDetail(null);
    setFeedback(null);
    try {
      const res = await fetch(`/api/platform/tenants/${code}/provision`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setDetail(data);
      setForm({
        plan_id: data.subscription?.plan_id || "",
        tier: data.subscription?.tier || "basic",
        status: data.subscription?.status || "active",
        subscribed_verticals: data.subscription?.subscribed_verticals || [],
        price: data.subscription?.price != null ? String(data.subscription.price) : "",
      });
    } catch (e) {
      setFeedback({ type: "error", message: e instanceof Error ? e.message : "Failed to load" });
    }
    setDetailLoading(false);
  }

  function toggleVertical(code: string) {
    if (!form) return;
    const next = form.subscribed_verticals.includes(code)
      ? form.subscribed_verticals.filter((v) => v !== code)
      : [...form.subscribed_verticals, code];
    setForm({ ...form, subscribed_verticals: next });
  }

  async function handleSave() {
    if (!detail || !form) return;
    if (form.subscribed_verticals.length === 0) {
      setFeedback({ type: "error", message: "Select at least one vertical" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/platform/tenants/${detail.tenant.code}/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: form.plan_id || undefined,
          tier: form.tier,
          status: form.status,
          subscribed_verticals: form.subscribed_verticals,
          price: form.price !== "" ? Number(form.price) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Provisioning failed");
      setFeedback({
        type: "success",
        message: `${data.message}. ${data.granted.length} module(s) granted, ${data.revoked.length} revoked.`,
      });
      openTenant(detail.tenant.code);
    } catch (e) {
      setFeedback({ type: "error", message: e instanceof Error ? e.message : "Provisioning failed" });
    }
    setSaving(false);
  }

  const groupedFlags = (detail?.flags || []).reduce<Record<string, FlagRow[]>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  const categoryOrder = ["hospitality", "admin", "commercial", "industrial", "land", "ai_agents", "maintenance"];

  return (
    <div className="space-y-6">
      {!user || !user.is_platform_admin ? (
        <Card>
          <div className="py-16 text-center">
            <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-danger)" }} />
            <p className="font-medium" style={{ color: "var(--color-navy)" }}>Platform admin access required</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Only eHMS platform superadmins can provision tenant subscriptions.
            </p>
          </div>
        </Card>
      ) : (<>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>Subscription Provisioning</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Provision workspaces & feature modules per tenant based on their subscription plan
          </p>
        </div>
        <Button onClick={() => { setLoading(true); setError(null); loadTenants(); }} disabled={loading} size="sm">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {feedback && (
        <div
          className="rounded-lg px-4 py-3 flex items-start gap-3 text-sm"
          style={{
            background: feedback.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
            border: `1px solid ${feedback.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
            color: feedback.type === "success" ? "#059669" : "#DC2626",
          }}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>{feedback.message}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Tenant list */}
        <Card>
          <CardHeader title="Tenants" subtitle="Select an organization shard" />
          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--color-primary)" }} />
              </div>
            ) : error ? (
              <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>
            ) : (
              tenants.map((t) => {
                const active = selected === t.code;
                return (
                  <button
                    key={t.id}
                    onClick={() => openTenant(t.code)}
                    className={`w-full text-left rounded-lg px-4 py-3 transition-all border ${
                      active ? "border-primary" : "border-transparent"
                    }`}
                    style={{
                      background: active ? "rgba(59, 130, 246, 0.08)" : "var(--color-white)",
                      borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(59, 130, 246, 0.12)" }}>
                        <Building2 className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: "var(--color-navy)" }}>{t.name}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {t.code} · {t.schema_name}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Detail panel */}
        <div className="space-y-6">
          {detailLoading ? (
            <Card>
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-primary)" }} />
              </div>
            </Card>
          ) : !detail ? (
            <Card>
              <div className="py-16 text-center">
                <PackageCheck className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-text-faint)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Select a tenant to view and edit its subscription.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Subscription form */}
              <Card>
                <CardHeader
                  title={`${detail.tenant.name} — Subscription`}
                  subtitle={`${detail.tenant.code} · shard ${detail.tenant.schema_name}`}
                  action={
                    <Badge variant={detail.subscription?.status === "active" ? "teal" : detail.subscription?.status === "trial" ? "amber" : "red"}>
                      {detail.subscription?.status || "no subscription"}
                    </Badge>
                  }
                />
                {form && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                          Subscription Plan
                        </label>
                        <select
                          value={form.plan_id}
                          onChange={(e) => {
                            const plan = detail.plans.find((p) => p.id === e.target.value);
                            setForm({ ...form, plan_id: e.target.value, tier: plan?.tier || form.tier });
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm border"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        >
                          <option value="">Custom / No plan</option>
                          {detail.plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.tier} — ₹{p.price ?? "TBD"})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                          Tier
                        </label>
                        <select
                          value={form.tier}
                          onChange={(e) => setForm({ ...form, tier: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm border"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        >
                          {["basic", "professional", "enterprise"].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                          Status
                        </label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-sm border"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                          Price (placeholder — update later)
                        </label>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" style={{ color: "var(--color-text-faint)" }} />
                          <input
                            type="number"
                            min={0}
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            placeholder="e.g. 7999"
                            className="w-full px-3 py-2 rounded-lg text-sm border"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                          Billing Period
                        </label>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                          <Zap className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                          Monthly
                        </div>
                      </div>
                    </div>

                    {/* Verticals */}
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
                        Subscribed Verticals
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {detail.verticals.map((v) => {
                          const checked = form.subscribed_verticals.includes(v.code);
                          return (
                            <button
                              key={v.code}
                              onClick={() => toggleVertical(v.code)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                checked ? "border-primary" : "border-gray-200"
                              }`}
                              style={{
                                background: checked ? "var(--color-primary)" : "var(--color-white)",
                                color: checked ? "var(--color-on-dark)" : "var(--color-text)",
                                borderColor: checked ? "var(--color-primary)" : "var(--color-border)",
                              }}
                            >
                              {checked ? "✓ " : "+ "}{v.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? "Provisioning..." : "Provision Modules"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Flag matrix */}
              <Card>
                <CardHeader
                  title="Feature Module Matrix"
                  subtitle="Modules auto-granted / revoked in the tenant shard based on the subscription"
                  action={
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" style={{ color: "#10B981" }} /> granted</span>
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" style={{ color: "#EF4444" }} /> revoked</span>
                    </div>
                  }
                />
                <div className="space-y-3">
                  {categoryOrder.map((category) => {
                    const flags = groupedFlags[category] || [];
                    if (flags.length === 0) return null;
                    const isExpanded = expandedCategory === category;
                    const grantedCount = flags.filter((f) => f.granted === true).length;
                    return (
                      <div key={category} className="rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? "" : category)}
                          className="w-full px-4 py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm" style={{ color: "var(--color-navy)" }}>
                              {CATEGORY_LABELS[category] || category}
                            </span>
                            <Badge variant="teal" className="text-[10px]">{grantedCount}/{flags.length} granted</Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                          ) : (
                            <ChevronRight className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="border-t" style={{ borderColor: "var(--color-border)" }}>
                            {flags.map((f, idx) => {
                              const granted = f.granted === true;
                              const verticals = f.availability.map((a) => `${a.vertical_name}${a.min_tier ? ` (${a.min_tier})` : ""}`).join(", ");
                              return (
                                <div
                                  key={f.flag_key}
                                  className={`px-4 py-3 flex items-center justify-between gap-3 ${idx !== flags.length - 1 ? "border-b" : ""}`}
                                  style={{ borderColor: "var(--color-light)" }}
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium" style={{ color: "var(--color-navy)" }}>{f.name}</p>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                                      <span className="font-mono">{f.flag_key}</span>
                                      {verticals ? ` · ${verticals}` : " · no availability matrix"}
                                    </p>
                                  </div>
                                  <Badge variant={granted ? "teal" : "red"}>{granted ? "Granted" : "Revoked"}</Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
      </>)}
    </div>
  );
}
