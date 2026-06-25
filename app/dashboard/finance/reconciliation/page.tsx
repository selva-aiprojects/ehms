"use client";

import { useState, useEffect } from "react";
import { Landmark, Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, Search, Filter, DollarSign, Calendar, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useProperties } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-12 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ReconciliationPage() {
  const { properties = [] } = useProperties();
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    property_id: "", bank_ref: "", transaction_date: "", amount: "", description: "",
  });

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  async function loadRecords() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const data = await fetcher(`/api/finance/reconciliation?${params}`);
      setRecords(data?.data || []);
    } catch {
      setActionFeedback({ type: "error", message: "Failed to load records" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadRecords(); }, [statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/finance/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ type: "success", message: "Reconciliation entry created" });
        setShowModal(false);
        setForm({ property_id: "", bank_ref: "", transaction_date: "", amount: "", description: "" });
        loadRecords();
      } else {
        setActionFeedback({ type: "error", message: data.error || "Failed to create" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMatch(id: string, paymentId: string) {
    try {
      const res = await fetch(`/api/finance/reconciliation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "matched", matched_payment_id: paymentId || null }),
      });
      if (res.ok) {
        setActionFeedback({ type: "success", message: "Transaction matched" });
        loadRecords();
      }
    } catch {
      setActionFeedback({ type: "error", message: "Failed to match" });
    }
  }

  const matchedCount = records.filter((r: any) => r.status === "matched").length;
  const unmatchedCount = records.filter((r: any) => r.status === "unmatched").length;
  const totalAmount = records.reduce((s: number, r: any) => s + parseFloat(r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Bank Reconciliation</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Match bank transactions with system payments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Transaction
          </Button>
          <button onClick={loadRecords} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
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
          }}
        >
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ background: "#2BAE8E" }}>
          <div className="text-2xl font-bold text-white">{records.length}</div>
          <div className="text-xs text-white/80">Total Transactions</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#1A3C5E" }}>
          <div className="text-2xl font-bold text-white">{matchedCount}</div>
          <div className="text-xs text-white/80">Matched</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#E53E3E" }}>
          <div className="text-2xl font-bold text-white">{unmatchedCount}</div>
          <div className="text-xs text-white/80">Unmatched</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#F5A623" }}>
          <div className="text-2xl font-bold text-white">₹{totalAmount.toLocaleString()}</div>
          <div className="text-xs text-white/80">Total Amount</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Bank Transactions"
          action={
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0", color: "#1A2E44" }}>
                <option value="all">All Status</option>
                <option value="matched">Matched</option>
                <option value="unmatched">Unmatched</option>
              </select>
            </div>
          }
        />
        {isLoading ? (
          <div className="space-y-1">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <Landmark className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No bank transactions</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowModal(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Transaction
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {records.map((r: any) => {
              const badgeVariant = r.status === "matched" ? "teal" as const : r.status === "unmatched" ? "red" as const : "amber" as const;
              const date = r.transaction_date ? new Date(r.transaction_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";
              return (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: r.status === "matched" ? "rgba(42,157,143,0.15)" : "rgba(229,62,62,0.1)" }}>
                      <DollarSign className="w-4 h-4" style={{ color: r.status === "matched" ? "#2BAE8E" : "#E53E3E" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{r.bank_ref}</div>
                      <div className="text-xs" style={{ color: "#64748B" }}>
                        {r.description || "—"} · {date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm" style={{ color: "#1A2E44" }}>₹{parseFloat(r.amount).toLocaleString()}</span>
                    {r.payment && (
                      <Badge variant="gray">₹{parseFloat(r.payment.amount).toLocaleString()}</Badge>
                    )}
                    <Badge variant={badgeVariant}>{r.status}</Badge>
                    {r.status === "unmatched" && (
                      <Button variant="outline" size="sm" onClick={() => handleMatch(r.id, "")}>
                        <CheckCircle className="w-3 h-3" /> Match
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>Add Bank Transaction</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Property *</label>
                <select required value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  <option value="">Select Property</option>
                  {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Bank Reference *</label>
                <input type="text" required value={form.bank_ref} onChange={(e) => setForm({ ...form, bank_ref: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                  placeholder="e.g. BOB-CHQ-001234" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Transaction Date *</label>
                  <input type="date" required value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Amount (₹) *</label>
                  <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : "Add Transaction"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
