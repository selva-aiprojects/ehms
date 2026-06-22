"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Clock, AlertCircle, Loader2, RefreshCw, Search as SearchIcon,
  Plus, Play, Square, Check, X, ChevronDown, Calendar,
  Filter, User, Users, ThumbsUp, ThumbsDown, FileText
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

function getWeekDates(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

function formatHHMM(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function calcHours(clockIn: string | null, clockOut: string | null, breakHrs: number = 0): string {
  if (!clockIn || !clockOut) return "—";
  const diff = (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / (1000 * 60 * 60);
  const net = Math.max(0, diff - breakHrs);
  return net.toFixed(1);
}

const EMPTY_ENTRY = {
  date: "", clock_in: "", clock_out: "", break_hours: 0,
  project: "", task: "", notes: "",
};

export default function TimesheetPage() {
  const { user } = useAuth();
  const isHrOrManager = user?.role_name === "hr" || user?.role_name === "super_admin" || user?.role_name === "admin";
  const [view, setView] = useState<"my" | "team">("my");
  const [dateRange, setDateRange] = useState(getWeekDates());
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [entryForm, setEntryForm] = useState({ ...EMPTY_ENTRY });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [clocking, setClocking] = useState(false);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (view === "my") {
        params.set("date_from", dateRange.start);
        params.set("date_to", dateRange.end);
      } else {
        if (selectedEmployee) params.set("employee_id", selectedEmployee);
        if (dateRange.start) params.set("date_from", dateRange.start);
        if (dateRange.end) params.set("date_to", dateRange.end);
        if (statusFilter) params.set("status", statusFilter);
      }
      const res = await fetch(`/api/hr/timesheet?${params}`);
      const d = await res.json();
      setEntries(d?.data || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/hr/employees?limit=200").then(r => r.json()).then(d => setEmployees(d?.data || [])).catch(() => {});
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchEntries(); }, [view, dateRange, selectedEmployee, statusFilter]);

  const handleClockIn = async () => {
    setClocking(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();
      const res = await fetch("/api/hr/timesheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, clock_in: now, status: "draft" }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "Clocked in" });
      fetchEntries();
    } catch {
      setFeedback({ type: "error", message: "Clock in failed" });
    } finally {
      setClocking(false);
    }
  };

  const handleClockOut = async () => {
    setClocking(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const existing = entries.find((e: any) => e.date?.split("T")[0] === today && !e.clock_out);
      if (!existing) { setFeedback({ type: "error", message: "No active session" }); setClocking(false); return; }
      const now = new Date().toISOString();
      const res = await fetch(`/api/hr/timesheet/${existing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clock_out: now }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "Clocked out" });
      fetchEntries();
    } catch {
      setFeedback({ type: "error", message: "Clock out failed" });
    } finally {
      setClocking(false);
    }
  };

  const handleSaveEntry = async () => {
    setSaving(true);
    try {
      const payload = {
        ...entryForm,
        clock_in: entryForm.clock_in ? new Date(`${entryForm.date}T${entryForm.clock_in}`).toISOString() : null,
        clock_out: entryForm.clock_out ? new Date(`${entryForm.date}T${entryForm.clock_out}`).toISOString() : null,
        break_hours: Number(entryForm.break_hours),
        status: "draft",
      };
      const res = await fetch("/api/hr/timesheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "Entry added" });
      setShowAddModal(false);
      setEntryForm({ ...EMPTY_ENTRY });
      fetchEntries();
    } catch {
      setFeedback({ type: "error", message: "Failed to add entry" });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReject = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/hr/timesheet/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: `Entry ${newStatus}` });
      fetchEntries();
    } catch {
      setFeedback({ type: "error", message: "Action failed" });
    }
  };

  const todayEntry = entries.find((e: any) => {
    const d = e.date?.split("T")[0];
    return d === new Date().toISOString().split("T")[0];
  });
  const isClockedIn = !!(todayEntry && !todayEntry.clock_out);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Timesheet</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Track and manage employee time entries</p>
        </div>
        <div className="flex items-center gap-2">
          {isHrOrManager && (
            <div className="flex items-center rounded-lg text-xs font-medium overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
              <button onClick={() => setView("my")} className="px-3 py-1.5 transition-colors" style={{ background: view === "my" ? "#1A3C5E" : "#F5F7FA", color: view === "my" ? "#FFF" : "#64748B" }}>My Timesheet</button>
              <button onClick={() => setView("team")} className="px-3 py-1.5 transition-colors" style={{ background: view === "team" ? "#1A3C5E" : "#F5F7FA", color: view === "team" ? "#FFF" : "#64748B" }}>Team View</button>
            </div>
          )}
          <button onClick={() => fetchEntries()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
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

      {/* Quick Clock In/Out */}
      {view === "my" && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "#F5F7FA", border: "1px solid #E2E8F0" }}>
          <Clock className="w-5 h-5" style={{ color: isClockedIn ? "#2BAE8E" : "#64748B" }} />
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>
              {isClockedIn ? "You are clocked in" : "Ready to start your shift?"}
            </div>
            <div className="text-xs" style={{ color: "#64748B" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          {isClockedIn ? (
            <button onClick={handleClockOut} disabled={clocking} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#E53E3E" }}>
              {clocking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
              Clock Out
            </button>
          ) : (
            <button onClick={handleClockIn} disabled={clocking} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
              {clocking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Clock In
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
          <Calendar className="w-3.5 h-3.5" />
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-2 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
          <span>to</span>
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-2 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
        </div>
        {view === "team" && (
          <>
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
              <option value="">All Employees</option>
              {employees.map((e: any) => (
                <option key={e.id} value={e.id}>{e.user ? `${e.user.first_name} ${e.user.last_name || ""}` : e.employee_code}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </>
        )}
        {view === "my" && (
          <button onClick={() => { setEntryForm({ ...EMPTY_ENTRY, date: new Date().toISOString().split("T")[0] }); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </button>
        )}
      </div>

      {/* Timesheet Table */}
      <Card>
        <CardHeader title={view === "my" ? "My Time Entries" : "Team Time Entries"} subtitle={`${entries.length} entries`} />
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No time entries found</p>
          </div>
        ) : (
          <Table
            data={entries}
            keyExtractor={(e: any) => e.id}
            columns={[
              ...(view === "team" ? [{ key: "employee", header: "Employee", render: (e: any) => (
                <span className="text-xs font-medium">{e.employee?.user ? `${e.employee.user.first_name} ${e.employee.user.last_name || ""}` : e.employee?.employee_code || "—"}</span>
              )}] : []),
              { key: "date", header: "Date", render: (e: any) => <span className="text-xs">{e.date ? new Date(e.date).toLocaleDateString("en-IN") : "—"}</span> },
              { key: "clock_in", header: "Clock In", render: (e: any) => <span className="text-xs font-mono">{formatHHMM(e.clock_in)}</span> },
              { key: "clock_out", header: "Clock Out", render: (e: any) => <span className="text-xs font-mono">{formatHHMM(e.clock_out)}</span> },
              { key: "total_hours", header: "Total Hrs", render: (e: any) => {
                const hrs = calcHours(e.clock_in, e.clock_out, 0);
                return <span className="text-xs">{hrs}</span>;
              }},
              { key: "break_hours", header: "Break Hrs", render: (e: any) => <span className="text-xs">{e.break_hours || 0}</span> },
              { key: "net_hours", header: "Net Hrs", render: (e: any) => {
                const hrs = calcHours(e.clock_in, e.clock_out, Number(e.break_hours || 0));
                return <span className="text-xs font-medium">{hrs}</span>;
              }},
              { key: "project", header: "Project", render: (e: any) => <span className="text-xs" style={{ color: "#64748B" }}>{e.project || "—"}</span> },
              { key: "task", header: "Task", render: (e: any) => <span className="text-xs" style={{ color: "#64748B" }}>{e.task || "—"}</span> },
              { key: "status", header: "Status", render: (e: any) => {
                const v = e.status === "approved" ? "teal" as const : e.status === "rejected" ? "red" as const : e.status === "submitted" ? "amber" as const : "gray" as const;
                return <Badge variant={v}>{(e.status || "draft").charAt(0).toUpperCase() + (e.status || "draft").slice(1)}</Badge>;
              }},
              ...(view === "team" ? [{
                key: "actions" as string, header: "Actions" as string, render: (e: any) => (
                  (e.status === "draft" || e.status === "submitted") ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleApproveReject(e.id, "approved")} className="p-1 rounded hover:bg-gray-100" title="Approve">
                        <ThumbsUp className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
                      </button>
                      <button onClick={() => handleApproveReject(e.id, "rejected")} className="p-1 rounded hover:bg-gray-100" title="Reject">
                        <ThumbsDown className="w-3.5 h-3.5" style={{ color: "#E53E3E" }} />
                      </button>
                    </div>
                  ) : null
                ),
              }] : []),
            ]}
          />
        )}
      </Card>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="text-base font-semibold" style={{ color: "#1A3C5E" }}>Add Time Entry</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Date *</label>
                <input type="date" value={entryForm.date} onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Clock In</label>
                  <input type="time" value={entryForm.clock_in} onChange={(e) => setEntryForm({ ...entryForm, clock_in: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Clock Out</label>
                  <input type="time" value={entryForm.clock_out} onChange={(e) => setEntryForm({ ...entryForm, clock_out: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Break Hours</label>
                <input type="number" step="0.5" min="0" value={entryForm.break_hours} onChange={(e) => setEntryForm({ ...entryForm, break_hours: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Project</label>
                <input type="text" value={entryForm.project} onChange={(e) => setEntryForm({ ...entryForm, project: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Task</label>
                <input type="text" value={entryForm.task} onChange={(e) => setEntryForm({ ...entryForm, task: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Notes</label>
                <textarea value={entryForm.notes} onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", minHeight: 60 }} />
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #E2E8F0" }}>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleSaveEntry} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
