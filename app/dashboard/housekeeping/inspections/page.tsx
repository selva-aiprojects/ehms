"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  ClipboardCheck, AlertCircle, Loader2, RefreshCw, Search as SearchIcon,
  Plus, Eye, X, Check, ChevronDown, Building, User, Calendar,
  ThumbsUp, ThumbsDown, Minus
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useHKInspections, useHKChecklists } from "@/lib/hooks";

const STATUS_BADGE: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  passed: "teal", failed: "red", conditional_pass: "amber", pending: "gray",
};

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

export default function HKInspectionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formData, setFormData] = useState({ task_id: "", unit_id: "", score: 0, status: "pending", notes: "" });

  const { inspections, isLoading, isError, mutate } = useHKInspections(unitFilter || undefined, statusFilter || undefined);
  const displayData = inspections || [];

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  async function handleCreateInspection() {
    setSaving(true);
    try {
      const res = await fetch("/api/housekeeping/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Create failed");
      setFeedback({ type: "success", message: "Inspection created" });
      setShowCreateForm(false);
      setFormData({ task_id: "", unit_id: "", score: 0, status: "pending", notes: "" });
      mutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to create inspection" });
    } finally {
      setSaving(false);
    }
  }

  const total = displayData.length;
  const passed = displayData.filter((i: any) => i.status === "passed").length;
  const failed = displayData.filter((i: any) => i.status === "failed").length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Quality Inspections</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Inspection records and quality assurance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
            <Plus className="w-3.5 h-3.5" /> Create Inspection
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

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Failed to load inspections.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{total}</div>
            <ClipboardCheck className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Inspections</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{passed}</div>
            <ThumbsUp className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Passed</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#E53E3E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{failed}</div>
            <ThumbsDown className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Failed</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#F5F7FA" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>{passRate}%</div>
            <Minus className="w-5 h-5" style={{ color: "#64748B" }} />
          </div>
          <div className="text-xs" style={{ color: "#64748B" }}>Pass Rate</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Inspection Records"
          subtitle={`${total} inspections`}
          action={
            <div className="flex items-center gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="conditional_pass">Conditional Pass</option>
              </select>
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#64748B" }} />
                <input type="text" value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)}
                  placeholder="Filter by unit..."
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border w-40"
                  style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
              </div>
            </div>
          }
        />
        {isLoading ? (
          <div className="space-y-1">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardCheck className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No inspections found</p>
          </div>
        ) : (
          <Table
            data={displayData}
            keyExtractor={(i: any) => i.id}
            onRowClick={(item: any) => setExpandedInspection(expandedInspection === item.id ? null : item.id)}
            columns={[
              { key: "unit", header: "Unit", render: (i: any) => <span className="font-medium text-sm">{i.unit?.unit_label || i.unit_label || "—"}</span> },
              { key: "task", header: "Task", render: (i: any) => <span className="text-xs" style={{ color: "#64748B" }}>{i.task?.task_type ? i.task.task_type.replace(/_/g, " ") : i.task_id || "—"}</span> },
              { key: "inspector", header: "Inspector", render: (i: any) => (
                <span className="text-xs" style={{ color: "#64748B" }}>
                  {i.inspector ? `${i.inspector.first_name || ""} ${i.inspector.last_name || ""}` : i.inspector_name || "—"}
                </span>
              )},
              { key: "score", header: "Score", render: (i: any) => (
                <span className="text-sm font-medium">{i.score != null ? `${i.score}%` : "—"}</span>
              )},
              { key: "status", header: "Status", render: (i: any) => <Badge variant={STATUS_BADGE[i.status] || "gray"}>{(i.status || "").replace(/_/g, " ")}</Badge> },
              { key: "date", header: "Date", render: (i: any) => (
                <span className="text-xs" style={{ color: "#64748B" }}>{i.inspection_date ? new Date(i.inspection_date).toLocaleDateString() : i.created_at ? new Date(i.created_at).toLocaleDateString() : "—"}</span>
              )},
              { key: "actions", header: "Actions", render: (i: any) => (
                <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => setExpandedInspection(expandedInspection === i.id ? null : i.id)} className="p-1 rounded hover:bg-gray-100" title="View Details">
                    <Eye className="w-3.5 h-3.5" style={{ color: "#1A3C5E" }} />
                  </button>
                </div>
              )},
            ]}
          />
        )}
      </Card>

      {expandedInspection && (() => {
        const insp = displayData.find((i: any) => i.id === expandedInspection);
        if (!insp) return null;
        return (
          <Card>
            <CardHeader
              title={`Inspection — ${insp.unit?.unit_label || insp.unit_label || ""}`}
              subtitle={`Score: ${insp.score != null ? `${insp.score}%` : "—"} · ${insp.status || ""}`}
              action={<button onClick={() => setExpandedInspection(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>}
            />
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs" style={{ color: "#64748B" }}>Inspector</span><p className="font-medium">{insp.inspector ? `${insp.inspector.first_name || ""} ${insp.inspector.last_name || ""}` : insp.inspector_name || "—"}</p></div>
                <div><span className="text-xs" style={{ color: "#64748B" }}>Date</span><p className="font-medium">{insp.inspection_date ? new Date(insp.inspection_date).toLocaleDateString() : "—"}</p></div>
                <div className="col-span-2"><span className="text-xs" style={{ color: "#64748B" }}>Notes</span><p className="font-medium">{insp.notes || "—"}</p></div>
              </div>
              {insp.checklist_items && Array.isArray(insp.checklist_items) && (
                <div>
                  <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "#64748B" }}>Checklist Items</h4>
                  <div className="space-y-1.5">
                    {insp.checklist_items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F5F7FA" }}>
                        {item.passed ? (
                          <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#2BAE8E" }} />
                        ) : (
                          <X className="w-3.5 h-3.5 shrink-0" style={{ color: "#E53E3E" }} />
                        )}
                        <span className="text-xs">{item.label || item.name || item.checkpoint || `Item ${idx + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })()}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowCreateForm(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="text-base font-semibold" style={{ color: "#1A3C5E" }}>Create Inspection</h2>
              <button onClick={() => setShowCreateForm(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Task ID</label>
                <input type="text" value={formData.task_id} onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} placeholder="Task ID" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Unit ID</label>
                <input type="text" value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} placeholder="Unit ID" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Score (%)</label>
                <input type="number" value={formData.score} onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} min={0} max={100} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }}>
                  <option value="pending">Pending</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="conditional_pass">Conditional Pass</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%", minHeight: "60px" }} />
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #E2E8F0" }}>
              <button onClick={() => setShowCreateForm(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleCreateInspection} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <ClipboardCheck className="w-3 h-3" />}
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
