"use client";

import { useState, useEffect } from "react";
import { Briefcase, Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, Building2, Users as UsersIcon, Calendar, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import { useMemberships } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-12 rounded animate-pulse mb-2" style={{ background: "var(--color-light)" }} />;
}

export default function WorkplaceMembershipsPage() {
  const { memberships, isLoading, isError, mutate } = useMemberships();
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    corporate_name: "", plan_name: "", start_date: "", end_date: "", seat_allocated: 0, notes: "",
  });

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const displayMemberships = (memberships || []) as any[];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const params = new URLSearchParams({ name: form.corporate_name });
      const corpRes = await fetch(`/api/corporate-accounts?${params}`);
      let corporateId = null;
      const corpData = await corpRes.json();
      if (corpData?.data?.length > 0) {
        corporateId = corpData.data[0].id;
      }

      const planRes = await fetch(`/api/workplace/plans?name=${encodeURIComponent(form.plan_name)}`);
      const planData = await planRes.json();
      let planId = null;
      if (planData?.data?.length > 0) {
        planId = planData.data[0].id;
      }

      if (!corporateId || !planId) {
        setActionFeedback({ type: "error", message: "Corporate account or plan not found. Create them first." });
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/workplace/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporate_id: corporateId,
          plan_id: planId,
          start_date: form.start_date,
          end_date: form.end_date || null,
          seat_allocated: form.seat_allocated,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ type: "success", message: "Membership created" });
        setShowModal(false);
        setForm({ corporate_name: "", plan_name: "", start_date: "", end_date: "", seat_allocated: 0, notes: "" });
        mutate();
      } else {
        setActionFeedback({ type: "error", message: data.error || "Failed to create" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  const activeMemberships = displayMemberships.filter((m: any) => m.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Corporate Memberships</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Manage corporate membership plans and allocations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5" /> New Membership
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.1)" : "rgba(var(--color-danger-rgb),0.08)",
            color: actionFeedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.2)" : "rgba(var(--color-danger-rgb),0.2)"}`,
          }}
        >
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-4" style={{ background: "var(--color-primary)" }}>
          <div className="text-2xl font-bold text-white">{activeMemberships.length}</div>
          <div className="text-xs text-white/80">Active Memberships</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--color-navy)" }}>
          <div className="text-2xl font-bold text-white">{displayMemberships.reduce((s: number, m: any) => s + (m.seat_allocated || 0), 0)}</div>
          <div className="text-xs text-white/80">Total Seats Allocated</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--color-warning)" }}>
          <div className="text-2xl font-bold text-white">{displayMemberships.reduce((s: number, m: any) => s + (m.seat_used || 0), 0)}</div>
          <div className="text-xs text-white/80">Seats Used</div>
        </div>
      </div>

      <Card>
        <CardHeader title="All Memberships" subtitle={`${displayMemberships.length} record(s)`} />
        {isLoading ? (
          <div className="space-y-1">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-danger)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Failed to load memberships</p>
          </div>
        ) : displayMemberships.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No memberships yet</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowModal(true)}>
              <Plus className="w-3.5 h-3.5" /> Create Membership
            </Button>
          </div>
        ) : (
          <Table
            data={displayMemberships}
            keyExtractor={(m: any) => m.id || Math.random()}
            columns={[
              { key: "corporate", header: "Corporate", render: (m: any) => (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                  <span className="font-medium text-sm">{m.corporate?.name || "—"}</span>
                </div>
              )},
              { key: "plan", header: "Plan", render: (m: any) => <Badge variant="gray">{m.plan?.name || m.plan_id || "—"}</Badge> },
              { key: "seats", header: "Seats", render: (m: any) => {
                const allocated = m.seat_allocated || 0;
                const used = m.seat_used || 0;
                const pct = allocated > 0 ? (used / allocated) * 100 : 0;
                return (
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: used === allocated ? "var(--color-primary)" : "var(--color-warning)" }} />
                    </div>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{used}/{allocated}</span>
                  </div>
                );
              }},
              { key: "dates", header: "Period", render: (m: any) => {
                const start = m.start_date ? new Date(m.start_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";
                const end = m.end_date ? new Date(m.end_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "Open";
                return <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{start} — {end}</span>;
              }},
              { key: "status", header: "Status", render: (m: any) => (
                <Badge variant={m.status === "active" ? "teal" : m.status === "expired" ? "red" : "amber"}>{m.status}</Badge>
              )},
            ]}
          />
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-lg" style={{ color: "var(--color-navy)" }}>New Membership</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Corporate Name *</label>
                <input type="text" required value={form.corporate_name} onChange={(e) => setForm({ ...form, corporate_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                  placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Plan Name *</label>
                <input type="text" required value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                  placeholder="e.g. Hot Desk Pool" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Start Date *</label>
                  <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Seats Allocated</label>
                <input type="number" min="0" value={form.seat_allocated} onChange={(e) => setForm({ ...form, seat_allocated: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Creating</> : "Create Membership"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
