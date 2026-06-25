"use client";

import { useState, useEffect } from "react";
import {
  Receipt, Plus, Search, Loader2, RefreshCw, CheckCircle, AlertCircle,
  ChevronDown, ChevronRight, X, DollarSign, Calendar, User, Home
} from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useRentInvoices, useLeases } from "@/lib/hooks";
import { useCreateRentInvoice, useUpdateRentInvoice } from "@/lib/hooks/mutations";

const INVOICE_BADGE: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  paid: "teal", sent: "navy", draft: "gray", overdue: "red", cancelled: "red",
};

export default function RentInvoicesPage() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");

  const { invoices = [], isLoading, mutate } = useRentInvoices({ status: filterStatus || undefined });
  const { leases = [] } = useLeases({ status: "active" });

  const { trigger: createInvoice, isMutating: isCreating } = useCreateRentInvoice();
  const { trigger: updateInvoice, isMutating: isUpdating } = useUpdateRentInvoice();

  const [formData, setFormData] = useState({
    lease_id: "", period_start: "", period_end: "",
    rent_amount: "", maintenance_charges: "0", late_fee: "0", due_date: "",
  });

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  useEffect(() => {
    if (formData.lease_id) {
      const lease = leases.find((l: any) => l.id === formData.lease_id);
      if (lease) {
        setFormData((prev) => ({
          ...prev,
          rent_amount: String(lease.rent_amount || ""),
        }));
      }
    }
  }, [formData.lease_id]);

  function resetForm() {
    setFormData({
      lease_id: "", period_start: "", period_end: "",
      rent_amount: "", maintenance_charges: "0", late_fee: "0", due_date: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createInvoice({
        lease_id: formData.lease_id,
        period_start: formData.period_start,
        period_end: formData.period_end,
        rent_amount: parseFloat(formData.rent_amount),
        maintenance_charges: parseFloat(formData.maintenance_charges) || 0,
        late_fee: parseFloat(formData.late_fee) || 0,
        due_date: formData.due_date,
      } as any);

      setActionFeedback({ type: "success", message: "Rent invoice created" });
      setShowModal(false);
      resetForm();
      mutate();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Failed to create invoice" });
    }
  }

  async function handleMarkPaid(invoiceId: string) {
    try {
      await updateInvoice(invoiceId, { status: "paid" } as any);
      setActionFeedback({ type: "success", message: "Invoice marked as paid" });
      mutate();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Failed to update invoice" });
    }
  }

  const totalOutstanding = invoices
    .filter((i: any) => i.status === "sent" || i.status === "overdue")
    .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);

  const totalCollected = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Rent Invoices</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Generate and manage rent invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-3.5 h-3.5" /> Generate Invoice
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)",
            color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}`,
          }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.1)" }}>
              <Receipt className="w-5 h-5" style={{ color: "#1A3C5E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Total Invoices</p>
              <p className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{invoices.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(43,174,142,0.1)" }}>
              <DollarSign className="w-5 h-5" style={{ color: "#2BAE8E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Collected</p>
              <p className="text-lg font-bold" style={{ color: "#2BAE8E" }}>₹{totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(229,62,62,0.1)" }}>
              <DollarSign className="w-5 h-5" style={{ color: "#E53E3E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Outstanding</p>
              <p className="text-lg font-bold" style={{ color: "#E53E3E" }}>₹{totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-1">
        {["", "paid", "sent", "overdue", "draft"].map((s) => (
          <button key={s || "all"} onClick={() => setFilterStatus(s)}
            className="px-2.5 py-1 text-[10px] font-medium rounded transition-all"
            style={{ background: filterStatus === s ? "#1A3C5E" : "#F5F7FA", color: filterStatus === s ? "#FFFFFF" : "#64748B" }}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
      </div>

      {isLoading && !invoices.length ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#94A3B8" }} /></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: "#94A3B8" }} />
          <p className="text-sm" style={{ color: "#64748B" }}>No rent invoices yet. Generate your first invoice.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv: any) => {
            const isExpanded = expandedInvoice === inv.id;
            const tenantName = `${inv.tenant?.first_name || ""} ${inv.tenant?.last_name || ""}`.trim() || "—";
            return (
              <Card key={inv.id} padding={false}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}
                        className="p-0.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "#94A3B8" }}>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.08)" }}>
                        <Receipt className="w-4.5 h-4.5" style={{ color: "#1A3C5E" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm" style={{ color: "#1A2E44" }}>{inv.invoice_number}</span>
                          <Badge variant={INVOICE_BADGE[inv.status] || "gray"}>{inv.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#64748B" }}>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{tenantName}</span>
                          <span>{inv.agreement_ref || "—"}</span>
                          <span>Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "#1A2E44" }}>₹{Number(inv.total_amount || 0).toLocaleString()}</span>
                      {inv.status === "sent" && (
                        <Button size="sm" variant="secondary" onClick={() => handleMarkPaid(inv.id)} disabled={isUpdating}>
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }}>
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="font-medium" style={{ color: "#64748B" }}>Period</p>
                        <p style={{ color: "#1A2E44" }}>
                          {inv.period_start ? new Date(inv.period_start).toLocaleDateString() : "—"} - {inv.period_end ? new Date(inv.period_end).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "#64748B" }}>Rent</p>
                        <p style={{ color: "#1A2E44" }}>₹{Number(inv.rent_amount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "#64748B" }}>Maintenance</p>
                        <p style={{ color: "#1A2E44" }}>₹{Number(inv.maintenance_charges || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: "#64748B" }}>Late Fee</p>
                        <p style={{ color: "#1A2E44" }}>₹{Number(inv.late_fee || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    {inv.paid_at && (
                      <div className="mt-2 text-xs" style={{ color: "#2BAE8E" }}>
                        Paid on: {new Date(inv.paid_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>Generate Rent Invoice</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Active Lease *</label>
                <select required value={formData.lease_id}
                  onChange={(e) => setFormData({ ...formData, lease_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  <option value="">Select Lease</option>
                  {leases.map((l: any) => {
                    const name = `${l.tenant?.first_name || ""} ${l.tenant?.last_name || ""}`.trim() || l.agreement_ref;
                    return <option key={l.id} value={l.id}>{l.agreement_ref} — {name}</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Period Start *</label>
                  <input type="date" required value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Period End *</label>
                  <input type="date" required value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Rent Amount (₹) *</label>
                  <input type="number" required min={1} value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Maintenance Charges</label>
                  <input type="number" min={0} value={formData.maintenance_charges}
                    onChange={(e) => setFormData({ ...formData, maintenance_charges: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Late Fee</label>
                  <input type="number" min={0} value={formData.late_fee}
                    onChange={(e) => setFormData({ ...formData, late_fee: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Due Date *</label>
                <input type="date" required value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isCreating}>
                  {isCreating ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Generating</> : "Generate Invoice"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
