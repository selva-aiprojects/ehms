"use client";

import { useState, useEffect } from "react";
import { Layers, Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, Package, FolderOpen } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useInventoryCategories, useProperties } from "@/lib/hooks";
import { useCreateInventoryCategory } from "@/lib/hooks/mutations";

function SkeletonRow() {
  return <div className="h-12 rounded animate-pulse mb-2" style={{ background: "var(--color-light)" }} />;
}

export default function InventoryCategoriesPage() {
  const { categories, isLoading, isError, mutate } = useInventoryCategories();
  const { properties = [] } = useProperties();
  const createCategory = useCreateInventoryCategory();
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", parent_id: "", property_id: "" });

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const displayData = (categories || []) as any[];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCategory.trigger({
        name: form.name, description: form.description || null,
        parent_id: form.parent_id || null, property_id: form.property_id || null,
      } as any);
      setActionFeedback({ type: "success", message: "Category created" });
      setShowModal(false);
      setForm({ name: "", description: "", parent_id: "", property_id: "" });
      mutate();
    } catch {
      setActionFeedback({ type: "error", message: "Failed to create category" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Inventory Categories</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Organize inventory items by category</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Category
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
          <div className="text-2xl font-bold text-white">{displayData.length}</div>
          <div className="text-xs text-white/80">Total Categories</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--color-navy)" }}>
          <div className="text-2xl font-bold text-white">{displayData.filter((c: any) => c.parent_id).length}</div>
          <div className="text-xs text-white/80">Sub-Categories</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--color-warning)" }}>
          <div className="text-2xl font-bold text-white">{displayData.reduce((s: number, c: any) => s + (c.item_count || 0), 0)}</div>
          <div className="text-xs text-white/80">Items Categorized</div>
        </div>
      </div>

      <Card>
        <CardHeader title="All Categories" subtitle={`${displayData.length} category/cies`} />
        {isLoading ? (
          <div className="space-y-1">{[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-danger)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Failed to load categories</p>
          </div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-8">
            <Layers className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No categories created yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {displayData.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5" style={{ color: c.parent_id ? "var(--color-text-faint)" : "var(--color-navy)" }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{c.name}</div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {c.parent_name && <span>Parent: {c.parent_name} · </span>}
                      {c.description && <span>{c.description}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                    <Package className="w-3 h-3" /> {c.item_count || 0}
                  </span>
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
              <h3 className="font-bold text-lg" style={{ color: "var(--color-navy)" }}>Add Category</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                  placeholder="e.g. Cleaning Supplies" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Parent Category</label>
                  <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "var(--color-border)" }}>
                    <option value="">None (Top Level)</option>
                    {displayData.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
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
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
