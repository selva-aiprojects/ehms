"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Edit2, Search, RefreshCw, Loader2, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useInventoryItems, useInventoryCategories, useWarehouses, useInventoryStats, useProperties } from "@/lib/hooks";
import { useCreateInventoryItem, useCreateInventoryTransaction } from "@/lib/hooks/mutations";

export default function InventoryItemsPage() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");

  const { inventoryItems = [], isLoading, mutate: mutateItems } = useInventoryItems();
  const { categories = [] } = useInventoryCategories();
  const { warehouses = [] } = useWarehouses();
  const { invStats, isLoading: statsLoading } = useInventoryStats();
  const { properties = [] } = useProperties();

  const createItem = useCreateInventoryItem();
  const createTransaction = useCreateInventoryTransaction();

  const [formData, setFormData] = useState({
    name: "", category_id: "", description: "", unit: "pcs", quantity_on_hand: 0,
    reorder_level: 0, reorder_quantity: 0, unit_cost: 0, warehouse_id: "", property_id: "",
  });
  const [adjustForm, setAdjustForm] = useState({ type: "purchase_receipt", quantity: 0, notes: "", unit_cost: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  function resetForm() {
    setFormData({ name: "", category_id: "", description: "", unit: "pcs", quantity_on_hand: 0, reorder_level: 0, reorder_quantity: 0, unit_cost: 0, warehouse_id: "", property_id: "" });
  }

  function handleEdit(item: any) {
    setEditItem(item);
    setFormData({
      name: item.name || "", category_id: item.category_id || "", description: item.description || "",
      unit: item.unit || "pcs", quantity_on_hand: parseFloat(item.quantity_on_hand || 0),
      reorder_level: parseFloat(item.reorder_level || 0), reorder_quantity: parseFloat(item.reorder_quantity || 0),
      unit_cost: parseFloat(item.unit_cost || 0), warehouse_id: item.warehouse_id || "", property_id: item.property_id || "",
    });
    setShowEditModal(true);
  }

  function handleAdjust(item: any) {
    setAdjustItem(item);
    setAdjustForm({ type: "purchase_receipt", quantity: 0, notes: "", unit_cost: parseFloat(item.unit_cost || 0) });
    setShowAdjustModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isEdit = !!editItem;
      if (isEdit) {
        const res = await fetch(`/api/inventory/items/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
        setActionFeedback({ type: "success", message: "Item updated successfully" });
      } else {
        await createItem.trigger(formData as any);
        setActionFeedback({ type: "success", message: "Item created successfully" });
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditItem(null);
      resetForm();
      mutateItems();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err?.message || "Operation failed" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustItem || adjustForm.quantity <= 0) return;
    setIsSubmitting(true);
    try {
      await createTransaction.trigger({
        item_id: adjustItem.id,
        transaction_type: adjustForm.type,
        quantity: adjustForm.quantity,
        unit_cost: adjustForm.type === "purchase_receipt" || adjustForm.type === "adjustment_add" ? adjustForm.unit_cost : undefined,
        notes: adjustForm.notes,
        warehouse_id: adjustItem.warehouse_id,
        property_id: adjustItem.property_id,
      } as any);
      setActionFeedback({ type: "success", message: "Stock adjusted successfully" });
      setShowAdjustModal(false);
      setAdjustItem(null);
      mutateItems();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err?.message || "Adjustment failed" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredItems = (inventoryItems || []).filter((i: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!i.name?.toLowerCase().includes(q) && !i.sku?.toLowerCase().includes(q)) return false;
    }
    if (filterCategory && i.category_id !== filterCategory) return false;
    if (filterWarehouse && i.warehouse_id !== filterWarehouse) return false;
    return true;
  });

  function stockBadge(item: any) {
    if (item.quantity_on_hand <= item.reorder_level) return "red";
    if (item.quantity_on_hand <= item.reorder_level * 1.5) return "amber";
    return "teal";
  }

  function stockLabel(item: any) {
    if (item.quantity_on_hand <= item.reorder_level) return "Critical";
    if (item.quantity_on_hand <= item.reorder_level * 1.5) return "Low";
    return "In Stock";
  }

  const stats = invStats || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Inventory Items</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage all stock items across warehouses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setEditItem(null); resetForm(); setShowAddModal(true); }}>
            <Plus className="w-3.5 h-3.5" /> Add Item
          </Button>
          <button onClick={() => mutateItems()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{ background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)", color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E", border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}` }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: "#F5F7FA" }}>
          <Package className="w-5 h-5" style={{ color: "#2BAE8E" }} />
          <div>
            <div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{statsLoading ? "..." : stats.total_items || 0}</div>
            <div className="text-[10px]" style={{ color: "#64748B" }}>Total Items</div>
          </div>
        </div>
        <div className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: "#F5F7FA" }}>
          <TrendingUp className="w-5 h-5" style={{ color: "#1A3C5E" }} />
          <div>
            <div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>${statsLoading ? "..." : parseFloat(stats.total_value || 0).toLocaleString()}</div>
            <div className="text-[10px]" style={{ color: "#64748B" }}>Total Value</div>
          </div>
        </div>
        <div className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: "#F5F7FA" }}>
          <TrendingDown className="w-5 h-5" style={{ color: "#E53E3E" }} />
          <div>
            <div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{statsLoading ? "..." : stats.low_stock_count || 0}</div>
            <div className="text-[10px]" style={{ color: "#64748B" }}>Low Stock</div>
          </div>
        </div>
        <div className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: "#F5F7FA" }}>
          <Package className="w-5 h-5" style={{ color: "#6366F1" }} />
          <div>
            <div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{statsLoading ? "..." : stats.total_categories || 0}</div>
            <div className="text-[10px]" style={{ color: "#64748B" }}>Categories</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border outline-none bg-white" style={{ borderColor: "#E2E8F0", color: "#1A2E44" }}>
          <option value="">All Categories</option>
          {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border outline-none bg-white" style={{ borderColor: "#E2E8F0", color: "#1A2E44" }}>
          <option value="">All Warehouses</option>
          {(warehouses || []).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader title="All Items" subtitle={`${filteredItems.length} items`} />
        {isLoading && !inventoryItems.length ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#94A3B8" }} /></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-8 h-8 mx-auto mb-2" style={{ color: "#94A3B8" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["SKU", "Name", "Category", "Warehouse", "Unit", "Qty On Hand", "Reserved", "Reorder", "Unit Cost", "Total Value", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "#FFFFFF", background: "#1A3C5E" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item: any, idx: number) => (
                  <tr key={item.id}
                    style={{ background: idx % 2 === 0 ? "#FFFFFF" : "#F5F7FA", borderBottom: "1px solid #E2E8F0" }}>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: "#64748B" }}>{item.sku || "—"}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#1A2E44" }}>{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748B" }}>{item.category?.name || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748B" }}>{item.warehouse?.name || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#94A3B8" }}>{item.unit || "pcs"}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{item.quantity_on_hand}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#F5A623" }}>{item.quantity_reserved || 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748B" }}>{item.reorder_level}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748B" }}>${parseFloat(item.unit_cost || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#1A3C5E" }}>${parseFloat(item.total_value || 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge variant={stockBadge(item)}>{stockLabel(item)}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleAdjust(item)}
                          className="p-1.5 rounded hover:bg-slate-100 transition-colors" title="Adjust Stock"
                          style={{ color: "#2BAE8E" }}>
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleEdit(item)}
                          className="p-1.5 rounded hover:bg-slate-100 transition-colors" title="Edit"
                          style={{ color: "#64748B" }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>
                {editItem ? "Edit Item" : "Add New Item"}
              </h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditItem(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Item Name *</label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                  placeholder="Item name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Category</label>
                  <select value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Select</option>
                    {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Unit</label>
                  <select value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    {["pcs", "kg", "g", "l", "ml", "box", "pack", "roll", "bottle", "bag"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Description</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                  rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Quantity On Hand</label>
                  <input type="number" min="0" step="0.01" value={formData.quantity_on_hand}
                    onChange={(e) => setFormData({ ...formData, quantity_on_hand: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Unit Cost (₹)</label>
                  <input type="number" min="0" step="0.01" value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Reorder Level</label>
                  <input type="number" min="0" step="0.01" value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Reorder Quantity</label>
                  <input type="number" min="0" step="0.01" value={formData.reorder_quantity}
                    onChange={(e) => setFormData({ ...formData, reorder_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Warehouse</label>
                  <select value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Select</option>
                    {(warehouses || []).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Property</label>
                  <select value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Select</option>
                    {(properties || []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditItem(null); }}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : editItem ? "Update Item" : "Create Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>Adjust Stock: {adjustItem.name}</h3>
              <button onClick={() => { setShowAdjustModal(false); setAdjustItem(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <div className="px-6 py-3" style={{ background: "#F5F7FA", borderBottom: "1px solid #E2E8F0" }}>
              <div className="text-xs" style={{ color: "#64748B" }}>Current Stock: <strong style={{ color: "#1A3C5E" }}>{adjustItem.quantity_on_hand}</strong> {adjustItem.unit}</div>
              <div className="text-xs" style={{ color: "#64748B" }}>SKU: {adjustItem.sku || "—"}</div>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Transaction Type *</label>
                <select required value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  <optgroup label="Inbound (adds stock)">
                    <option value="purchase_receipt">Purchase Receipt</option>
                    <option value="return">Return</option>
                    <option value="transfer_in">Transfer In</option>
                    <option value="adjustment_add">Adjustment Add</option>
                  </optgroup>
                  <optgroup label="Outbound (removes stock)">
                    <option value="sales_issue">Sales Issue</option>
                    <option value="damage">Damage</option>
                    <option value="transfer_out">Transfer Out</option>
                    <option value="adjustment_subtract">Adjustment Subtract</option>
                  </optgroup>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Quantity *</label>
                  <input type="number" required min="0.01" step="0.01" value={adjustForm.quantity || ""}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Unit Cost (₹)</label>
                  <input type="number" min="0" step="0.01" value={adjustForm.unit_cost}
                    onChange={(e) => setAdjustForm({ ...adjustForm, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Notes</label>
                <textarea value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                  rows={2} placeholder="Reason for adjustment" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowAdjustModal(false); setAdjustItem(null); }}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Processing</> : "Submit Adjustment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
