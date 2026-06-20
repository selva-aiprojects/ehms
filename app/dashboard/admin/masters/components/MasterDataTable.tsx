"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Edit2, Trash2, Loader2, Save, X } from "lucide-react";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import Badge from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface MasterDataTableProps {
  category: string;
  title: string;
  columns: { key: string; label: string; type: "text" | "number" | "boolean" | "textarea" }[];
}

export default function MasterDataTable({ category, title, columns }: MasterDataTableProps) {
  const { data, error, isLoading, mutate } = useSWR(`/api/dashboard/masters/${category}`, fetcher);
  const [isEditing, setIsEditing] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const records = data?.data || [];

  function handleAdd() {
    setIsEditing("new");
    setFormData({ is_active: true });
  }

  function handleEdit(record: any) {
    setIsEditing(record.id);
    setFormData(record);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await fetch(`/api/dashboard/masters/${category}?id=${id}`, { method: "DELETE" });
      mutate();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSave() {
    setIsSubmitting(true);
    try {
      const method = isEditing === "new" ? "POST" : "PUT";
      const res = await fetch(`/api/dashboard/masters/${category}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsEditing(null);
        mutate();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to save");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  const tableCols = [
    ...columns.map(c => ({
      key: c.key,
      header: c.label,
      render: (r: any) => {
        if (c.type === "boolean") {
          return <Badge variant={r[c.key] ? "teal" : "gray"}>{r[c.key] ? "Yes" : "No"}</Badge>;
        }
        return <span className="text-sm">{r[c.key]}</span>;
      }
    })),
    {
      key: "actions",
      header: "Actions",
      render: (r: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(r)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(r.id)} className="p-1 hover:bg-slate-100 rounded text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <Button size="sm" onClick={handleAdd}><Plus className="w-4 h-4" /> Add New</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : error ? (
        <div className="text-red-500 p-4 bg-red-50 rounded-lg">Failed to load data.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table data={records} keyExtractor={r => r.id} columns={tableCols} />
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{isEditing === "new" ? "Add" : "Edit"} {title}</h3>
              <button onClick={() => setIsEditing(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {columns.map(c => (
                <div key={c.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{c.label}</label>
                  {c.type === "boolean" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!formData[c.key]}
                        onChange={e => setFormData({ ...formData, [c.key]: e.target.checked })}
                        className="rounded border-slate-300 text-[#1A3C5E] focus:ring-[#1A3C5E]"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                  ) : c.type === "textarea" ? (
                    <textarea 
                      value={formData[c.key] || ""}
                      onChange={e => setFormData({ ...formData, [c.key]: e.target.value })}
                      className="w-full rounded-lg border-slate-200 p-2 text-sm focus:ring-[#1A3C5E]"
                      rows={3}
                    />
                  ) : (
                    <input 
                      type={c.type}
                      value={formData[c.key] || ""}
                      onChange={e => setFormData({ ...formData, [c.key]: c.type === "number" ? parseFloat(e.target.value) : e.target.value })}
                      className="w-full rounded-lg border-slate-200 p-2 text-sm focus:ring-[#1A3C5E]"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditing(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
