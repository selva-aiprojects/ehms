"use client";

import { useState, useEffect } from "react";
import { Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, DollarSign, Clock, FileText, Landmark, CreditCard } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useTaxFilings } from "@/lib/hooks";
import { useCreateTaxFiling, useFileTaxReturn } from "@/lib/hooks/mutations";
import { formatCurrency, formatDate } from "@/lib/reference-constants";

const TAX_TYPES = ["all", "gst", "tds", "income_tax", "professional_tax"] as const;
const STATUS_FILTERS = ["all", "filed", "paid", "pending", "overdue"] as const;

const TAX_TYPE_LABELS: Record<string, string> = { gst: "GST", tds: "TDS", income_tax: "Income Tax", professional_tax: "Professional Tax" };
const BADGE_MAP: Record<string, "teal" | "navy" | "amber" | "red" | "gray"> = {
  filed: "teal", paid: "navy", pending: "amber", overdue: "red",
};

function SkeletonRow() {
  return (
    <div className="flex gap-4 p-4 animate-pulse rounded-lg" style={{ background: "#F5F7FA" }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-1 h-5 rounded" style={{ background: "#E2E8F0" }} />
      ))}
    </div>
  );
}

export default function TaxPage() {
  const [taxType, setTaxType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({ tax_type: "gst", return_type: "", period_start: "", period_end: "", due_date: "", total_liability: 0, status: "pending", remarks: "" });

  const { taxFilings, isLoading, isError, mutate } = useTaxFilings({ tax_type: taxType !== "all" ? taxType : undefined, status: statusFilter !== "all" ? statusFilter : undefined });
  const createFiling = useCreateTaxFiling();
  const fileReturn = useFileTaxReturn();

  const filings: any[] = taxFilings || [];
  const totalLiability = filings.reduce((s: number, f: any) => s + (f.total_liability ?? 0), 0);
  const totalPaid = filings.reduce((s: number, f: any) => s + (f.total_paid ?? 0), 0);
  const pendingCount = filings.filter((f: any) => f.status === "pending" || f.status === "overdue").length;

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  async function handleCreateFiling() {
    try {
      await createFiling.trigger({ ...form, total_liability: Number(form.total_liability) });
      setShowModal(false);
      setForm({ tax_type: "gst", return_type: "", period_start: "", period_end: "", due_date: "", total_liability: 0, status: "pending", remarks: "" });
      setActionFeedback({ type: "success", message: "Tax filing recorded successfully" });
    } catch {
      setActionFeedback({ type: "error", message: "Failed to record tax filing" });
    }
  }

  async function handleFileNow(id: string) {
    try {
      await fileReturn.trigger(id, "Current User");
      setActionFeedback({ type: "success", message: "Tax return filed successfully" });
    } catch {
      setActionFeedback({ type: "error", message: "Failed to file return" });
    }
  }

  function handleRefresh() {
    mutate();
    setActionFeedback({ type: "success", message: "Data refreshed" });
  }

  if (isLoading && !filings.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-48 rounded animate-pulse" style={{ background: "#E2E8F0" }} />
          <div className="h-5 w-28 rounded animate-pulse" style={{ background: "#E2E8F0" }} />
        </div>
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        <SkeletonRow /><SkeletonRow /><SkeletonRow />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Tax Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>GST / TDS return filing tracker</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#1A3C5E" }}>
            <Plus className="w-3.5 h-3.5" /> New Filing
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
          <AlertCircle className="w-4 h-4" /> Failed to load tax data.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">{formatCurrency(totalLiability)}</div>
            <Landmark className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Liability</div>
          <div className="text-[10px] mt-0.5 opacity-60">{filings.length} filings</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">{formatCurrency(totalPaid)}</div>
            <CreditCard className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Paid</div>
          <div className="text-[10px] mt-0.5 opacity-60">Cleared</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: pendingCount > 0 ? "#F5A623" : "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">{pendingCount}</div>
            <Clock className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Pending Filings</div>
          <div className="text-[10px] mt-0.5 opacity-60">Requires action</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Tax Filings"
          subtitle={filings.length + " records"}
          action={
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#F5F7FA" }}>
                {TAX_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTaxType(t)}
                    className="px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors"
                    style={{
                      background: taxType === t ? "#1A3C5E" : "transparent",
                      color: taxType === t ? "#FFFFFF" : "#64748B",
                    }}
                  >
                    {t === "all" ? "All" : TAX_TYPE_LABELS[t] || t}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors"
                    style={{
                      background: statusFilter === s ? "#1A3C5E" : "#F5F7FA",
                      color: statusFilter === s ? "#FFFFFF" : "#64748B",
                      border: statusFilter === s ? "none" : "1px solid #E2E8F0",
                    }}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
            </div>
          }
        />
        {filings.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm font-medium" style={{ color: "#64748B" }}>No tax filings found</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Create a new filing to get started</p>
          </div>
        ) : (
          <Table
            data={filings}
            keyExtractor={(item: any, i) => item.id || String(i)}
            columns={[
              { key: "tax_type", header: "Tax Type", render: (f: any) => <Badge variant="navy">{TAX_TYPE_LABELS[f.tax_type] || f.tax_type}</Badge> },
              { key: "period", header: "Period", render: (f: any) => <span className="text-xs" style={{ color: "#64748B" }}>{f.period_start ? formatDate(f.period_start) : "—"} - {f.period_end ? formatDate(f.period_end) : "—"}</span> },
              { key: "due_date", header: "Due Date", render: (f: any) => <span className="text-xs" style={{ color: "#64748B" }}>{f.due_date ? formatDate(f.due_date) : "—"}</span> },
              { key: "total_liability", header: "Liability", render: (f: any) => <span className="font-medium">{formatCurrency(f.total_liability ?? 0)}</span> },
              { key: "total_paid", header: "Paid", render: (f: any) => <span className="font-medium" style={{ color: "#2BAE8E" }}>{formatCurrency(f.total_paid ?? 0)}</span> },
              { key: "balance", header: "Balance", render: (f: any) => {
                const bal = (f.total_liability ?? 0) - (f.total_paid ?? 0);
                return <span className="font-medium" style={{ color: bal > 0 ? "#E53E3E" : "#2BAE8E" }}>{formatCurrency(bal)}</span>;
              }},
              { key: "status", header: "Status", render: (f: any) => <Badge variant={BADGE_MAP[f.status] || "gray"}>{f.status}</Badge> },
              { key: "filed_by_name", header: "Filed By", render: (f: any) => <span className="text-xs" style={{ color: "#64748B" }}>{f.filed_by_name || "—"}</span> },
              { key: "actions", header: "", render: (f: any) => (
                <div className="flex gap-1.5">
                  {(f.status === "pending" || f.status === "overdue") && (
                    <button onClick={() => handleFileNow(f.id)} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors" style={{ background: "rgba(43,174,142,0.12)", color: "#2BAE8E" }}>
                      <CheckCircle className="w-3 h-3" /> File Now
                    </button>
                  )}
                  {(f.total_liability ?? 0) > (f.total_paid ?? 0) && (
                    <button className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors" style={{ background: "rgba(26,60,94,0.1)", color: "#1A3C5E" }}>
                      <DollarSign className="w-3 h-3" /> Pay
                    </button>
                  )}
                </div>
              )},
            ]}
          />
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <h2 className="text-base font-bold mb-4" style={{ color: "#1A3C5E" }}>New Tax Filing</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Tax Type</label>
                  <select value={form.tax_type} onChange={(e) => setForm({ ...form, tax_type: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44", background: "#FFFFFF" }}>
                    {TAX_TYPES.filter((t) => t !== "all").map((t) => (
                      <option key={t} value={t}>{TAX_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Return Type</label>
                  <input value={form.return_type} onChange={(e) => setForm({ ...form, return_type: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} placeholder="GSTR-3B / 26Q" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Period Start</label>
                  <input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Period End</label>
                  <input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Total Liability</label>
                  <input type="number" value={form.total_liability || ""} onChange={(e) => setForm({ ...form, total_liability: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Remarks</label>
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleCreateFiling} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "#1A3C5E" }}>{createFiling.isMutating ? "Saving..." : "Save Filing"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
