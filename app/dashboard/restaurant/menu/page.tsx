"use client";

import { useState } from "react";
import { BookOpen, Plus, Edit3, XCircle, Loader2, Search } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useFnBMenu } from "@/lib/hooks";
import { useUpdateMenuItem, useDeleteMenuItem } from "@/lib/hooks/mutations";
import { toast } from "react-hot-toast";

const MENU_CATEGORIES = ["Breakfast", "Appetizers", "Main Course", "Desserts", "Beverages", "Room Service Specials"];

const emptyForm = {
  item_name: "", price: "", category: "Main Course", is_available: true,
  is_veg: false, prep_time_mins: "", description: "", photo_url: "",
};

export default function MenuMgmtPage() {
  const { menu, mutate: mutateMenu, isLoading } = useFnBMenu();
  const { trigger: updateItem } = useUpdateMenuItem();
  const { trigger: deleteItem } = useDeleteMenuItem();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = (menu || []).filter((m: any) => {
    if (activeCategory !== "All" && m.category !== activeCategory) return false;
    if (search && !m.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      item_name: item.item_name, price: String(item.price), category: item.category,
      is_available: item.is_available, is_veg: item.is_veg || false,
      prep_time_mins: item.prep_time_mins ? String(item.prep_time_mins) : "",
      description: item.description || "", photo_url: item.photo_url || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.item_name || !form.price) return toast.error("Name and price required");
    setSaving(true);
    try {
      const body = {
        ...form,
        price: Number(form.price),
        prep_time_mins: form.prep_time_mins ? Number(form.prep_time_mins) : null,
      };
      if (editingId) {
        await updateItem(editingId, body);
        toast.success("Menu item updated");
      } else {
        const res = await fetch("/api/dashboard/f-and-b/menu", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Menu item created");
      }
      await mutateMenu();
      setShowModal(false);
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const handleToggle = async (item: any) => {
    try {
      await updateItem(item.id, { is_available: !item.is_available });
      await mutateMenu();
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this menu item?")) return;
    try {
      await deleteItem(id);
      await mutateMenu();
      toast.success("Item deactivated");
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-navy)" }}>
            <BookOpen className="w-6 h-6 text-[var(--color-primary)]" /> Menu Management
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">Manage restaurant menu items, pricing, and availability.</p>
        </div>
        <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {["All", ...MENU_CATEGORIES].map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
              style={{
                background: activeCategory === cat ? "var(--color-navy)" : "var(--color-light)",
                color: activeCategory === cat ? "var(--color-white)" : "var(--color-text-muted)",
              }}>{cat}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none w-48"
            placeholder="Search items..." />
        </div>
      </div>

      <Card padding={false}>
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-7 h-7 animate-spin text-[var(--color-text-muted)]" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-muted)]">
            <BookOpen className="w-8 h-8 mx-auto mb-3 text-gray-300" />No menu items found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filtered.map((item: any) => (
              <div key={item.id} className="border border-[var(--color-border)] rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--color-navy)] truncate">{item.item_name}</span>
                      {item.is_veg ? (
                        <span className="text-[10px] text-green-600 border border-green-400 rounded px-1">VEG</span>
                      ) : (
                        <span className="text-[10px] text-red-500 border border-red-400 rounded px-1">NON-VEG</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.category}</div>
                    {item.description && <div className="text-xs text-[var(--color-text-muted)] mt-1 truncate">{item.description}</div>}
                  </div>
                  <div className="text-right ml-2">
                    <div className="font-bold text-[var(--color-primary)]">₹{item.price}</div>
                    {item.prep_time_mins && <div className="text-[10px] text-[var(--color-text-muted)]">{item.prep_time_mins}m prep</div>}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
                  <button onClick={() => handleToggle(item)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${item.is_available ? "bg-[var(--color-success-soft)] text-[var(--color-success-dark)] hover:bg-[var(--color-success-soft)]" : "bg-[var(--color-danger-soft)] text-[var(--color-danger-dark)] hover:bg-[#FECACA]"}`}>
                    {item.is_available ? "Available" : "Unavailable"}
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[var(--color-light)] text-[var(--color-text-muted)] hover:text-[var(--color-navy)] transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-navy)]">{editingId ? "Edit Menu Item" : "Add Menu Item"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Item Name *</label>
                <input type="text" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Price *</label>
                  <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none">
                    {MENU_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Prep Time (min)</label>
                  <input type="number" min={0} value={form.prep_time_mins} onChange={(e) => setForm({ ...form, prep_time_mins: e.target.value })}
                    className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" />
                </div>
                <div className="flex items-end gap-4 pb-1">
                  <label className="flex items-center gap-2 text-sm text-[var(--color-navy)] cursor-pointer">
                    <input type="checkbox" checked={form.is_veg} onChange={(e) => setForm({ ...form, is_veg: e.target.checked })} className="rounded" /> Veg
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--color-navy)] cursor-pointer">
                    <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="rounded" /> Available
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
                  rows={2} placeholder="Short description..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Photo URL</label>
                <input type="url" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
                  placeholder="https://..." />
              </div>
            </div>
            <div className="p-4 border-t bg-[var(--color-light)]">
              <button onClick={handleSave} disabled={saving || !form.item_name || !form.price}
                className="w-full bg-[var(--color-navy)] hover:bg-[var(--color-dark-navy)] text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingId ? "Update Item" : "Add Item"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
