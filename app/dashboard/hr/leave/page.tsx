"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  CalendarDays, AlertCircle, Loader2, RefreshCw,
  Plus, Check, X, Clock, User, Users, ThumbsUp, ThumbsDown,
  FileText, Umbrella, Stethoscope, HeartHandshake, Baby,
  Briefcase, Calculator
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave", icon: Umbrella },
  { value: "sick", label: "Sick Leave", icon: Stethoscope },
  { value: "casual", label: "Casual Leave", icon: HeartHandshake },
  { value: "personal", label: "Personal Leave", icon: User },
  { value: "maternity", label: "Maternity Leave", icon: Baby },
  { value: "paternity", label: "Paternity Leave", icon: Briefcase },
  { value: "comp_off", label: "Compensatory Off", icon: Clock },
];

const EMPTY_APPLICATION = {
  leave_type: "annual", start_date: "", end_date: "", reason: "",
};

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default function LeavePage() {
  const { user } = useAuth();
  const isHrOrManager = user?.role_name === "hr" || user?.role_name === "super_admin" || user?.role_name === "admin";
  const [tab, setTab] = useState<"my" | "approvals">("my");
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [application, setApplication] = useState({ ...EMPTY_APPLICATION });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [actionTarget, setActionTarget] = useState<string | null>(null);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, pendRes] = await Promise.all([
        fetch("/api/hr/leaves"),
        fetch("/api/hr/leaves?status=pending"),
      ]);
      const reqData = await reqRes.json();
      const pendData = await pendRes.json();
      setRequests(reqData?.data || []);
      setPendingRequests(pendData?.data || []);
    } catch {
      setRequests([]); setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [tab]);

  useEffect(() => {
    fetch("/api/hr/leaves/balances").then(r => r.json()).then(d => setBalances(d?.data || [])).catch(() => setBalances([]));
  }, []);

  const handleApply = async () => {
    setSaving(true);
    try {
      const totalDays = calcDays(application.start_date, application.end_date);
      const res = await fetch("/api/hr/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...application, total_days: totalDays, status: "pending" }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "Leave applied successfully" });
      setShowApplyModal(false);
      setApplication({ ...EMPTY_APPLICATION });
      fetchData();
    } catch {
      setFeedback({ type: "error", message: "Failed to apply leave" });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReject = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/hr/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reviewer_notes: reviewerNotes }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: `Leave ${newStatus}` });
      setActionTarget(null);
      setReviewerNotes("");
      fetchData();
    } catch {
      setFeedback({ type: "error", message: "Action failed" });
    }
  };

  const totalDays = calcDays(application.start_date, application.end_date);

  const statusVariant = (s: string) => {
    switch (s) {
      case "approved": return "teal" as const;
      case "rejected": return "red" as const;
      case "pending": return "amber" as const;
      default: return "gray" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Leave Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Apply for leave and manage approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
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

      {/* Tabs */}
      <div className="flex items-center rounded-lg text-xs font-medium overflow-hidden" style={{ border: "1px solid #E2E8F0", width: "fit-content" }}>
        <button onClick={() => setTab("my")} className="px-4 py-2 transition-colors" style={{ background: tab === "my" ? "#1A3C5E" : "#F5F7FA", color: tab === "my" ? "#FFF" : "#64748B" }}>My Leaves</button>
        {(isHrOrManager) && (
          <button onClick={() => setTab("approvals")} className="px-4 py-2 transition-colors flex items-center gap-1.5" style={{ background: tab === "approvals" ? "#1A3C5E" : "#F5F7FA", color: tab === "approvals" ? "#FFF" : "#64748B" }}>
            Pending Approvals {pendingRequests.length > 0 && <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: tab === "approvals" ? "rgba(255,255,255,0.2)" : "rgba(229,62,62,0.15)", color: tab === "approvals" ? "#FFF" : "#E53E3E" }}>{pendingRequests.length}</span>}
          </button>
        )}
      </div>

      {tab === "my" && (
        <>
          {/* Leave Balances */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}>
                  <div className="w-8 h-6 rounded mb-2" style={{ background: "#CBD5E1" }} />
                  <div className="w-12 h-3 rounded" style={{ background: "#CBD5E1" }} />
                </div>
              ))}
            </div>
          ) : balances.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {LEAVE_TYPES.map((lt) => {
                const Icon = lt.icon;
                return (
                  <div key={lt.value} className="rounded-xl p-4 text-center" style={{ background: "#F5F7FA", border: "1px solid #E2E8F0" }}>
                    <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: "#2BAE8E" }} />
                    <div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>0</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>{lt.label}</div>
                    <div className="text-[10px]" style={{ color: "#94A3B8" }}>0/0 remaining</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {balances.map((b: any) => {
                const lt = LEAVE_TYPES.find((l) => l.value === b.leave_type);
                const Icon = lt?.icon || CalendarDays;
                const remaining = (b.allocated || 0) - (b.used || 0);
                return (
                  <div key={b.leave_type} className="rounded-xl p-4 text-center" style={{ background: "#F5F7FA", border: "1px solid #E2E8F0" }}>
                    <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: "#2BAE8E" }} />
                    <div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{remaining}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>{lt?.label || b.leave_type}</div>
                    <div className="text-[10px]" style={{ color: "#94A3B8" }}>{b.used || 0}/{b.allocated || 0} used</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Apply Button */}
          <div className="flex justify-end">
            <button onClick={() => setShowApplyModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
              <Plus className="w-3.5 h-3.5" /> Apply Leave
            </button>
          </div>

          {/* My Leave Requests */}
          <Card>
            <CardHeader title="My Leave Requests" subtitle={`${requests.length} requests`} />
            {loading ? (
              <div className="space-y-1">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
                <p className="text-sm" style={{ color: "#64748B" }}>No leave requests yet</p>
              </div>
            ) : (
              <Table
                data={requests}
                keyExtractor={(r: any) => r.id}
                columns={[
                  { key: "leave_type", header: "Type", render: (r: any) => {
                    const lt = LEAVE_TYPES.find((l) => l.value === r.leave_type);
                    return <span className="text-xs capitalize">{lt?.label || r.leave_type?.replace("_", " ") || "—"}</span>;
                  }},
                  { key: "dates", header: "Dates", render: (r: any) => (
                    <span className="text-xs">{r.start_date ? new Date(r.start_date).toLocaleDateString("en-IN") : "—"} - {r.end_date ? new Date(r.end_date).toLocaleDateString("en-IN") : "—"}</span>
                  )},
                  { key: "total_days", header: "Days", render: (r: any) => <span className="text-xs font-medium">{r.total_days || calcDays(r.start_date, r.end_date)}</span> },
                  { key: "reason", header: "Reason", render: (r: any) => <span className="text-xs" style={{ color: "#64748B" }}>{r.reason || "—"}</span> },
                  { key: "status", header: "Status", render: (r: any) => <Badge variant={statusVariant(r.status)}>{(r.status || "pending").charAt(0).toUpperCase() + (r.status || "pending").slice(1)}</Badge> },
                  { key: "approved_by", header: "Approved By", render: (r: any) => <span className="text-xs" style={{ color: "#64748B" }}>{r.reviewer?.user ? `${r.reviewer.user.first_name} ${r.reviewer.user.last_name || ""}` : "—"}</span> },
                ]}
              />
            )}
          </Card>
        </>
      )}

      {tab === "approvals" && (
        <Card>
          <CardHeader title="Pending Approvals" subtitle={`${pendingRequests.length} requests awaiting action`} />
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <ThumbsUp className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No pending approvals</p>
            </div>
          ) : (
            <Table
              data={pendingRequests}
              keyExtractor={(r: any) => r.id}
              columns={[
                { key: "employee", header: "Employee", render: (r: any) => (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1A3C5E" }}>
                      {((r.employee?.user?.first_name?.[0] || "") + (r.employee?.user?.last_name?.[0] || "")).toUpperCase() || "?"}
                    </div>
                    <div>
                      <span className="text-xs font-medium">{r.employee?.user ? `${r.employee.user.first_name} ${r.employee.user.last_name || ""}` : r.employee?.employee_code || "—"}</span>
                      <div className="text-[10px]" style={{ color: "#64748B" }}>{r.employee?.designation || ""}</div>
                    </div>
                  </div>
                )},
                { key: "leave_type", header: "Type", render: (r: any) => {
                  const lt = LEAVE_TYPES.find((l) => l.value === r.leave_type);
                  return <span className="text-xs capitalize">{lt?.label || r.leave_type?.replace("_", " ") || "—"}</span>;
                }},
                { key: "dates", header: "Dates", render: (r: any) => (
                  <span className="text-xs">{r.start_date ? new Date(r.start_date).toLocaleDateString("en-IN") : "—"} - {r.end_date ? new Date(r.end_date).toLocaleDateString("en-IN") : "—"}</span>
                )},
                { key: "days", header: "Days", render: (r: any) => <span className="text-xs font-medium">{r.total_days || calcDays(r.start_date, r.end_date)}</span> },
                { key: "reason", header: "Reason", render: (r: any) => <span className="text-xs" style={{ color: "#64748B" }}>{r.reason || "—"}</span> },
                { key: "actions", header: "Actions", render: (r: any) => (
                  actionTarget === r.id ? (
                    <div className="flex items-center gap-1">
                      <input type="text" placeholder="Notes..." value={reviewerNotes} onChange={(e) => setReviewerNotes(e.target.value)}
                        className="w-28 px-2 py-1 rounded text-[10px] outline-none border" style={{ borderColor: "#E2E8F0" }} />
                      <button onClick={() => handleApproveReject(r.id, "approved")} className="p-1 rounded hover:bg-gray-100" title="Approve"><ThumbsUp className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} /></button>
                      <button onClick={() => handleApproveReject(r.id, "rejected")} className="p-1 rounded hover:bg-gray-100" title="Reject"><ThumbsDown className="w-3.5 h-3.5" style={{ color: "#E53E3E" }} /></button>
                      <button onClick={() => { setActionTarget(null); setReviewerNotes(""); }} className="p-1 rounded hover:bg-gray-100"><X className="w-3 h-3" style={{ color: "#64748B" }} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setActionTarget(r.id)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-white" style={{ background: "#1A3C5E" }}>
                      Review
                    </button>
                  )
                )},
              ]}
            />
          )}
        </Card>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowApplyModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="text-base font-semibold" style={{ color: "#1A3C5E" }}>Apply Leave</h2>
              <button onClick={() => setShowApplyModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Leave Type *</label>
                <select value={application.leave_type} onChange={(e) => setApplication({ ...application, leave_type: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                  {LEAVE_TYPES.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Start Date *</label>
                  <input type="date" value={application.start_date} onChange={(e) => setApplication({ ...application, start_date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>End Date *</label>
                  <input type="date" value={application.end_date} onChange={(e) => setApplication({ ...application, end_date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
              </div>
              {totalDays > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(43,174,142,0.08)", color: "#2BAE8E" }}>
                  <Calculator className="w-3.5 h-3.5" />
                  Total: <strong>{totalDays}</strong> day{totalDays > 1 ? "s" : ""}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Reason *</label>
                <textarea value={application.reason} onChange={(e) => setApplication({ ...application, reason: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", minHeight: 80 }} />
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #E2E8F0" }}>
              <button onClick={() => setShowApplyModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleApply} disabled={saving || !application.start_date || !application.end_date || !application.reason} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                {saving ? "Submitting..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
