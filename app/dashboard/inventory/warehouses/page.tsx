"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, MapPin, Phone, User, Package } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useWarehouses, useProperties } from "@/lib/hooks";
import { useCreateWarehouse } from "@/lib/hooks/mutations";

function SkeletonRow() {
  return <div className="h-12 rounded animate-pulse mb-2" style={{ background: "var(--color-light)" }} />;
}

export default function WarehousesPage() {
  const { warehouses, isLoading, isError, mutate } = useWarehouses();
  const { properties = [] } = useProperties();
  const createWarehouse = useCreateWarehouse();
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", location: "", manager_name: "", phone: "", property_id: "" });

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const displayData = (warehouses || []) as any[];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createWarehouse.trigger({
        name: form.name, code: form.code || null, location: form.location || null,
        manager_name: form.manager_name || null, phone: form.phone || null, property_id: form.property_id || null,
      } as any);
      setActionFeedback({ type: "success", message: "Warehouse created" });
      setShowModal(false);
      setForm({ name: "", code: "", location: "", manager_name: "", phone: "", property_id: "" });
      mutate();
    } catch {
      setActionFeedback({ type: "error", message: "Failed to create warehouse" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Warehouses</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Manage inventory storage locations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Warehouse
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

      <Card>
        <CardHeader title="All Warehouses" subtitle={`${displayData.length} location(s)`} />
        {isLoading ? (
          <div className="space-y-1">{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-danger)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Failed to load warehouses</p>
          </div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No warehouses created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayData.map((w: any) => (
              <div key={w.id} className="p-4 rounded-lg" style={{ background: "var(--color-light)" }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5" style={{ color: "var(--color-navy)" }} />
                    <div>
                      <div className="font-medium" style={{ color: "var(--color-text)" }}>{w.name}</div>
                      {w.code && <div className="text-xs font-mono" style={{ color: "var(--color-text-faint)" }}>{w.code}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    <Package className="w-3 h-3" /> {w.item_count || 0} items
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {w.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {w.location}</div>}
                  {w.manager_name && <div className="flex items-center gap-1"><User className="w-3 h-3" /> {w.manager_name}</div>}
                  {w.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {w.phone}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-lg" style={{ color: "var(--color-navy)" }}>Add Warehouse</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                  placeholder="e.g. Main Store" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Code</label>
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                    placeholder="e.g. WH-01" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Property</label>
                  <select value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "var(--color-border)" }}>
                    <option value="">All</option>
                    {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                  placeholder="e.g. Ground Floor, Block A" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Manager Name</label>
                  <input type="text" value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Phone</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : "Create Warehouse"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
