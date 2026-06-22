"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Calendar, Clock, Shield, FileText, Plus, Loader2, Check, AlertCircle, Save, X, RefreshCw,
  Sun, Percent, Users, BookOpen
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useHolidays, useOvertimePolicies, useAttendancePolicies, useDocumentTypes } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

const TABS = [
  { key: "holidays", label: "Holidays", icon: Sun },
  { key: "overtime", label: "Overtime Policies", icon: Clock },
  { key: "attendance", label: "Attendance Policies", icon: Shield },
  { key: "documents", label: "Document Types", icon: FileText },
];

const HOLIDAY_TYPES = ["public", "optional", "restricted"];
const DOC_CATEGORIES = ["employee", "policy", "compliance"];

export default function HRMastersPage() {
  const [activeTab, setActiveTab] = useState("holidays");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Holidays
  const { holidays, isLoading: hLoading, isError: hError, mutate: hMutate } = useHolidays(year);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", type: "public", applicable_to: "" });
  const [hSaving, setHSaving] = useState(false);

  // Overtime Policies
  const { overtimePolicies, isLoading: oLoading, isError: oError, mutate: oMutate } = useOvertimePolicies();
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  const [overtimeForm, setOvertimeForm] = useState({ name: "", multiplier: "1.5", min_hours: "0", max_hours_per_day: "4", applicable_shifts: "" });
  const [oSaving, setOSaving] = useState(false);

  // Attendance Policies
  const { attendancePolicies, isLoading: aLoading, isError: aError, mutate: aMutate } = useAttendancePolicies();
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({ name: "", late_threshold: "15", half_day_threshold: "240", early_exit_threshold: "15", grace_period: "5", requires_geo: false });
  const [aSaving, setASaving] = useState(false);

  // Document Types
  const { documentTypes, isLoading: dLoading, isError: dError, mutate: dMutate } = useDocumentTypes();
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ name: "", code: "", category: "employee", description: "", is_mandatory: false });
  const [dSaving, setDSaving] = useState(false);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const handleCreate = async (endpoint: string, data: any, mutate: any, setShow: any, setSaving: any, label: string) => {
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      setFeedback({ type: "success", message: `${label} created` });
      setShow(false);
      mutate();
    } catch {
      setFeedback({ type: "error", message: `Failed to create ${label}` });
    } finally {
      setSaving(false);
    }
  };

  const holidayData = holidays || [];
  const overtimeData = overtimePolicies || [];
  const attendanceData = attendancePolicies || [];
  const docData = documentTypes || [];

  const inputStyle: React.CSSProperties = { border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%", fontSize: "13px", outline: "none" };
  const selectStyle: React.CSSProperties = { ...inputStyle, color: "#1A2E44" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#2C3547" }}>HR Masters</h1>
          <p className="text-sm mt-0.5" style={{ color: "#667085" }}>Manage holidays, overtime, attendance policies & document types</p>
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

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "#F5F7FA" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: isActive ? "#FFFFFF" : "transparent",
                color: isActive ? "#2C3547" : "#667085",
                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ───── Holidays ───── */}
      {activeTab === "holidays" && (
        <Card>
          <CardHeader
            title="Holidays"
            subtitle={`${holidayData.length} holidays${year ? ` (${year})` : ""}`}
            action={
              <div className="flex items-center gap-2">
                <input
                  type="number" value={year} onChange={(e) => setYear(e.target.value)}
                  placeholder="Year"
                  className="w-20 px-2 py-1.5 rounded-lg text-xs outline-none border"
                  style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }}
                />
                <button onClick={() => hMutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#667085" }} aria-label="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => { setShowHolidayForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  <Plus className="w-3.5 h-3.5" /> Add Holiday
                </button>
              </div>
            }
          />
          {hLoading ? (
            <div className="space-y-1">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : hError ? (
            <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
              <AlertCircle className="w-4 h-4" /> Failed to load holidays.
            </div>
          ) : holidayData.length === 0 && !showHolidayForm ? (
            <div className="text-center py-8">
              <Sun className="w-6 h-6 mx-auto mb-2" style={{ color: "#667085" }} />
              <p className="text-sm" style={{ color: "#667085" }}>No holidays found</p>
            </div>
          ) : (
            <Table
              data={holidayData}
              keyExtractor={(h: any) => h.id}
              columns={[
                { key: "name", header: "Name", render: (h: any) => <span className="text-sm font-medium">{h.name}</span> },
                { key: "date", header: "Date", render: (h: any) => <span className="text-xs" style={{ color: "#667085" }}>{h.date ? new Date(h.date).toLocaleDateString() : "—"}</span> },
                { key: "type", header: "Type", render: (h: any) => <Badge variant={h.type === "public" ? "teal" : h.type === "optional" ? "amber" : "navy"}>{h.type}</Badge> },
                { key: "applicable_to", header: "Applicable To", render: (h: any) => <span className="text-xs" style={{ color: "#667085" }}>{h.applicable_to || "All"}</span> },
                { key: "actions", header: "Actions", render: () => <span className="text-xs" style={{ color: "#667085" }}>—</span> },
              ]}
            />
          )}
          {showHolidayForm && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "#F5F7FA", border: "1px solid #E5E7EB" }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "#2C3547" }}>New Holiday</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Name</label>
                  <input type="text" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} style={inputStyle} placeholder="e.g. Republic Day" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Date</label>
                  <input type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Type</label>
                  <select value={holidayForm.type} onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })} style={selectStyle}>
                    {HOLIDAY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Applicable To</label>
                  <input type="text" value={holidayForm.applicable_to} onChange={(e) => setHolidayForm({ ...holidayForm, applicable_to: e.target.value })} style={inputStyle} placeholder="e.g. All, HR, Finance" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowHolidayForm(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#667085", background: "#FFFFFF", border: "1px solid #E5E7EB" }}>Cancel</button>
                <button onClick={() => handleCreate("/api/hr/holidays", holidayForm, hMutate, setShowHolidayForm, setHSaving, "Holiday")} disabled={hSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  {hSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {hSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ───── Overtime Policies ───── */}
      {activeTab === "overtime" && (
        <Card>
          <CardHeader
            title="Overtime Policies"
            subtitle={`${overtimeData.length} policies`}
            action={
              <div className="flex items-center gap-2">
                <button onClick={() => oMutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#667085" }} aria-label="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => { setShowOvertimeForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  <Plus className="w-3.5 h-3.5" /> Add Policy
                </button>
              </div>
            }
          />
          {oLoading ? (
            <div className="space-y-1">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : oError ? (
            <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
              <AlertCircle className="w-4 h-4" /> Failed to load overtime policies.
            </div>
          ) : overtimeData.length === 0 && !showOvertimeForm ? (
            <div className="text-center py-8">
              <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: "#667085" }} />
              <p className="text-sm" style={{ color: "#667085" }}>No overtime policies found</p>
            </div>
          ) : (
            <Table
              data={overtimeData}
              keyExtractor={(p: any) => p.id}
              columns={[
                { key: "name", header: "Name", render: (p: any) => <span className="text-sm font-medium">{p.name}</span> },
                { key: "multiplier", header: "Multiplier", render: (p: any) => <Badge variant="navy">{p.multiplier}x</Badge> },
                { key: "min_hours", header: "Min Hours", render: (p: any) => <span className="text-xs" style={{ color: "#667085" }}>{p.min_hours}h</span> },
                { key: "max_hours_per_day", header: "Max Hours/Day", render: (p: any) => <span className="text-xs" style={{ color: "#667085" }}>{p.max_hours_per_day}h</span> },
                { key: "applicable_shifts", header: "Applicable Shifts", render: (p: any) => <span className="text-xs" style={{ color: "#667085" }}>{p.applicable_shifts || "All"}</span> },
                { key: "actions", header: "Actions", render: () => <span className="text-xs" style={{ color: "#667085" }}>—</span> },
              ]}
            />
          )}
          {showOvertimeForm && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "#F5F7FA", border: "1px solid #E5E7EB" }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "#2C3547" }}>New Overtime Policy</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Name</label>
                  <input type="text" value={overtimeForm.name} onChange={(e) => setOvertimeForm({ ...overtimeForm, name: e.target.value })} style={inputStyle} placeholder="e.g. Weekday OT" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Multiplier</label>
                  <input type="number" step="0.1" value={overtimeForm.multiplier} onChange={(e) => setOvertimeForm({ ...overtimeForm, multiplier: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Min Hours</label>
                  <input type="number" value={overtimeForm.min_hours} onChange={(e) => setOvertimeForm({ ...overtimeForm, min_hours: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Max Hours / Day</label>
                  <input type="number" value={overtimeForm.max_hours_per_day} onChange={(e) => setOvertimeForm({ ...overtimeForm, max_hours_per_day: e.target.value })} style={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Applicable Shifts</label>
                  <input type="text" value={overtimeForm.applicable_shifts} onChange={(e) => setOvertimeForm({ ...overtimeForm, applicable_shifts: e.target.value })} style={inputStyle} placeholder="e.g. General, Night" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowOvertimeForm(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#667085", background: "#FFFFFF", border: "1px solid #E5E7EB" }}>Cancel</button>
                <button onClick={() => handleCreate("/api/hr/overtime-policies", overtimeForm, oMutate, setShowOvertimeForm, setOSaving, "Overtime policy")} disabled={oSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  {oSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {oSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ───── Attendance Policies ───── */}
      {activeTab === "attendance" && (
        <Card>
          <CardHeader
            title="Attendance Policies"
            subtitle={`${attendanceData.length} policies`}
            action={
              <div className="flex items-center gap-2">
                <button onClick={() => aMutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#667085" }} aria-label="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => { setShowAttendanceForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  <Plus className="w-3.5 h-3.5" /> Add Policy
                </button>
              </div>
            }
          />
          {aLoading ? (
            <div className="space-y-1">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : aError ? (
            <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
              <AlertCircle className="w-4 h-4" /> Failed to load attendance policies.
            </div>
          ) : attendanceData.length === 0 && !showAttendanceForm ? (
            <div className="text-center py-8">
              <Shield className="w-6 h-6 mx-auto mb-2" style={{ color: "#667085" }} />
              <p className="text-sm" style={{ color: "#667085" }}>No attendance policies found</p>
            </div>
          ) : (
            <Table
              data={attendanceData}
              keyExtractor={(p: any) => p.id}
              columns={[
                { key: "name", header: "Name", render: (p: any) => <span className="text-sm font-medium">{p.name}</span> },
                { key: "late_threshold", header: "Late Threshold", render: (p: any) => <span className="text-xs" style={{ color: "#667085" }}>{p.late_threshold} min</span> },
                { key: "half_day_threshold", header: "Half Day", render: (p: any) => <span className="text-xs" style={{ color: "#667085" }}>{p.half_day_threshold} min</span> },
                { key: "grace_period", header: "Grace Period", render: (p: any) => <span className="text-xs" style={{ color: "#667085" }}>{p.grace_period} min</span> },
                { key: "requires_geo", header: "Requires Geo", render: (p: any) => p.requires_geo ? <Badge variant="teal">Yes</Badge> : <Badge variant="gray">No</Badge> },
                { key: "actions", header: "Actions", render: () => <span className="text-xs" style={{ color: "#667085" }}>—</span> },
              ]}
            />
          )}
          {showAttendanceForm && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "#F5F7FA", border: "1px solid #E5E7EB" }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "#2C3547" }}>New Attendance Policy</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Name</label>
                  <input type="text" value={attendanceForm.name} onChange={(e) => setAttendanceForm({ ...attendanceForm, name: e.target.value })} style={inputStyle} placeholder="e.g. General Policy" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Late Threshold (min)</label>
                  <input type="number" value={attendanceForm.late_threshold} onChange={(e) => setAttendanceForm({ ...attendanceForm, late_threshold: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Half Day Threshold (min)</label>
                  <input type="number" value={attendanceForm.half_day_threshold} onChange={(e) => setAttendanceForm({ ...attendanceForm, half_day_threshold: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Early Exit Threshold (min)</label>
                  <input type="number" value={attendanceForm.early_exit_threshold} onChange={(e) => setAttendanceForm({ ...attendanceForm, early_exit_threshold: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Grace Period (min)</label>
                  <input type="number" value={attendanceForm.grace_period} onChange={(e) => setAttendanceForm({ ...attendanceForm, grace_period: e.target.value })} style={inputStyle} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-medium" style={{ color: "#667085" }}>
                    <input type="checkbox" checked={attendanceForm.requires_geo} onChange={(e) => setAttendanceForm({ ...attendanceForm, requires_geo: e.target.checked })} style={{ width: "16px", height: "16px", accentColor: "#2C3547" }} />
                    Requires Geo-Location
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowAttendanceForm(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#667085", background: "#FFFFFF", border: "1px solid #E5E7EB" }}>Cancel</button>
                <button onClick={() => handleCreate("/api/hr/attendance-policies", attendanceForm, aMutate, setShowAttendanceForm, setASaving, "Attendance policy")} disabled={aSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  {aSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {aSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ───── Document Types ───── */}
      {activeTab === "documents" && (
        <Card>
          <CardHeader
            title="Document Types"
            subtitle={`${docData.length} types`}
            action={
              <div className="flex items-center gap-2">
                <button onClick={() => dMutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#667085" }} aria-label="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => { setShowDocForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  <Plus className="w-3.5 h-3.5" /> Add Document Type
                </button>
              </div>
            }
          />
          {dLoading ? (
            <div className="space-y-1">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : dError ? (
            <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
              <AlertCircle className="w-4 h-4" /> Failed to load document types.
            </div>
          ) : docData.length === 0 && !showDocForm ? (
            <div className="text-center py-8">
              <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "#667085" }} />
              <p className="text-sm" style={{ color: "#667085" }}>No document types found</p>
            </div>
          ) : (
            <Table
              data={docData}
              keyExtractor={(d: any) => d.id}
              columns={[
                { key: "name", header: "Name", render: (d: any) => <span className="text-sm font-medium">{d.name}</span> },
                { key: "code", header: "Code", render: (d: any) => <span className="font-mono text-xs" style={{ color: "#667085" }}>{d.code || "—"}</span> },
                { key: "category", header: "Category", render: (d: any) => <Badge variant={d.category === "employee" ? "teal" : d.category === "policy" ? "navy" : "amber"}>{d.category}</Badge> },
                { key: "is_mandatory", header: "Mandatory", render: (d: any) => d.is_mandatory ? <Badge variant="red">Required</Badge> : <Badge variant="gray">Optional</Badge> },
                { key: "actions", header: "Actions", render: () => <span className="text-xs" style={{ color: "#667085" }}>—</span> },
              ]}
            />
          )}
          {showDocForm && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: "#F5F7FA", border: "1px solid #E5E7EB" }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "#2C3547" }}>New Document Type</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Name</label>
                  <input type="text" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} style={inputStyle} placeholder="e.g. Aadhar Card" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Code</label>
                  <input type="text" value={docForm.code} onChange={(e) => setDocForm({ ...docForm, code: e.target.value })} style={inputStyle} placeholder="e.g. AADHAR" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Category</label>
                  <select value={docForm.category} onChange={(e) => setDocForm({ ...docForm, category: e.target.value })} style={selectStyle}>
                    {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-medium" style={{ color: "#667085" }}>
                    <input type="checkbox" checked={docForm.is_mandatory} onChange={(e) => setDocForm({ ...docForm, is_mandatory: e.target.checked })} style={{ width: "16px", height: "16px", accentColor: "#2C3547" }} />
                    Is Mandatory
                  </label>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Description</label>
                  <input type="text" value={docForm.description} onChange={(e) => setDocForm({ ...docForm, description: e.target.value })} style={inputStyle} placeholder="Optional description" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => setShowDocForm(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#667085", background: "#FFFFFF", border: "1px solid #E5E7EB" }}>Cancel</button>
                <button onClick={() => handleCreate("/api/hr/document-types", docForm, dMutate, setShowDocForm, setDSaving, "Document type")} disabled={dSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  {dSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {dSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
