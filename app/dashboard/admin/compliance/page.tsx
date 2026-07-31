"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, Trash2, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useComplianceRecords, useProperties } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-12 rounded animate-pulse mb-2" style={{ background: "var(--color-light)" }} />;
}

export default function AdminCompliancePage() {
  const { records, isLoading, isError, mutate } = useComplianceRecords();
  const { properties = [] } = useProperties();
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    property_id: "", certificate_type: "", reference_number: "",
    issued_date: "", expiry_date: "", status: "active", document_url: "",
  });

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const displayRecords = (records || []) as any[];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ type: "success", message: "Compliance record created" });
        setShowModal(false);
        setForm({ property_id: "", certificate_type: "", reference_number: "", issued_date: "", expiry_date: "", status: "active", document_url: "" });
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this compliance record?")) return;
    try {
      const res = await fetch(`/api/admin/compliance/${id}`, { method: "DELETE" });
      if (res.ok) {
        setActionFeedback({ type: "success", message: "Record deleted" });
        mutate();
      } else {
        setActionFeedback({ type: "error", message: "Failed to delete" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error" });
    }
  }

  const expiredCount = displayRecords.filter((r: any) => r.status === "expired").length;
  const validCount = displayRecords.filter((r: any) => r.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Compliance Vault</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Manage certificates, licenses & compliance records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Record
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
          <div className="text-2xl font-bold text-white">{displayRecords.length}</div>
          <div className="text-xs text-white/80">Total Records</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--color-navy)" }}>
          <div className="text-2xl font-bold text-white">{validCount}</div>
          <div className="text-xs text-white/80">Valid</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--color-danger)" }}>
          <div className="text-2xl font-bold text-white">{expiredCount}</div>
          <div className="text-xs text-white/80">Expired</div>
        </div>
      </div>

      <Card>
        <CardHeader title="Compliance Records" subtitle={`${displayRecords.length} record(s)`} />
        {isLoading ? (
          <div className="space-y-1">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-danger)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Failed to load records</p>
          </div>
        ) : displayRecords.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No compliance records</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowModal(true)}>
              <Plus className="w-3.5 h-3.5" /> Add First Record
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {displayRecords.map((r: any) => {
              const expiryDate = r.expiry_date ? new Date(r.expiry_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";
              const badgeVariant = r.status === "active" ? "teal" as const : r.status === "expired" ? "red" as const : "amber" as const;
              return (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Shield className="w-5 h-5 shrink-0" style={{ color: r.status === "active" ? "var(--color-primary)" : r.status === "expired" ? "var(--color-danger)" : "var(--color-warning)" }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{r.certificate_type}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {r.reference_number && <span>Ref: {r.reference_number} · </span>}
                        Expires: {expiryDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={badgeVariant}>{r.status}</Badge>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "var(--color-text-faint)" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-lg" style={{ color: "var(--color-navy)" }}>Add Compliance Record</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Certificate Type *</label>
                <input type="text" required value={form.certificate_type} onChange={(e) => setForm({ ...form, certificate_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                  placeholder="e.g. Fire Safety Certificate" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Property</label>
                <select value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "var(--color-border)" }}>
                  <option value="">All Properties</option>
                  {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Reference Number</label>
                  <input type="text" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "var(--color-border)" }}>
                    <option value="active">Active</option>
                    <option value="expiring_soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Issued Date</label>
                  <input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Expiry Date *</label>
                  <input type="date" required value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Document URL</label>
                <input type="url" value={form.document_url} onChange={(e) => setForm({ ...form, document_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                  placeholder="https://docs.example.com/cert.pdf" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : "Create Record"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
