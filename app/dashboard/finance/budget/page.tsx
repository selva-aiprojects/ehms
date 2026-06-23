"use client";

import { useState, useEffect } from "react";
import { Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, DollarSign, TrendingUp, TrendingDown, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useBudget, useBudgetHeads, useFiscalYears } from "@/lib/hooks";
import { useCreateBudgetEntry, useCreateBudgetHead } from "@/lib/hooks/mutations";
import { formatCurrency } from "@/lib/reference-constants";

function SkeletonRow() {
  return (
    <div className="flex gap-4 p-4 animate-pulse rounded-lg" style={{ background: "#F5F7FA" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-1 h-5 rounded" style={{ background: "#E2E8F0" }} />
      ))}
    </div>
  );
}

export default function BudgetPage() {
  const [fiscalYearId, setFiscalYearId] = useState<string>("");
  const [budgetHeadId, setBudgetHeadId] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({ budget_head_id: "", fiscal_year_id: "", period_month: 1, budget_amount: 0, notes: "" });

  const { budgetEntries, isLoading, isError, mutate } = useBudget({ fiscal_year_id: fiscalYearId || undefined, budget_head_id: budgetHeadId || undefined });
  const { budgetHeads } = useBudgetHeads();
  const { fiscalYears } = useFiscalYears();
  const createEntry = useCreateBudgetEntry();

  const entries: any[] = budgetEntries || [];
  const heads: any[] = budgetHeads || [];
  const years: any[] = fiscalYears || [];

  const totalBudget = entries.reduce((s: number, e: any) => s + (e.budget_amount ?? 0), 0);
  const totalActual = entries.reduce((s: number, e: any) => s + (e.actual_amount ?? 0), 0);
  const variancePct = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  async function handleCreateEntry() {
    try {
      await createEntry.trigger({ ...form, period_month: Number(form.period_month), budget_amount: Number(form.budget_amount) });
      setShowModal(false);
      setForm({ budget_head_id: "", fiscal_year_id: "", period_month: 1, budget_amount: 0, notes: "" });
      setActionFeedback({ type: "success", message: "Budget entry created successfully" });
    } catch {
      setActionFeedback({ type: "error", message: "Failed to create budget entry" });
    }
  }

  function handleRefresh() {
    mutate();
    setActionFeedback({ type: "success", message: "Data refreshed" });
  }

  if (isLoading && !entries.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-56 rounded animate-pulse" style={{ background: "#E2E8F0" }} />
          <div className="h-5 w-32 rounded animate-pulse" style={{ background: "#E2E8F0" }} />
        </div>
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        <SkeletonRow /><SkeletonRow /><SkeletonRow />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Budget Planning & Control</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Monitor budget vs actual across all heads</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#1A3C5E" }}>
            <Plus className="w-3.5 h-3.5" /> Add Budget Entry
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{
          background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)",
          color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E",
          border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}`,
        }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" /> Failed to load budget data.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">{formatCurrency(totalBudget)}</div>
            <DollarSign className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Budget</div>
          <div className="text-[10px] mt-0.5 opacity-60">{entries.length} entries</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">{formatCurrency(totalActual)}</div>
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Actual</div>
          <div className="text-[10px] mt-0.5 opacity-60">Spent so far</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: variancePct >= 0 ? "#2BAE8E" : "#E53E3E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">{variancePct >= 0 ? "+" : ""}{variancePct.toFixed(1)}%</div>
            {variancePct >= 0 ? <TrendingUp className="w-5 h-5 opacity-60" /> : <TrendingDown className="w-5 h-5 opacity-60" />}
          </div>
          <div className="text-xs opacity-80">Variance</div>
          <div className="text-[10px] mt-0.5 opacity-60">Budget vs Actual</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Budget Entries"
          subtitle={entries.length + " entries"}
          action={
            <div className="flex gap-2 flex-wrap">
              <select
                value={fiscalYearId}
                onChange={(e) => setFiscalYearId(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ border: "1px solid #E2E8F0", color: "#1A2E44", background: "#FFFFFF" }}
              >
                <option value="">All Fiscal Years</option>
                {years.map((y: any) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
              <select
                value={budgetHeadId}
                onChange={(e) => setBudgetHeadId(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ border: "1px solid #E2E8F0", color: "#1A2E44", background: "#FFFFFF" }}
              >
                <option value="">All Heads</option>
                {heads.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.head_name}</option>
                ))}
              </select>
            </div>
          }
        />
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm font-medium" style={{ color: "#64748B" }}>No budget entries found</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Add a budget entry to get started</p>
          </div>
        ) : (
          <Table
            data={entries}
            keyExtractor={(item: any, i) => item.id || String(i)}
            columns={[
              { key: "head_code", header: "Head Code", render: (e: any) => <span className="font-mono text-xs" style={{ color: "#1A3C5E" }}>{e.head_code || "—"}</span> },
              { key: "head_name", header: "Head Name", render: (e: any) => <span className="text-sm">{e.head_name || "—"}</span> },
              { key: "period_month", header: "Period", render: (e: any) => {
                const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                return <span className="text-xs" style={{ color: "#64748B" }}>{months[(e.period_month ?? 1) - 1]} {e.fiscal_year_name || ""}</span>;
              }},
              { key: "budget_amount", header: "Budget", render: (e: any) => <span className="font-medium">{formatCurrency(e.budget_amount ?? 0)}</span> },
              { key: "actual_amount", header: "Actual", render: (e: any) => <span className="font-medium">{formatCurrency(e.actual_amount ?? 0)}</span> },
              { key: "variance", header: "Variance", render: (e: any) => {
                const b = e.budget_amount ?? 0;
                const a = e.actual_amount ?? 0;
                const v = b > 0 ? ((a - b) / b) * 100 : 0;
                return (
                  <Badge variant={v >= 0 ? "teal" : "red"}>
                    {v >= 0 ? "+" : ""}{v.toFixed(1)}%
                  </Badge>
                );
              }},
              { key: "utilisation", header: "Utilisation", render: (e: any) => {
                const b = e.budget_amount ?? 0;
                const a = e.actual_amount ?? 0;
                const u = b > 0 ? (a / b) * 100 : 0;
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                      <div className="h-full rounded-full" style={{ width: Math.min(u, 100) + "%", background: u > 100 ? "#E53E3E" : "#2BAE8E" }} />
                    </div>
                    <span className="text-xs" style={{ color: u > 100 ? "#E53E3E" : "#64748B" }}>{u.toFixed(0)}%</span>
                  </div>
                );
              }},
            ]}
          />
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <h2 className="text-base font-bold mb-4" style={{ color: "#1A3C5E" }}>Add Budget Entry</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Budget Head</label>
                <select value={form.budget_head_id} onChange={(e) => setForm({ ...form, budget_head_id: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44", background: "#FFFFFF" }}>
                  <option value="">Select head</option>
                  {heads.map((h: any) => (
                    <option key={h.id} value={h.id}>{h.head_name} ({h.head_code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Fiscal Year</label>
                <select value={form.fiscal_year_id} onChange={(e) => setForm({ ...form, fiscal_year_id: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44", background: "#FFFFFF" }}>
                  <option value="">Select year</option>
                  {years.map((y: any) => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Period Month (1-12)</label>
                <input type="number" min={1} max={12} value={form.period_month} onChange={(e) => setForm({ ...form, period_month: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Budget Amount</label>
                <input type="number" value={form.budget_amount || ""} onChange={(e) => setForm({ ...form, budget_amount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleCreateEntry} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "#1A3C5E" }}>{createEntry.isMutating ? "Saving..." : "Save Entry"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
