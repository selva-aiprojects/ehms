"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Package, AlertCircle, Loader2, RefreshCw, Search as SearchIcon,
  Plus, X, Save, DollarSign, BarChart3, Building2, CheckCircle
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { usePartsInventory } from "@/lib/hooks";
import { useProperties } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

function StockBarVisual({ current, reorder }: { current: number; reorder: number }) {
  const max = Math.max(current, reorder) * 2;
  const pct = Math.min((current / max) * 100, 100);
  const color = current <= 0 ? "#E53E3E" : current <= reorder ? "#F5A623" : "#2BAE8E";
  return (
    <div className="w-full h-2 rounded-full" style={{ background: "#E2E8F0" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function PartStatusBadge({ qty, reorder }: { qty: number; reorder: number }) {
  if (qty <= 0) return <Badge variant="red">Out of Stock</Badge>;
  if (qty <= reorder) return <Badge variant="amber">Low Stock</Badge>;
  return <Badge variant="teal">In Stock</Badge>;
}

export default function PartsPage() {
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<{ id: string; name: string } | null>(null);
  const [addStockQty, setAddStockQty] = useState(0);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    part_name: "", part_code: "", quantity_in_stock: 0, reorder_level: 0, unit_price: 0, vendor_id: "",
  });
  const { inventory, isLoading, isError, mutate } = usePartsInventory(propertyFilter || undefined);
  const { properties: properties } = useProperties();
  const displayInventory = (inventory || []) as any[];

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const filtered = displayInventory.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.part_name?.toLowerCase().includes(q) || p.part_code?.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setFormData({ part_name: "", part_code: "", quantity_in_stock: 0, reorder_level: 0, unit_price: 0, vendor_id: "" });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.part_name?.trim()) {
      setFeedback({ type: "error", message: "Part name is required" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/maintenance/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Save failed");
      setFeedback({ type: "success", message: "Part created" });
      setShowAddModal(false);
      mutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to create part" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddStock = async () => {
    if (!showStockModal || addStockQty <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/maintenance/inventory/${showStockModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity_in_stock: addStockQty }),
      });
      if (!res.ok) throw new Error("Update failed");
      setFeedback({ type: "success", message: `Stock added to ${showStockModal.name}` });
      setShowStockModal(null);
      setAddStockQty(0);
      mutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to add stock" });
    } finally {
      setSaving(false);
    }
  };

  const lowStockCount = filtered.filter((p) => p.quantity_in_stock <= p.reorder_level).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Parts Inventory</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage spare parts and stock levels</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
            <Plus className="w-3.5 h-3.5" /> Add Part
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{
          background: feedback.type === "success" ? "rgba(43,174,142,0.08)" : "rgba(229,62,62,0.08)",
          color: feedback.type === "success" ? "#2BAE8E" : "#E53E3E",
          border: feedback.type === "success" ? "1px solid rgba(43,174,142,0.2)" : "1px solid rgba(229,62,62,0.2)",
        }}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" /> Failed to load inventory.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {isLoading && !inventory ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}>
              <div className="w-12 h-8 rounded mb-2" style={{ background: "#CBD5E1" }} />
              <div className="w-16 h-3 rounded" style={{ background: "#CBD5E1" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{filtered.length}</div>
              <Package className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Total Parts</div>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{filtered.length - lowStockCount}</div>
              <CheckCircle className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">In Stock</div>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ background: "#F5A623" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{lowStockCount}</div>
              <AlertCircle className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Low / Out of Stock</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#F5F7FA" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>
                ${filtered.reduce((s, p) => s + (p.quantity_in_stock || 0) * (p.unit_price || 0), 0).toLocaleString()}
              </div>
              <DollarSign className="w-5 h-5" style={{ color: "#64748B" }} />
            </div>
            <div className="text-xs" style={{ color: "#64748B" }}>Total Value</div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader
          title="Parts List"
          subtitle={`${filtered.length} parts · ${lowStockCount} below reorder level`}
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#64748B" }} />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search parts..."
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border w-40"
                  style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
              </div>
              <select value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                <option value="">All Properties</option>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          }
        />
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No parts found</p>
          </div>
        ) : (
          <Table
            data={filtered}
            keyExtractor={(p: any) => p.id}
            columns={[
              { key: "part_name", header: "Part Name", render: (p: any) => <span className="text-sm font-medium">{p.part_name}</span> },
              { key: "part_code", header: "Part Code", render: (p: any) => <span className="font-mono text-xs" style={{ color: "#667085" }}>{p.part_code || "—"}</span> },
              { key: "quantity_in_stock", header: "In Stock", render: (p: any) => (
                <div className="flex flex-col gap-1">
                  <span className={`text-sm font-bold ${p.quantity_in_stock <= p.reorder_level ? "text-red-500" : ""}`}>{p.quantity_in_stock}</span>
                  <StockBarVisual current={p.quantity_in_stock} reorder={p.reorder_level} />
                </div>
              )},
              { key: "reorder_level", header: "Reorder Level", render: (p: any) => <span className="text-xs" style={{ color: "#667085" }}>{p.reorder_level}</span> },
              { key: "unit_price", header: "Unit Price", render: (p: any) => <span className="text-xs">${Number(p.unit_price || 0).toFixed(2)}</span> },
              { key: "status", header: "Status", render: (p: any) => <PartStatusBadge qty={p.quantity_in_stock} reorder={p.reorder_level} /> },
              { key: "actions", header: "Actions", render: (p: any) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setShowStockModal({ id: p.id, name: p.part_name })} className="p-1 rounded hover:bg-gray-100" title="Add Stock">
                    <Plus className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
                  </button>
                </div>
              )},
            ]}
          />
        )}
      </Card>

      {/* Add Part Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: "1px solid #E5E7EB" }}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid #E5E7EB" }}>
              <h2 className="text-base font-semibold" style={{ color: "#2C3547" }}>Add Part</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#667085" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Part Name *</label>
                  <input type="text" value={formData.part_name} onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                    style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Part Code</label>
                  <input type="text" value={formData.part_code} onChange={(e) => setFormData({ ...formData, part_code: e.target.value })}
                    style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Quantity in Stock</label>
                  <input type="number" min={0} value={formData.quantity_in_stock} onChange={(e) => setFormData({ ...formData, quantity_in_stock: Number(e.target.value) })}
                    style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Reorder Level</label>
                  <input type="number" min={0} value={formData.reorder_level} onChange={(e) => setFormData({ ...formData, reorder_level: Number(e.target.value) })}
                    style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Unit Price (₹)</label>
                  <input type="number" min={0} step="0.01" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                    style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Vendor</label>
                  <input type="text" value={formData.vendor_id} onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                    style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #E5E7EB" }}>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#667085", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => { setShowStockModal(null); setAddStockQty(0); }} />
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl" style={{ border: "1px solid #E5E7EB" }}>
            <div className="px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid #E5E7EB" }}>
              <h2 className="text-base font-semibold" style={{ color: "#2C3547" }}>Add Stock</h2>
              <button onClick={() => { setShowStockModal(null); setAddStockQty(0); }} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#667085" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <p className="text-sm font-medium" style={{ color: "#1A2E44" }}>{showStockModal.name}</p>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Quantity to Add</label>
                <input type="number" min={1} value={addStockQty} onChange={(e) => setAddStockQty(Number(e.target.value))}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #E5E7EB" }}>
              <button onClick={() => { setShowStockModal(null); setAddStockQty(0); }} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#667085", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleAddStock} disabled={saving || addStockQty <= 0} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {saving ? "Adding..." : "Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


