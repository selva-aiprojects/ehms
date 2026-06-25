"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, Plus, Search, Loader2, RefreshCw, CheckCircle, AlertCircle,
  ChevronDown, ChevronRight, X, ArrowUpRight, ArrowDownLeft, User, Home
} from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useDeposits, useLeases } from "@/lib/hooks";
import { useCreateDepositTransaction } from "@/lib/hooks/mutations";

const TX_TYPE_BADGE: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  deposit_received: "teal", interest: "navy", deduction: "red", refund: "amber",
};

export default function DepositsPage() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedLease, setExpandedLease] = useState<string | null>(null);
  const [filterLeaseId, setFilterLeaseId] = useState("");

  const { deposits = [], isLoading, mutate } = useDeposits(filterLeaseId || undefined);
  const { leases = [] } = useLeases({ status: "active" });

  const { trigger: createDeposit, isMutating: isCreating } = useCreateDepositTransaction();

  const [formData, setFormData] = useState({
    lease_id: "", transaction_type: "deposit_received",
    amount: "", description: "",
  });

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  function resetForm() {
    setFormData({ lease_id: "", transaction_type: "deposit_received", amount: "", description: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createDeposit({
        lease_id: formData.lease_id,
        transaction_type: formData.transaction_type,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
      } as any);

      setActionFeedback({ type: "success", message: "Deposit transaction recorded" });
      setShowModal(false);
      resetForm();
      mutate();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Failed to record transaction" });
    }
  }

  const totalHeld = deposits
    .filter((d: any) => d.transaction_type === "deposit_received")
    .reduce((s: number, d: any) => s + Number(d.amount), 0);

  const totalRefunded = deposits
    .filter((d: any) => d.transaction_type === "refund")
    .reduce((s: number, d: any) => s + Number(d.amount), 0);

  const totalDeducted = deposits
    .filter((d: any) => d.transaction_type === "deduction")
    .reduce((s: number, d: any) => s + Number(d.amount), 0);

  const netHeld = totalHeld - totalRefunded - totalDeducted;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Deposit Ledger</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Track security deposits, deductions, and refunds</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-3.5 h-3.5" /> Record Transaction
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

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(43,174,142,0.1)" }}>
              <DollarSign className="w-5 h-5" style={{ color: "#2BAE8E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Net Held</p>
              <p className="text-lg font-bold" style={{ color: "#2BAE8E" }}>₹{netHeld.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.1)" }}>
              <ArrowDownLeft className="w-5 h-5" style={{ color: "#1A3C5E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Total Received</p>
              <p className="text-lg font-bold" style={{ color: "#1A3C5E" }}>₹{totalHeld.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(229,62,62,0.1)" }}>
              <ArrowUpRight className="w-5 h-5" style={{ color: "#E53E3E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Deductions</p>
              <p className="text-lg font-bold" style={{ color: "#E53E3E" }}>₹{totalDeducted.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.1)" }}>
              <ArrowUpRight className="w-5 h-5" style={{ color: "#F5A623" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Refunded</p>
              <p className="text-lg font-bold" style={{ color: "#F5A623" }}>₹{totalRefunded.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <select value={filterLeaseId}
          onChange={(e) => setFilterLeaseId(e.target.value)}
          className="max-w-xs px-3 py-1.5 text-xs rounded-lg border outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
          <option value="">All Leases</option>
          {leases.map((l: any) => (
            <option key={l.id} value={l.id}>{l.agreement_ref}</option>
          ))}
        </select>
      </div>

      {isLoading && !deposits.length ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#94A3B8" }} /></div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-10 h-10 mx-auto mb-3" style={{ color: "#94A3B8" }} />
          <p className="text-sm" style={{ color: "#64748B" }}>No deposit transactions yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deposits.map((dep: any) => {
            const tenantName = `${dep.tenant?.first_name || ""} ${dep.tenant?.last_name || ""}`.trim() || "—";
            const isCredit = dep.transaction_type === "deposit_received" || dep.transaction_type === "interest";
            return (
              <Card key={dep.id} padding={false}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: isCredit ? "rgba(43,174,142,0.1)" : "rgba(229,62,62,0.1)" }}>
                      {isCredit
                        ? <ArrowDownLeft className="w-4.5 h-4.5" style={{ color: "#2BAE8E" }} />
                        : <ArrowUpRight className="w-4.5 h-4.5" style={{ color: "#E53E3E" }} />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: "#1A2E44" }}>
                          {dep.transaction_type?.replace(/_/g, " ")}
                        </span>
                        <Badge variant={TX_TYPE_BADGE[dep.transaction_type] || "gray"}>
                          {dep.transaction_type?.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#64748B" }}>
                        <span>{dep.agreement_ref || "—"}</span>
                        <span>{tenantName}</span>
                        {dep.description && <span>— {dep.description}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${isCredit ? "" : ""}`}
                      style={{ color: isCredit ? "#2BAE8E" : "#E53E3E" }}>
                      {isCredit ? "+" : "-"}₹{Number(dep.amount || 0).toLocaleString()}
                    </span>
                    <div className="text-[10px]" style={{ color: "#94A3B8" }}>
                      {dep.transaction_date ? new Date(dep.transaction_date).toLocaleDateString() : "—"}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>Record Deposit Transaction</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Lease *</label>
                <select required value={formData.lease_id}
                  onChange={(e) => setFormData({ ...formData, lease_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  <option value="">Select Lease</option>
                  {leases.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.agreement_ref}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Transaction Type *</label>
                <select required value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  <option value="deposit_received">Deposit Received</option>
                  <option value="deduction">Deduction</option>
                  <option value="refund">Refund</option>
                  <option value="interest">Interest</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Amount (₹) *</label>
                <input type="number" required min={1} value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Description</label>
                <textarea value={formData.description} rows={2}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={{ borderColor: "#E2E8F0" }}
                  placeholder="Optional description..." />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isCreating}>
                  {isCreating ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Recording</> : "Record Transaction"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
