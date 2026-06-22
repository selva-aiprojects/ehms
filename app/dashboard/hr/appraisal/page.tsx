"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Target, CheckCircle, BarChart3, AlertCircle, Loader2, RefreshCw,
  Plus, Eye, Edit2, X, Save, Check, ChevronDown, Calendar, User,
  FileText, Percent, CalendarDays
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useAppraisalCycles, useAppraisalReviews, useAppraisalGoals, useEmployees } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

const inputStyle: React.CSSProperties = { border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" };
const selectStyle: React.CSSProperties = { border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%", background: "white" };
const textareaStyle: React.CSSProperties = { border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%", resize: "vertical", minHeight: "72px" };

const CYCLE_TYPES = ["annual", "half_yearly", "quarterly"] as const;
const CYCLE_STATUSES = ["draft", "active", "closed"] as const;
const REVIEW_STATUSES = ["pending", "self_submitted", "reviewed", "completed"] as const;
const GOAL_STATUSES = ["pending", "achieved", "partially_achieved", "not_achieved"] as const;

const EMPTY_CYCLE = { name: "", cycle_type: "annual", period_start: "", period_end: "", rating_scale: 5 };
const EMPTY_REVIEW = { employee_id: "", reviewer_id: "", self_rating: 0, reviewer_rating: 0, final_rating: 0, self_comment: "", reviewer_comment: "", overall_score: 0, status: "pending" };
const EMPTY_GOAL = { employee_id: "", goal: "", weightage: 0, target_date: "" };

export default function AppraisalPage() {
  const [activeTab, setActiveTab] = useState<"cycles" | "reviews" | "goals">("cycles");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters
  const [cycleFilter, setCycleFilter] = useState("");
  const [goalCycleFilter, setGoalCycleFilter] = useState("");
  const [goalEmployeeFilter, setGoalEmployeeFilter] = useState("");

  // Cycles
  const { appraisalCycles, isLoading: cyclesLoading, isError: cyclesError, mutate: mutateCycles } = useAppraisalCycles();
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [cycleForm, setCycleForm] = useState<Record<string, any>>({ ...EMPTY_CYCLE });
  const [cycleSaving, setCycleSaving] = useState(false);

  // Reviews
  const { appraisalReviews, isLoading: reviewsLoading, isError: reviewsError, mutate: mutateReviews } = useAppraisalReviews(cycleFilter || undefined);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState<Record<string, any>>({ ...EMPTY_REVIEW });
  const [reviewSaving, setReviewSaving] = useState(false);

  // Goals
  const { appraisalGoals, isLoading: goalsLoading, isError: goalsError, mutate: mutateGoals } = useAppraisalGoals(goalCycleFilter || undefined, goalEmployeeFilter || undefined);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState<Record<string, any>>({ ...EMPTY_GOAL });
  const [goalSaving, setGoalSaving] = useState(false);

  // Employees list
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  useEffect(() => {
    fetch("/api/hr/employees?limit=500")
      .then(r => r.json())
      .then(d => setEmployeesList(d?.data || []))
      .catch(() => {});
  }, []);

  // ── Cycles ──
  const openCycleForm = () => {
    setCycleForm({ ...EMPTY_CYCLE });
    setShowCycleForm(true);
  };

  const saveCycle = async () => {
    setCycleSaving(true);
    try {
      const res = await fetch("/api/hr/appraisal-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cycleForm),
      });
      if (!res.ok) throw new Error("Save failed");
      setFeedback({ type: "success", message: "Cycle created" });
      setShowCycleForm(false);
      mutateCycles();
    } catch {
      setFeedback({ type: "error", message: "Failed to save cycle" });
    } finally {
      setCycleSaving(false);
    }
  };

  const cycleStatusBadge = (status: string) => {
    const m: Record<string, string> = { draft: "gray", active: "teal", closed: "red" };
    return <Badge variant={(m[status] || "gray") as any}>{status.replace("_", " ")}</Badge>;
  };

  // ── Reviews ──
  const openReviewForm = () => {
    setReviewForm({ ...EMPTY_REVIEW });
    setShowReviewForm(true);
  };

  const saveReview = async () => {
    setReviewSaving(true);
    try {
      const res = await fetch(`/api/hr/appraisal-reviews?cycle_id=${cycleFilter || ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reviewForm, cycle_id: cycleFilter }),
      });
      if (!res.ok) throw new Error("Save failed");
      setFeedback({ type: "success", message: "Review created" });
      setShowReviewForm(false);
      mutateReviews();
    } catch {
      setFeedback({ type: "error", message: "Failed to save review" });
    } finally {
      setReviewSaving(false);
    }
  };

  const reviewStatusBadge = (status: string) => {
    const m: Record<string, string> = { pending: "gray", self_submitted: "amber", reviewed: "teal", completed: "navy" };
    return <Badge variant={(m[status] || "gray") as any}>{status.replace("_", " ")}</Badge>;
  };

  // ── Goals ──
  const openGoalForm = () => {
    setGoalForm({ ...EMPTY_GOAL });
    setShowGoalForm(true);
  };

  const saveGoal = async () => {
    setGoalSaving(true);
    try {
      const res = await fetch(`/api/hr/appraisal-goals?cycle_id=${goalCycleFilter || ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...goalForm, cycle_id: goalCycleFilter }),
      });
      if (!res.ok) throw new Error("Save failed");
      setFeedback({ type: "success", message: "Goal created" });
      setShowGoalForm(false);
      mutateGoals();
    } catch {
      setFeedback({ type: "error", message: "Failed to save goal" });
    } finally {
      setGoalSaving(false);
    }
  };

  const goalStatusBadge = (status: string) => {
    const m: Record<string, string> = { pending: "gray", achieved: "teal", partially_achieved: "amber", not_achieved: "red" };
    return <Badge variant={(m[status] || "gray") as any}>{status.replace("_", " ")}</Badge>;
  };

  const empName = (id: string) => {
    const e = employeesList.find((x: any) => x.id === id);
    if (!e) return "—";
    return e.user ? `${e.user.first_name} ${e.user.last_name || ""}` : e.employee_code || "—";
  };

  const tabs = [
    { key: "cycles", label: "Cycles", icon: CalendarDays },
    { key: "reviews", label: "Reviews", icon: FileText },
    { key: "goals", label: "Goals", icon: Target },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#2C3547" }}>Appraisal Workflow</h1>
          <p className="text-sm mt-0.5" style={{ color: "#667085" }}>Manage appraisal cycles, reviews, and goals</p>
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
      <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#F5F7FA", border: "1px solid #E5E7EB" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "#FFFFFF" : "transparent",
                color: activeTab === tab.key ? "#2C3547" : "#667085",
                boxShadow: activeTab === tab.key ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ────────────── TAB: CYCLES ────────────── */}
      {activeTab === "cycles" && (
        <Card>
          <CardHeader
            title="Appraisal Cycles"
            subtitle={`${(appraisalCycles || []).length} cycles`}
            action={
              <button onClick={openCycleForm} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                <Plus className="w-3.5 h-3.5" /> Add Cycle
              </button>
            }
          />
          {cyclesLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : cyclesError ? (
            <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
              <AlertCircle className="w-4 h-4" />
              Failed to load cycles.
              <button onClick={() => mutateCycles()} className="ml-auto underline text-xs">Retry</button>
            </div>
          ) : (appraisalCycles || []).length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-6 h-6 mx-auto mb-2" style={{ color: "#667085" }} />
              <p className="text-sm" style={{ color: "#667085" }}>No cycles found</p>
            </div>
          ) : (
            <Table
              data={appraisalCycles || []}
              keyExtractor={(c: any) => c.id}
              columns={[
                { key: "name", header: "Name", render: (c: any) => <span className="font-medium text-sm" style={{ color: "#2C3547" }}>{c.name}</span> },
                { key: "cycle_type", header: "Type", render: (c: any) => <span className="text-xs capitalize" style={{ color: "#667085" }}>{c.cycle_type?.replace("_", " ")}</span> },
                { key: "period_start", header: "Period Start", render: (c: any) => <span className="text-xs" style={{ color: "#667085" }}>{c.period_start ? new Date(c.period_start).toLocaleDateString() : "—"}</span> },
                { key: "period_end", header: "Period End", render: (c: any) => <span className="text-xs" style={{ color: "#667085" }}>{c.period_end ? new Date(c.period_end).toLocaleDateString() : "—"}</span> },
                { key: "rating_scale", header: "Rating Scale", render: (c: any) => <span className="text-xs font-mono" style={{ color: "#667085" }}>{c.rating_scale}</span> },
                { key: "status", header: "Status", render: (c: any) => cycleStatusBadge(c.status) },
                { key: "actions", header: "Actions", render: (c: any) => (
                  <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                    <button className="p-1 rounded hover:bg-gray-100" title="View"><Eye className="w-3.5 h-3.5" style={{ color: "#2C3547" }} /></button>
                  </div>
                )},
              ]}
            />
          )}
          {showCycleForm && (
            <div className="mt-4 p-4 rounded-xl" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB" }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Name</label>
                  <input type="text" value={cycleForm.name} onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Cycle Type</label>
                  <select value={cycleForm.cycle_type} onChange={(e) => setCycleForm({ ...cycleForm, cycle_type: e.target.value })} style={selectStyle}>
                    {CYCLE_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Period Start</label>
                  <input type="date" value={cycleForm.period_start} onChange={(e) => setCycleForm({ ...cycleForm, period_start: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Period End</label>
                  <input type="date" value={cycleForm.period_end} onChange={(e) => setCycleForm({ ...cycleForm, period_end: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Rating Scale</label>
                  <input type="number" value={cycleForm.rating_scale} onChange={(e) => setCycleForm({ ...cycleForm, rating_scale: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={() => setShowCycleForm(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#667085", background: "#F5F7FA" }}>Cancel</button>
                <button onClick={saveCycle} disabled={cycleSaving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  {cycleSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {cycleSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ────────────── TAB: REVIEWS ────────────── */}
      {activeTab === "reviews" && (
        <Card>
          <CardHeader
            title="Appraisal Reviews"
            subtitle={`${(appraisalReviews || []).length} reviews`}
            action={
              <div className="flex items-center gap-2">
                <select value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} style={{ ...selectStyle, width: "180px", padding: "6px 10px", fontSize: "12px" }}>
                  <option value="">All Cycles</option>
                  {(appraisalCycles || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={openReviewForm} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  <Plus className="w-3.5 h-3.5" /> Add Review
                </button>
              </div>
            }
          />
          {reviewsLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : reviewsError ? (
            <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
              <AlertCircle className="w-4 h-4" />
              Failed to load reviews.
              <button onClick={() => mutateReviews()} className="ml-auto underline text-xs">Retry</button>
            </div>
          ) : (appraisalReviews || []).length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "#667085" }} />
              <p className="text-sm" style={{ color: "#667085" }}>No reviews found</p>
            </div>
          ) : (
            <Table
              data={appraisalReviews || []}
              keyExtractor={(r: any) => r.id}
              columns={[
                { key: "employee", header: "Employee", render: (r: any) => <span className="text-sm font-medium" style={{ color: "#2C3547" }}>{empName(r.employee_id)}</span> },
                { key: "reviewer", header: "Reviewer", render: (r: any) => <span className="text-xs" style={{ color: "#667085" }}>{r.reviewer_id || "—"}</span> },
                { key: "self_rating", header: "Self Rating", render: (r: any) => <span className="text-xs">{r.self_rating ?? "—"}</span> },
                { key: "reviewer_rating", header: "Reviewer Rating", render: (r: any) => <span className="text-xs">{r.reviewer_rating ?? "—"}</span> },
                { key: "final_rating", header: "Final Rating", render: (r: any) => <span className="text-xs font-semibold">{r.final_rating ?? "—"}</span> },
                { key: "overall_score", header: "Overall Score", render: (r: any) => <span className="text-xs font-mono">{r.overall_score ?? "—"}</span> },
                { key: "status", header: "Status", render: (r: any) => reviewStatusBadge(r.status) },
                { key: "actions", header: "Actions", render: (r: any) => (
                  <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                    <button className="p-1 rounded hover:bg-gray-100" title="Edit"><Edit2 className="w-3.5 h-3.5" style={{ color: "#2C3547" }} /></button>
                  </div>
                )},
              ]}
            />
          )}
          {showReviewForm && (
            <div className="mt-4 p-4 rounded-xl" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB" }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Employee</label>
                  <select value={reviewForm.employee_id} onChange={(e) => setReviewForm({ ...reviewForm, employee_id: e.target.value })} style={selectStyle}>
                    <option value="">Select Employee</option>
                    {employeesList.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.user ? `${e.user.first_name} ${e.user.last_name || ""}` : e.employee_code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Reviewer ID</label>
                  <input type="text" value={reviewForm.reviewer_id} onChange={(e) => setReviewForm({ ...reviewForm, reviewer_id: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Self Rating</label>
                  <input type="number" value={reviewForm.self_rating} onChange={(e) => setReviewForm({ ...reviewForm, self_rating: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Reviewer Rating</label>
                  <input type="number" value={reviewForm.reviewer_rating} onChange={(e) => setReviewForm({ ...reviewForm, reviewer_rating: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Final Rating</label>
                  <input type="number" value={reviewForm.final_rating} onChange={(e) => setReviewForm({ ...reviewForm, final_rating: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Overall Score</label>
                  <input type="number" value={reviewForm.overall_score} onChange={(e) => setReviewForm({ ...reviewForm, overall_score: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Status</label>
                  <select value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })} style={selectStyle}>
                    {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Self Comment</label>
                  <textarea value={reviewForm.self_comment} onChange={(e) => setReviewForm({ ...reviewForm, self_comment: e.target.value })} style={textareaStyle} rows={3} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Reviewer Comment</label>
                  <textarea value={reviewForm.reviewer_comment} onChange={(e) => setReviewForm({ ...reviewForm, reviewer_comment: e.target.value })} style={textareaStyle} rows={3} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={() => setShowReviewForm(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#667085", background: "#F5F7FA" }}>Cancel</button>
                <button onClick={saveReview} disabled={reviewSaving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  {reviewSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {reviewSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ────────────── TAB: GOALS ────────────── */}
      {activeTab === "goals" && (
        <Card>
          <CardHeader
            title="Appraisal Goals"
            subtitle={`${(appraisalGoals || []).length} goals`}
            action={
              <div className="flex items-center gap-2">
                <select value={goalCycleFilter} onChange={(e) => setGoalCycleFilter(e.target.value)} style={{ ...selectStyle, width: "160px", padding: "6px 10px", fontSize: "12px" }}>
                  <option value="">All Cycles</option>
                  {(appraisalCycles || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={goalEmployeeFilter} onChange={(e) => setGoalEmployeeFilter(e.target.value)} style={{ ...selectStyle, width: "160px", padding: "6px 10px", fontSize: "12px" }}>
                  <option value="">All Employees</option>
                  {employeesList.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.user ? `${e.user.first_name} ${e.user.last_name || ""}` : e.employee_code}</option>
                  ))}
                </select>
                <button onClick={openGoalForm} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  <Plus className="w-3.5 h-3.5" /> Add Goal
                </button>
              </div>
            }
          />
          {goalsLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : goalsError ? (
            <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
              <AlertCircle className="w-4 h-4" />
              Failed to load goals.
              <button onClick={() => mutateGoals()} className="ml-auto underline text-xs">Retry</button>
            </div>
          ) : (appraisalGoals || []).length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-6 h-6 mx-auto mb-2" style={{ color: "#667085" }} />
              <p className="text-sm" style={{ color: "#667085" }}>No goals found</p>
            </div>
          ) : (
            <Table
              data={appraisalGoals || []}
              keyExtractor={(g: any) => g.id}
              columns={[
                { key: "employee", header: "Employee", render: (g: any) => <span className="text-sm font-medium" style={{ color: "#2C3547" }}>{empName(g.employee_id)}</span> },
                { key: "goal", header: "Goal", render: (g: any) => <span className="text-xs" style={{ color: "#667085" }}>{(g.goal || "").length > 60 ? g.goal.slice(0, 60) + "..." : g.goal || "—"}</span> },
                { key: "weightage", header: "Weightage (%)", render: (g: any) => <span className="text-xs font-mono">{g.weightage ?? "—"}</span> },
                { key: "target_date", header: "Target Date", render: (g: any) => <span className="text-xs" style={{ color: "#667085" }}>{g.target_date ? new Date(g.target_date).toLocaleDateString() : "—"}</span> },
                { key: "status", header: "Status", render: (g: any) => goalStatusBadge(g.status) },
                { key: "actions", header: "Actions", render: (g: any) => (
                  <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                    <button className="p-1 rounded hover:bg-gray-100" title="Edit"><Edit2 className="w-3.5 h-3.5" style={{ color: "#2C3547" }} /></button>
                  </div>
                )},
              ]}
            />
          )}
          {showGoalForm && (
            <div className="mt-4 p-4 rounded-xl" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB" }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Employee</label>
                  <select value={goalForm.employee_id} onChange={(e) => setGoalForm({ ...goalForm, employee_id: e.target.value })} style={selectStyle}>
                    <option value="">Select Employee</option>
                    {employeesList.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.user ? `${e.user.first_name} ${e.user.last_name || ""}` : e.employee_code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Weightage (%)</label>
                  <input type="number" value={goalForm.weightage} onChange={(e) => setGoalForm({ ...goalForm, weightage: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Target Date</label>
                  <input type="date" value={goalForm.target_date} onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })} style={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Goal</label>
                  <textarea value={goalForm.goal} onChange={(e) => setGoalForm({ ...goalForm, goal: e.target.value })} style={textareaStyle} rows={3} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={() => setShowGoalForm(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#667085", background: "#F5F7FA" }}>Cancel</button>
                <button onClick={saveGoal} disabled={goalSaving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2C3547" }}>
                  {goalSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {goalSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm flex items-center gap-2 shadow-lg" style={{
          background: feedback.type === "success" ? "#2BAE8E" : "#E53E3E",
          color: "#FFFFFF",
        }}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}
    </div>
  );
}
