"use client";

import { useState, useEffect } from "react";
import {
  Shield, Loader2, RefreshCw, CheckCircle, AlertCircle, CreditCard,
  TrendingUp, Users, Receipt, PiggyBank, Plus, FileText,
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useAdminSubscriptions } from "@/lib/hooks";
import {
  useGenerateSubscriptionInvoice,
  useRecordSubscriptionPayment,
  useUpdateSubscription,
  useUpsertSubscriptionPlan,
} from "@/lib/hooks/mutations";

interface Subscription {
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  schema_name: string;
  tenant_active: boolean;
  plan_id: string | null;
  plan_name: string | null;
  plan_code: string | null;
  tier: string;
  status: string;
  subscribed_verticals: string[];
  price: number | null;
  billing_period: string;
  start_date: string | null;
  end_date: string | null;
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

interface Invoice {
  id: string;
  invoice_number: string;
  tenant_id: string;
  tenant_code: string;
  tenant_name: string;
  period_start: string;
  period_end: string;
  plan_label: string | null;
  tier: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  paid_amount: number;
}

interface Payment {
  id: string;
  invoice_number: string;
  tenant_code: string;
  tenant_name: string;
  amount: number;
  payment_mode: string;
  reference: string | null;
  received_at: string;
}

const STATUS_VARIANT: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  active: "teal",
  trial: "amber",
  paused: "gray",
  cancelled: "red",
  paid: "teal",
  issued: "amber",
  overdue: "red",
  draft: "gray",
  void: "gray",
};

function formatINR(n: number | null | undefined): string {
  const v = Number(n || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { plans, subscriptions, metrics, invoices, payments, trend, isLoading, mutate } = useAdminSubscriptions();
  const generateInvoice = useGenerateSubscriptionInvoice();
  const recordPayment = useRecordSubscriptionPayment();
  const updateSubscription = useUpdateSubscription();
  const upsertPlan = useUpsertSubscriptionPlan();

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");
  const [paySaving, setPaySaving] = useState(false);

  const [planModal, setPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    id: "", code: "", name: "", description: "", tier: "basic",
    price: "", billing_period: "monthly", is_active: true,
  });
  const [planSaving, setPlanSaving] = useState(false);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  const notify = (type: "success" | "error", message: string) => setFeedback({ type, message });

  async function handleGenerateInvoice(sub: Subscription) {
    try {
      await generateInvoice.trigger(sub.tenant_id);
      notify("success", `Invoice generated for ${sub.tenant_code}`);
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to generate invoice");
    }
  }

  async function handleStatusChange(sub: Subscription, status: string) {
    try {
      await updateSubscription.trigger({ tenant_id: sub.tenant_id, status });
      notify("success", `${sub.tenant_code} subscription is now '${status}'`);
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to update status");
    }
  }

  async function handleRecordPayment() {
    if (!payFor) return;
    setPaySaving(true);
    try {
      await recordPayment.trigger({
        invoice_id: payFor.id,
        amount: payAmount ? Number(payAmount) : payFor.total_amount,
        payment_mode: payMode,
        reference: payRef,
      });
      notify("success", `Payment recorded for ${payFor.invoice_number}`);
      setPayFor(null);
      setPayAmount(""); setPayRef("");
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to record payment");
    }
    setPaySaving(false);
  }

  function openPlanModal(plan?: Plan) {
    setPlanModal(true);
    setPlanForm({
      id: plan?.id || "",
      code: plan?.code || "",
      name: plan?.name || "",
      description: plan?.description || "",
      tier: plan?.tier || "basic",
      price: plan?.price != null ? String(plan.price) : "",
      billing_period: plan?.billing_period || "monthly",
      is_active: plan?.is_active ?? true,
    });
  }

  async function handleSavePlan() {
    if (!planForm.code || !planForm.name || !planForm.tier) {
      notify("error", "Code, name, and tier are required");
      return;
    }
    setPlanSaving(true);
    try {
      await upsertPlan.trigger({
        id: planForm.id || undefined,
        code: planForm.code,
        name: planForm.name,
        description: planForm.description,
        tier: planForm.tier,
        price: planForm.price !== "" ? Number(planForm.price) : null,
        billing_period: planForm.billing_period,
        is_active: planForm.is_active,
      });
      notify("success", `Plan ${planForm.code} saved`);
      setPlanModal(false);
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Failed to save plan");
    }
    setPlanSaving(false);
  }

  const maxTrend = trend.reduce((m, t) => Math.max(m, Number(t.collected || 0)), 0) || 1;

  if (!user || !user.is_platform_admin) {
    return (
      <Card>
        <div className="py-16 text-center">
          <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-danger)" }} />
          <p className="font-medium" style={{ color: "var(--color-navy)" }}>Platform admin access required</p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Only eHMS platform superadmins can manage subscriptions & billing.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>Subscriptions & Billing</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Manage tenant plans, MRR, invoices and payments across all shards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openPlanModal()} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" /> Add Plan
          </Button>
          <Button onClick={() => mutate()} disabled={isLoading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
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
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <div>{feedback.message}</div>
        </div>
      )}

      {isLoading && !metrics ? (
        <Card>
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-primary)" }} />
          </div>
        </Card>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Monthly Recurring Revenue", value: formatINR(metrics?.mrr), icon: TrendingUp, color: "var(--color-primary)" },
              { label: "Active Subscriptions", value: String(metrics?.active_subscriptions || 0), icon: Users, color: "#10B981" },
              { label: "Outstanding Balance", value: formatINR(metrics?.outstanding), icon: Receipt, color: "#F59E0B" },
              { label: "Lifetime Collected", value: formatINR(metrics?.lifetime_collected), icon: PiggyBank, color: "#8B5CF6" },
            ].map((m) => (
              <Card key={m.label}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{m.label}</p>
                    <p className="text-2xl font-bold mt-1.5" style={{ color: "var(--color-navy)" }}>{m.value}</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.10)" }}>
                    <m.icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Trend */}
          <Card>
            <CardHeader title="Billing Trend (12 months)" subtitle="Invoiced vs collected revenue" />
            <div className="flex items-end gap-1.5 h-32">
              {trend.map((t) => (
                <div key={t.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full flex flex-col justify-end gap-0.5 h-28">
                    <div className="w-full rounded-t bg-teal-500/70" style={{ height: `${Math.max((Number(t.collected || 0) / maxTrend) * 100, 2)}%` }} title={formatINR(t.collected)} />
                    <div className="w-full rounded-b bg-blue-500/30" style={{ height: `${Math.max(((Number(t.invoiced || 0) - Number(t.collected || 0)) / maxTrend) * 100, 0)}%` }} />
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{String(t.label).slice(2)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Subscriptions */}
          <Card>
            <CardHeader
              title="Tenant Subscriptions"
              subtitle={`${subscriptions.length} tenant(s) · ARPU ${formatINR(metrics?.arpu)}`}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Tenant</th>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Plan</th>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Tier</th>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Price</th>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Status</th>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s: Subscription) => (
                    <tr key={s.tenant_id} style={{ borderBottom: "1px solid var(--color-light)" }}>
                      <td className="py-3 pr-3">
                        <p className="font-medium" style={{ color: "var(--color-navy)" }}>{s.tenant_name}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.tenant_code} · {s.schema_name}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-sm">{s.plan_name || "Custom"}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant={s.tier === "enterprise" ? "navy" : s.tier === "professional" ? "teal" : "amber"}>{s.tier}</Badge>
                      </td>
                      <td className="py-3 pr-3 font-medium" style={{ color: "var(--color-navy)" }}>{formatINR(s.price)}</td>
                      <td className="py-3 pr-3">
                        <Badge variant={STATUS_VARIANT[s.status] || "gray"}>{s.status}</Badge>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={s.status}
                            onChange={(e) => handleStatusChange(s, e.target.value)}
                            className="px-2 py-1 rounded-lg text-xs border"
                            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          >
                            {["active", "trial", "paused", "cancelled"].map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                          <Button onClick={() => handleGenerateInvoice(s)} size="sm" variant="ghost" disabled={generateInvoice.isMutating}>
                            <FileText className="w-3.5 h-3.5" /> Invoice
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Invoices */}
            <Card>
              <CardHeader title="Invoices" subtitle="Recent platform invoices" />
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {invoices.length === 0 && (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-muted)" }}>No invoices yet. Generate one from the subscriptions table.</p>
                )}
                {invoices.map((inv: Invoice) => (
                  <div key={inv.id} className="rounded-lg border p-3 flex items-center justify-between gap-3" style={{ borderColor: "var(--color-border)" }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--color-navy)" }}>{inv.invoice_number}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {inv.tenant_name} · {inv.period_start} → {inv.period_end}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{formatINR(inv.total_amount)}</p>
                        <Badge variant={STATUS_VARIANT[inv.status] || "gray"} className="mt-0.5">{inv.status}</Badge>
                      </div>
                      {inv.status === "issued" && (
                        <Button size="sm" variant="outline" onClick={() => { setPayFor(inv); setPayAmount(String(inv.total_amount)); }}>
                          <CreditCard className="w-3.5 h-3.5" /> Pay
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payments */}
            <Card>
              <CardHeader title="Recent Payments" subtitle="Recorded subscription payments" />
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {payments.length === 0 && (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-muted)" }}>No payments recorded yet.</p>
                )}
                {payments.map((p: Payment) => (
                  <div key={p.id} className="rounded-lg border p-3 flex items-center justify-between gap-3" style={{ borderColor: "var(--color-border)" }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--color-navy)" }}>{p.tenant_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {p.invoice_number} · {p.payment_mode}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold" style={{ color: "#059669" }}>{formatINR(p.amount)}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{new Date(p.received_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Plans */}
          <Card>
            <CardHeader title="Subscription Plans" subtitle="Standard pricing tiers" action={
              <Button onClick={() => openPlanModal()} size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> New</Button>
            } />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Code</th>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Name</th>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Tier</th>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Price / month</th>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}>Status</th>
                    <th className="text-left py-2 pr-3 font-semibold text-xs" style={{ color: "var(--color-text-muted)" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p: Plan) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--color-light)" }}>
                      <td className="py-3 pr-3 font-mono text-xs" style={{ color: "var(--color-navy)" }}>{p.code}</td>
                      <td className="py-3 pr-3 font-medium" style={{ color: "var(--color-navy)" }}>{p.name}</td>
                      <td className="py-3 pr-3"><Badge variant={p.tier === "enterprise" ? "navy" : p.tier === "professional" ? "teal" : "amber"}>{p.tier}</Badge></td>
                      <td className="py-3 pr-3 font-medium" style={{ color: "var(--color-navy)" }}>{formatINR(p.price)}</td>
                      <td className="py-3 pr-3"><Badge variant={p.is_active ? "teal" : "gray"}>{p.is_active ? "active" : "inactive"}</Badge></td>
                      <td className="py-3 pr-3 text-right">
                        <Button onClick={() => openPlanModal(p)} size="sm" variant="ghost">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Payment modal */}
      {payFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPayFor(null)}>
          <div className="rounded-2xl w-full max-w-md p-6" style={{ background: "var(--color-white)", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Record Payment</h3>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              {payFor.invoice_number} · {payFor.tenant_name} · due {formatINR(payFor.total_amount)}
            </p>
            <div className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Amount (INR)</label>
                <input
                  type="number"
                  min={0}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Payment Mode</label>
                <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                  {["bank_transfer", "upi", "card", "cheque", "cash"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Reference (UTR / TXN ID)</label>
                <input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UTR-1234567890"
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setPayFor(null)}>Cancel</Button>
              <Button onClick={handleRecordPayment} disabled={paySaving}>
                {paySaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {paySaving ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Plan modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPlanModal(false)}>
          <div className="rounded-2xl w-full max-w-md p-6" style={{ background: "var(--color-white)", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>{planForm.id ? "Edit Plan" : "New Plan"}</h3>
            <div className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Code</label>
                  <input value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} placeholder="PROFESSIONAL" className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Tier</label>
                  <select value={planForm.tier} onChange={(e) => setPlanForm({ ...planForm, tier: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                    {["basic", "professional", "enterprise"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Name</label>
                <input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Professional Plan" className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Description</label>
                <input value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Price (INR / month)</label>
                  <input type="number" min={0} value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>Billing Period</label>
                  <select value={planForm.billing_period} onChange={(e) => setPlanForm({ ...planForm, billing_period: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                    {["monthly", "yearly"].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={planForm.is_active} onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })} />
                <span style={{ color: "var(--color-text)" }}>Active plan</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setPlanModal(false)}>Cancel</Button>
              <Button onClick={handleSavePlan} disabled={planSaving}>
                {planSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {planSaving ? "Saving..." : "Save Plan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
