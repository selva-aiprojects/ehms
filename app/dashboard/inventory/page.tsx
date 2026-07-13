"use client";

import { useState, useEffect } from "react";
import { Package, DollarSign, AlertTriangle, Layers, Plus, Search, RefreshCw, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useInventoryItems, useInventoryCategories, useInventoryStats, useProperties, useWarehouses } from "@/lib/hooks";
import { useCreateInventoryItem, useCreateInventoryCategory } from "@/lib/hooks/mutations";

export default function InventoryDashboard() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const { invStats, isLoading: statsLoading } = useInventoryStats();
  const { inventoryItems = [], isLoading: itemsLoading, mutate: mutateItems } = useInventoryItems();
  const { categories = [], mutate: mutateCategories } = useInventoryCategories();
  const { warehouses = [] } = useWarehouses();
  const { properties = [] } = useProperties();

  const createItem = useCreateInventoryItem();
  const createCategory = useCreateInventoryCategory();

  const [itemForm, setItemForm] = useState({
    name: "", category_id: "", description: "", unit: "pcs", quantity_on_hand: 0,
    reorder_level: 0, reorder_quantity: 0, unit_cost: 0, warehouse_id: "", property_id: "",
  });
  const [catForm, setCatForm] = useState({ name: "", description: "", property_id: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  function resetItemForm() {
    setItemForm({ name: "", category_id: "", description: "", unit: "pcs", quantity_on_hand: 0, reorder_level: 0, reorder_quantity: 0, unit_cost: 0, warehouse_id: "", property_id: "" });
  }

  function resetCatForm() {
    setCatForm({ name: "", description: "", property_id: "" });
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createItem.trigger(itemForm as any);
      setActionFeedback({ type: "success", message: "Item created successfully" });
      setShowAddItem(false);
      resetItemForm();
      mutateItems();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err?.message || "Failed to create item" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createCategory.trigger(catForm as any);
      setActionFeedback({ type: "success", message: "Category created successfully" });
      setShowAddCategory(false);
      resetCatForm();
      mutateCategories();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err?.message || "Failed to create category" });
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
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Inventory Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Track stock, manage categories and warehouses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { resetCatForm(); setShowAddCategory(true); }}>
            <Layers className="w-3.5 h-3.5" /> Add Category
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { resetItemForm(); setShowAddItem(true); }}>
            <Plus className="w-3.5 h-3.5" /> Add Item
          </Button>
          <button onClick={() => { mutateItems(); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }}>
            <RefreshCw className={`w-4 h-4 ${itemsLoading ? "animate-spin" : ""}`} />
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(43,174,142,0.12)" }}>
              <Package className="w-5 h-5" style={{ color: "#2BAE8E" }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "#1A3C5E" }}>{statsLoading ? "..." : stats.total_items || 0}</div>
              <div className="text-xs" style={{ color: "#64748B" }}>Total Items</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.10)" }}>
              <DollarSign className="w-5 h-5" style={{ color: "#1A3C5E" }} />
            </div>
            <div>
              <div className="text-2xl font-bold mt-1" style={{ color: "#1A3C5E" }}>
                {statsLoading ? "..." : `₹${parseFloat(stats.total_value || 0).toLocaleString()}`}
              </div>
              <div className="text-xs" style={{ color: "#64748B" }}>Total Value</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.12)" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#F5A623" }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "#1A3C5E" }}>{statsLoading ? "..." : stats.low_stock_count || 0}</div>
              <div className="text-xs" style={{ color: "#64748B" }}>Low Stock Items</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.10)" }}>
              <Layers className="w-5 h-5" style={{ color: "#6366F1" }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "#1A3C5E" }}>{statsLoading ? "..." : stats.total_categories || 0}</div>
              <div className="text-xs" style={{ color: "#64748B" }}>Categories</div>
            </div>
          </div>
        </Card>
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
          {(categories || []).map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader title="Inventory Items" subtitle={`${filteredItems.length} items found`} />
        {itemsLoading && !inventoryItems.length ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#94A3B8" }} /></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-8 h-8 mx-auto mb-2" style={{ color: "#94A3B8" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No items found. Add your first inventory item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["SKU", "Name", "Category", "Warehouse", "Qty On Hand", "Reorder Level", "Unit Cost", "Total Value", "Status"].map((h) => (
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
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{item.quantity_on_hand}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748B" }}>{item.reorder_level}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748B" }}>${parseFloat(item.unit_cost || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#1A3C5E" }}>${parseFloat(item.total_value || 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge variant={stockBadge(item)}>{stockLabel(item)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>Add Inventory Item</h3>
              <button onClick={() => { setShowAddItem(false); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Item Name *</label>
                  <input type="text" required value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="Toilet Paper" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Category</label>
                  <select value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Select Category</option>
                    {(categories || []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Unit</label>
                  <select value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    {["pcs", "kg", "g", "l", "ml", "box", "pack", "roll", "bottle", "bag"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Description</label>
                <textarea value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                  rows={2} placeholder="Optional description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Quantity On Hand</label>
                  <input type="number" min="0" step="0.01" value={itemForm.quantity_on_hand}
                    onChange={(e) => setItemForm({ ...itemForm, quantity_on_hand: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Unit Cost (₹)</label>
                  <input type="number" min="0" step="0.01" value={itemForm.unit_cost}
                    onChange={(e) => setItemForm({ ...itemForm, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Reorder Level</label>
                  <input type="number" min="0" step="0.01" value={itemForm.reorder_level}
                    onChange={(e) => setItemForm({ ...itemForm, reorder_level: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Reorder Quantity</label>
                  <input type="number" min="0" step="0.01" value={itemForm.reorder_quantity}
                    onChange={(e) => setItemForm({ ...itemForm, reorder_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Warehouse</label>
                  <select value={itemForm.warehouse_id}
                    onChange={(e) => setItemForm({ ...itemForm, warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Select Warehouse</option>
                    {(warehouses || []).map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Property</label>
                  <select value={itemForm.property_id}
                    onChange={(e) => setItemForm({ ...itemForm, property_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Select Property</option>
                    {(properties || []).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddItem(false); }}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : "Create Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>Add Category</h3>
              <button onClick={() => { setShowAddCategory(false); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Category Name *</label>
                <input type="text" required value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                  placeholder="Cleaning Supplies" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Description</label>
                <textarea value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                  rows={2} placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Property</label>
                <select value={catForm.property_id}
                  onChange={(e) => setCatForm({ ...catForm, property_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  <option value="">All Properties</option>
                  {(properties || []).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddCategory(false); }}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
