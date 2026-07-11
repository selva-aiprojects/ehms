"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Clock, AlertCircle, Loader2, RefreshCw,
  Plus, Check, X, Edit2, Users, Save, Calendar, UserCheck, ShieldCheck, UserX
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useJourney } from "@/components/providers/JourneyProvider";
import { useDutyRoster, useStaffAvailability } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-14 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

const EMPTY_SHIFT = { name: "", start_time: "09:00", end_time: "18:00" };

export default function ShiftsPage() {
  const { selectedPropertyId } = useJourney();
  const [activeTab, setActiveTab] = useState<"shifts" | "roster">("roster");

  const [shifts, setShifts] = useState<any[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_SHIFT });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Roster filters & state
  const [selectedShiftFilter, setSelectedShiftFilter] = useState("");
  const { roster, isLoading: rosterLoading, mutate: mutateRoster } = useDutyRoster({
    property_id: selectedPropertyId,
    shift_id: selectedShiftFilter || undefined,
  });
  const { staffAvailability, isLoading: availLoading, mutate: mutateAvail } = useStaffAvailability({
    property_id: selectedPropertyId,
  });

  const [assigningEmpId, setAssigningEmpId] = useState<string | null>(null);
  const [targetShiftId, setTargetShiftId] = useState<string>("");

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const fetchShifts = async () => {
    setLoadingShifts(true);
    try {
      const p = new URLSearchParams();
      if (selectedPropertyId && selectedPropertyId !== "all") p.set("property_id", selectedPropertyId);
      const res = await fetch(`/api/hr/shifts?${p}`);
      const d = await res.json();
      setShifts(d?.data || []);
    } catch {
      setShifts([]);
    } finally {
      setLoadingShifts(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [selectedPropertyId]);

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
      const url = editingId ? `/api/hr/shifts` : "/api/hr/shifts";
      const method = editingId ? "PUT" : "POST";
      const payload: any = { ...formData };
      if (editingId) payload.id = editingId;
      if (selectedPropertyId && selectedPropertyId !== "all") payload.property_id = selectedPropertyId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const handleAssignShift = async (empId: string, newShiftId: string) => {
    setAssigningEmpId(empId);
    try {
      const res = await fetch("/api/hr/roster", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: empId, shift_id: newShiftId || null }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "Employee shift updated" });
      mutateRoster();
      mutateAvail();
    } catch {
      setFeedback({ type: "error", message: "Failed to assign shift" });
    } finally {
      setAssigningEmpId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#1A3C5E" }}>
            <Calendar className="w-6 h-6 text-[#2BAE8E]" />
            Duty Roster & Shifts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
            Manage shift rotations, assign daily duty rosters, and monitor live staff availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg text-xs font-medium overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
            <button
              onClick={() => setActiveTab("roster")}
              className="px-3.5 py-1.5 transition-colors flex items-center gap-1.5"
              style={{ background: activeTab === "roster" ? "#1A3C5E" : "#F5F7FA", color: activeTab === "roster" ? "#FFF" : "#64748B" }}
            >
              <Users className="w-3.5 h-3.5" /> Duty Roster
            </button>
            <button
              onClick={() => setActiveTab("shifts")}
              className="px-3.5 py-1.5 transition-colors flex items-center gap-1.5"
              style={{ background: activeTab === "shifts" ? "#1A3C5E" : "#F5F7FA", color: activeTab === "shifts" ? "#FFF" : "#64748B" }}
            >
              <Clock className="w-3.5 h-3.5" /> Shift Rotations
            </button>
          </div>

          <button onClick={() => { fetchShifts(); mutateRoster(); mutateAvail(); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {activeTab === "shifts" && (
            <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
              <Plus className="w-3.5 h-3.5" /> Add Shift
            </button>
          )}
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

      {/* Roster Tab */}
      {activeTab === "roster" && (
        <div className="space-y-6">
          {/* Availability Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">{staffAvailability.length}</div>
                <Users className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Total Staff</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">
                  {staffAvailability.filter((s: any) => s.availability_status === "clocked_in" || s.availability_status === "on_duty").length}
                </div>
                <UserCheck className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Active / On Shift</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#F5A623" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">
                  {staffAvailability.filter((s: any) => s.availability_status === "shift_assigned").length}
                </div>
                <Clock className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Scheduled Today</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#E53E3E" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">
                  {staffAvailability.filter((s: any) => s.availability_status === "on_leave").length}
                </div>
                <UserX className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">On Leave Today</div>
            </div>
          </div>

          <Card>
            <CardHeader
              title="Staff Duty Roster"
              subtitle="Assign shifts to staff members and monitor real-time attendance availability"
              action={
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500">Filter Shift:</label>
                  <select
                    value={selectedShiftFilter}
                    onChange={(e) => setSelectedShiftFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-lg text-xs outline-none border bg-white"
                    style={{ borderColor: "#E2E8F0", color: "#1A2E44" }}
                  >
                    <option value="">All Shifts</option>
                    <option value="unassigned">Unassigned</option>
                    {shifts.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)})</option>
                    ))}
                  </select>
                </div>
              }
            />

            {rosterLoading || availLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : roster.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-500">No staff members found matching the selected filter.</p>
              </div>
            ) : (
              <Table
                data={roster}
                keyExtractor={(item: any) => item.id}
                columns={[
                  { key: "employee", header: "Employee", render: (item: any) => (
                    <div>
                      <span className="font-semibold text-sm block" style={{ color: "#1A2E44" }}>
                        {item.user ? `${item.user.first_name} ${item.user.last_name || ""}` : item.employee_code}
                      </span>
                      <span className="text-xs text-slate-500">{item.designation || "Staff"} · Code: {item.employee_code}</span>
                    </div>
                  )},
                  { key: "shift", header: "Assigned Shift", render: (item: any) => (
                    <div>
                      {item.shift ? (
                        <span className="font-medium text-xs px-2.5 py-1 rounded-md inline-block bg-blue-50 text-blue-700 border border-blue-100">
                          {item.shift.name} ({item.shift.start_time?.slice(0,5)} - {item.shift.end_time?.slice(0,5)})
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </div>
                  )},
                  { key: "availability", header: "Today's Availability", render: (item: any) => {
                    const avail = staffAvailability.find((a: any) => a.id === item.id);
                    const status = avail?.availability_status || "off_duty";
                    const badge = avail?.availability_badge || { text: "Off Duty", color: "gray" };

                    return (
                      <Badge variant={badge.color as any}>
                        {badge.text}
                      </Badge>
                    );
                  }},
                  { key: "action", header: "Assign / Change Shift", render: (item: any) => (
                    <div className="flex items-center gap-2">
                      <select
                        value={item.shift?.id || ""}
                        onChange={(e) => handleAssignShift(item.id, e.target.value)}
                        disabled={assigningEmpId === item.id}
                        className="px-2.5 py-1 rounded-lg text-xs border outline-none bg-white font-medium shadow-sm"
                        style={{ borderColor: "#CBD5E1", color: "#1E293B" }}
                      >
                        <option value="">-- No Shift (Unassigned) --</option>
                        {shifts.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)})</option>
                        ))}
                      </select>
                      {assigningEmpId === item.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />}
                    </div>
                  )},
                ]}
              />
            )}
          </Card>
        </div>
      )}

      {/* Shifts Tab */}
      {activeTab === "shifts" && (
        <div className="space-y-6">
          {loadingShifts ? (
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : shifts.length === 0 && !showForm ? (
            <div className="text-center py-12 border rounded-xl bg-white">
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
                  <div className="flex items-center justify-between text-xs pt-2 border-t mt-3 text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <strong style={{ color: "#1A3C5E" }}>
                        {roster.filter((r: any) => r.shift?.id === shift.id).length}
                      </strong> staff assigned
                    </span>
                    <button
                      onClick={() => { setSelectedShiftFilter(shift.id); setActiveTab("roster"); }}
                      className="text-[#2BAE8E] font-medium hover:underline flex items-center gap-1"
                    >
                      View Roster →
                    </button>
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
      )}
    </div>
  );
}
