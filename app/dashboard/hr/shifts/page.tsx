"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Clock, AlertCircle, Loader2, RefreshCw,
  Plus, Check, X, Edit2, Users, Save
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";

function SkeletonRow() {
  return <div className="h-14 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

const EMPTY_SHIFT = { name: "", start_time: "09:00", end_time: "18:00" };

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_SHIFT });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/shifts");
      const d = await res.json();
      setShifts(d?.data || []);
    } catch {
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchShifts(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_SHIFT });
    setShowForm(true);
  };

  const openEdit = (shift: any) => {
    setEditingId(shift.id);
    setFormData({
      name: shift.name || "",
      start_time: shift.start_time?.slice(0, 5) || "09:00",
      end_time: shift.end_time?.slice(0, 5) || "18:00",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/hr/shifts/${editingId}` : "/api/hr/shifts";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: editingId ? "Shift updated" : "Shift created" });
      setShowForm(false);
      setEditingId(null);
      fetchShifts();
    } catch {
      setFeedback({ type: "error", message: "Failed to save shift" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/hr/shifts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "Shift deleted" });
      fetchShifts();
    } catch {
      setFeedback({ type: "error", message: "Failed to delete shift" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Shift Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage shift rotations and timings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchShifts} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
            <Plus className="w-3.5 h-3.5" /> Add Shift
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{
          background: feedback.type === "success" ? "rgba(43,174,142,0.08)" : "rgba(229,62,62,0.08)",
          color: feedback.type === "success" ? "#2BAE8E" : "#E53E3E",
          border: feedback.type === "success" ? "1px solid rgba(43,174,142,0.2)" : "1px solid rgba(229,62,62,0.2)",
        }}>
          {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : shifts.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: "#64748B" }} />
          <p className="text-sm" style={{ color: "#64748B" }}>No shifts configured yet</p>
          <button onClick={openAdd} className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white mx-auto transition-colors" style={{ background: "#2BAE8E" }}>
            <Plus className="w-3.5 h-3.5" /> Add First Shift
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div key={shift.id} className="rounded-xl p-5 bg-white" style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(26,60,94,0.06)" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "#1A2E44" }}>{shift.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "#64748B" }}>
                    <Clock className="w-3.5 h-3.5" />
                    {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(shift)} className="p-1.5 rounded hover:bg-gray-100"><Edit2 className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} /></button>
                  <button onClick={() => handleDelete(shift.id)} className="p-1.5 rounded hover:bg-gray-100"><X className="w-3.5 h-3.5" style={{ color: "#E53E3E" }} /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
                <Users className="w-3.5 h-3.5" />
                <span><strong style={{ color: "#1A3C5E" }}>{shift.employee_count || shift.assigned_employees || 0}</strong> assigned employees</span>
              </div>
            </div>
          ))}

          {/* Inline Add/Edit Form */}
          {showForm && (
            <div className="rounded-xl p-5 bg-white" style={{ border: "2px solid #2BAE8E", boxShadow: "0 1px 4px rgba(26,60,94,0.06)" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A3C5E" }}>{editingId ? "Edit Shift" : "New Shift"}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Shift Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Morning Shift"
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Start Time</label>
                    <input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>End Time</label>
                    <input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
                <button onClick={handleSave} disabled={saving || !formData.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
