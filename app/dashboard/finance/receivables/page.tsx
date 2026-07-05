"use client";

import { useState, useEffect } from "react";
import { Receipt, AlertCircle, Loader2, RefreshCw, CheckCircle, DollarSign, Clock, TrendingUp, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useFinance } from "@/lib/hooks";
import { formatCurrency, formatDate, daysOverdue } from "@/lib/reference-constants";

const STATUS_FILTERS = ["all", "paid", "sent", "overdue", "pending", "draft", "refunded"] as const;

const BADGE_MAP: Record<string, "teal" | "navy" | "red" | "amber" | "gray"> = {
  paid: "teal", sent: "navy", overdue: "red", pending: "amber", draft: "gray", refunded: "gray",
};

function SkeletonRow() {
  return (
    <div className="flex gap-4 p-4 animate-pulse rounded-lg" style={{ background: "#F5F7FA" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-1 h-5 rounded" style={{ background: "#E2E8F0" }} />
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl p-4 text-white flex flex-col justify-between" style={{ background: color }}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
      {sub && <div className="text-[10px] mt-0.5 opacity-60">{sub}</div>}
    </div>
  );
}

export default function ReceivablesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { finance, isLoading, isError, mutate } = useFinance();

  const invoices: any[] = (finance?.invoices as any[]) || [];
  const filtered = statusFilter === "all" ? invoices : invoices.filter((i) => i.status === statusFilter);

  const totalOutstanding = finance?.outstandingAR !== undefined
    ? Number(finance.outstandingAR)
    : invoices.filter((i) => ["overdue", "pending", "sent", "draft"].includes(i.status)).reduce((s, i) => s + Number(i.balance_due ?? i.grand_total ?? 0), 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.balance_due ?? i.grand_total ?? 0), 0);
  const collectedMtd = finance?.mtdRevenue !== undefined
    ? Number(finance.mtdRevenue)
    : (finance?.totalRevenue !== undefined ? Number(finance.totalRevenue) : invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.paid_total ?? i.grand_total ?? 0), 0));

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  function handleRefresh() {
    mutate();
    setActionFeedback({ type: "success", message: "Data refreshed successfully" });
  }

  if (isLoading && !invoices.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-48 rounded animate-pulse" style={{ background: "#E2E8F0" }} />
          <div className="h-5 w-24 rounded animate-pulse" style={{ background: "#E2E8F0" }} />
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
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Accounts Receivable</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Customer invoices, receipts and collections</p>
        </div>
        <button onClick={handleRefresh} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
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
          <AlertCircle className="w-4 h-4" /> Failed to load receivables data.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Outstanding" value={formatCurrency(totalOutstanding)} sub="Across all invoices" color="#1A3C5E" />
        <StatCard label="Overdue" value={formatCurrency(totalOverdue)} sub={invoices.filter((i) => i.status === "overdue").length + " overdue invoices"} color="#E53E3E" />
        <StatCard label="Collected MTD" value={formatCurrency(collectedMtd)} sub="Month to date collections" color="#2BAE8E" />
        <StatCard label="Invoice Count" value={String(invoices.length)} sub={invoices.filter((i) => i.status === "paid").length + " paid"} color="#F5A623" />
      </div>

      <Card>
        <CardHeader
          title="Invoices"
          subtitle={filtered.length + " of " + invoices.length + " invoices"}
          action={
            <div className="flex gap-1.5 flex-wrap">
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
          }
        />
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-8 h-8 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm font-medium" style={{ color: "#64748B" }}>No invoices found</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Try changing the status filter</p>
          </div>
        ) : (
          <Table
            data={filtered}
            keyExtractor={(item: any) => item.id || item.invoice_number}
            columns={[
              { key: "invoice_number", header: "Invoice #", render: (inv: any) => <span className="font-mono text-xs font-medium" style={{ color: "#1A3C5E" }}>{inv.invoice_number || inv.id || "—"}</span> },
              { key: "guest_name", header: "Guest / Customer", render: (inv: any) => <span className="text-sm">{inv.guest_name || inv.guest || "—"}</span> },
              { key: "property_name", header: "Property", render: (inv: any) => <span className="text-xs" style={{ color: "#64748B" }}>{inv.property_name || "—"}</span> },
              { key: "grand_total", header: "Amount", render: (inv: any) => <span className="font-medium">₹{(inv.grand_total ?? 0).toLocaleString()}</span> },
              { key: "balance_due", header: "Balance Due", render: (inv: any) => <span style={{ color: (inv.balance_due ?? 0) > 0 ? "#E53E3E" : "#2BAE8E" }}>{formatCurrency(inv.balance_due ?? 0)}</span> },
              { key: "due_date", header: "Due Date", render: (inv: any) => <span className="text-xs" style={{ color: "#64748B" }}>{inv.due_date ? formatDate(inv.due_date) : "—"}</span> },
              { key: "status", header: "Status", render: (inv: any) => <Badge variant={BADGE_MAP[inv.status] || "gray"}>{inv.status}</Badge> },
              { key: "days_overdue", header: "Days Overdue", render: (inv: any) => {
                const d = inv.due_date ? daysOverdue(inv.due_date) : 0;
                return d > 0 ? <span className="text-xs font-medium" style={{ color: "#E53E3E" }}>{d}d</span> : <span className="text-xs" style={{ color: "#94A3B8" }}>—</span>;
              }},
            ]}
          />
        )}
      </Card>
    </div>
  );
}
