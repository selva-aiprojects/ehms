"use client";

import { useState, useEffect } from "react";
import { FileText, AlertCircle, Loader2, RefreshCw, CheckCircle, DollarSign, Clock, Plus, ThumbsUp } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useVendorBills } from "@/lib/hooks";
import { useCreateVendorBill, useApproveVendorBill } from "@/lib/hooks/mutations";
import { formatCurrency, formatDate, daysOverdue } from "@/lib/reference-constants";

const STATUS_FILTERS = ["all", "pending", "approved", "paid", "overdue", "cancelled"] as const;

const BADGE_MAP: Record<string, "teal" | "navy" | "red" | "amber" | "gray"> = {
  pending: "amber", approved: "navy", paid: "teal", cancelled: "gray", overdue: "red",
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

export default function PayablesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({ vendor_id: "", vendor_name: "", bill_number: "", bill_date: "", due_date: "", category: "", subtotal: 0, tax_total: 0, grand_total: 0, notes: "" });

  const { vendorBills, isLoading, isError, mutate } = useVendorBills();
  const createBill = useCreateVendorBill();
  const approveBill = useApproveVendorBill();

  const bills: any[] = vendorBills || [];
  const filtered = statusFilter === "all" ? bills : statusFilter === "overdue"
    ? bills.filter((b) => b.due_date && daysOverdue(b.due_date) > 0 && b.status !== "paid" && b.status !== "cancelled")
    : bills.filter((b) => b.status === statusFilter);

  const totalPayables = bills.reduce((s, b) => s + (b.balance_due ?? b.grand_total ?? 0), 0);
  const totalOverdue = bills.filter((b) => b.due_date && daysOverdue(b.due_date) > 0 && b.status !== "paid" && b.status !== "cancelled").reduce((s, b) => s + (b.balance_due ?? b.grand_total ?? 0), 0);
  const dueThisMonth = bills.filter((b) => b.status !== "paid" && b.status !== "cancelled").reduce((s, b) => s + (b.balance_due ?? b.grand_total ?? 0), 0);
  const paidThisMonth = bills.filter((b) => b.status === "paid").reduce((s, b) => s + (b.paid_total ?? b.grand_total ?? 0), 0);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  async function handleCreateBill() {
    try {
      await createBill.trigger({ ...form, subtotal: Number(form.subtotal), tax_total: Number(form.tax_total), grand_total: Number(form.grand_total) });
      setShowModal(false);
      setForm({ vendor_id: "", vendor_name: "", bill_number: "", bill_date: "", due_date: "", category: "", subtotal: 0, tax_total: 0, grand_total: 0, notes: "" });
      setActionFeedback({ type: "success", message: "Vendor bill recorded successfully" });
    } catch {
      setActionFeedback({ type: "error", message: "Failed to record vendor bill" });
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveBill.trigger(id);
      setActionFeedback({ type: "success", message: "Bill approved" });
    } catch {
      setActionFeedback({ type: "error", message: "Failed to approve bill" });
    }
  }

  if (isLoading && !bills.length) {
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
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Accounts Payable</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Vendor bills, approvals and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#1A3C5E" }}>
            <Plus className="w-3.5 h-3.5" /> Record Bill
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
          <AlertCircle className="w-4 h-4" /> Failed to load vendor bills.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
          <div className="text-xs opacity-80">Total Payables</div>
          <div className="text-lg font-bold mt-1">{formatCurrency(totalPayables)}</div>
          <div className="text-[10px] mt-0.5 opacity-60">{bills.length} bills</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#E53E3E" }}>
          <div className="text-xs opacity-80">Overdue</div>
          <div className="text-lg font-bold mt-1">{formatCurrency(totalOverdue)}</div>
          <div className="text-[10px] mt-0.5 opacity-60">Past due bills</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#F5A623" }}>
          <div className="text-xs opacity-80">Due This Month</div>
          <div className="text-lg font-bold mt-1">{formatCurrency(dueThisMonth)}</div>
          <div className="text-[10px] mt-0.5 opacity-60">Upcoming payments</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="text-xs opacity-80">Paid This Month</div>
          <div className="text-lg font-bold mt-1">{formatCurrency(paidThisMonth)}</div>
          <div className="text-[10px] mt-0.5 opacity-60">Cleared</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Vendor Bills"
          subtitle={filtered.length + " of " + bills.length + " bills"}
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
            <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm font-medium" style={{ color: "#64748B" }}>No bills found</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Try a different filter or record a new bill</p>
          </div>
        ) : (
          <Table
            data={filtered}
            keyExtractor={(item: any, i) => item.id || item.bill_number || String(i)}
            columns={[
              { key: "bill_number", header: "Bill #", render: (b: any) => <span className="font-mono text-xs font-medium" style={{ color: "#1A3C5E" }}>{b.bill_number || "—"}</span> },
              { key: "vendor_name", header: "Vendor", render: (b: any) => <span className="text-sm">{b.vendor_name || "—"}</span> },
              { key: "category", header: "Category", render: (b: any) => <span className="text-xs" style={{ color: "#64748B" }}>{b.category || "—"}</span> },
              { key: "grand_total", header: "Amount", render: (b: any) => <span className="font-medium">₹{(b.grand_total ?? 0).toLocaleString()}</span> },
              { key: "balance_due", header: "Balance Due", render: (b: any) => <span style={{ color: (b.balance_due ?? 0) > 0 ? "#E53E3E" : "#2BAE8E" }}>{formatCurrency(b.balance_due ?? 0)}</span> },
              { key: "due_date", header: "Due Date", render: (b: any) => <span className="text-xs" style={{ color: "#64748B" }}>{b.due_date ? formatDate(b.due_date) : "—"}</span> },
              { key: "days_overdue", header: "Days Overdue", render: (b: any) => {
                const d = b.due_date ? daysOverdue(b.due_date) : 0;
                return d > 0 && b.status !== "paid" ? <span className="text-xs font-medium" style={{ color: "#E53E3E" }}>{d}d</span> : <span className="text-xs" style={{ color: "#94A3B8" }}>—</span>;
              }},
              { key: "status", header: "Status", render: (b: any) => <Badge variant={BADGE_MAP[b.status] || "gray"}>{b.status}</Badge> },
              { key: "actions", header: "", render: (b: any) => b.status === "pending" ? (
                <button onClick={() => handleApprove(b.id)} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors" style={{ background: "rgba(26,60,94,0.1)", color: "#1A3C5E" }}>
                  <ThumbsUp className="w-3 h-3" /> Approve
                </button>
              ) : null},
            ]}
          />
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <h2 className="text-base font-bold mb-4" style={{ color: "#1A3C5E" }}>Record Vendor Bill</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Vendor ID</label><input value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} placeholder="Vendor ID" /></div>
                <div><label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Vendor Name</label><input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} placeholder="Vendor name" /></div>
              </div>
              <div><label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Bill Number</label><input value={form.bill_number} onChange={(e) => setForm({ ...form, bill_number: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} placeholder="BILL-001" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Bill Date</label><input type="date" value={form.bill_date} onChange={(e) => setForm({ ...form, bill_date: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} /></div>
                <div><label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Due Date</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} /></div>
              </div>
              <div><label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} placeholder="Utilities / Maintenance / Supplies" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Subtotal</label><input type="number" value={form.subtotal || ""} onChange={(e) => setForm({ ...form, subtotal: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} /></div>
                <div><label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Tax</label><input type="number" value={form.tax_total || ""} onChange={(e) => setForm({ ...form, tax_total: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} /></div>
                <div><label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Grand Total</label><input type="number" value={form.grand_total || ""} onChange={(e) => setForm({ ...form, grand_total: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} /></div>
              </div>
              <div><label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} rows={2} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleCreateBill} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "#1A3C5E" }}>{createBill.isMutating ? "Saving..." : "Save Bill"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
