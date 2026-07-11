"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  ClipboardList, AlertCircle, Loader2, RefreshCw, Search as SearchIcon,
  Plus, Eye, X, ChevronDown, Check, Play, FileText, ListChecks,
  Calendar, User, Building
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useHousekeeping, useHKChecklists, useEmployees, useHKStats, useProperties, useStaffAvailability } from "@/lib/hooks";
import { useJourney } from "@/components/providers/JourneyProvider";

const PRIORITY_BADGE: Record<string, "gray" | "amber" | "red" | "teal"> = {
  low: "gray", medium: "amber", high: "red", critical: "teal",
};

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

export default function HKTasksPage() {
  const { selectedPropertyId } = useJourney();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [checklistTask, setChecklistTask] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({ task_type: "", unit_id: "", assigned_to: "", priority: "medium", notes: "" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setPropertyFilter(selectedPropertyId);
  }, [selectedPropertyId]);

  const { tasks, isLoading, isError, mutate } = useHousekeeping({ status: statusFilter || undefined, property_id: propertyFilter || undefined });
  const { hkStats } = useHKStats();
  const { employees } = useEmployees();
  const { staffAvailability } = useStaffAvailability({ property_id: selectedPropertyId });
  const { properties } = useProperties();
  const { checklists } = useHKChecklists(checklistTask?.id);

  const displayData = tasks || [];

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  async function handleStartTask(taskId: string) {
    try {
      const res = await fetch(`/api/housekeeping/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });
      if (!res.ok) throw new Error("Failed to start task");
      setFeedback({ type: "success", message: "Task started" });
      mutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to start task" });
    }
  }

  async function handleCreateTask() {
    setSaving(true);
    try {
      const res = await fetch("/api/housekeeping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Create failed");
      setFeedback({ type: "success", message: "Task created" });
      setShowCreateForm(false);
      setFormData({ task_type: "", unit_id: "", assigned_to: "", priority: "medium", notes: "" });
      mutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to create task" });
    } finally {
      setSaving(false);
    }
  }

  const filtered = displayData.filter((t: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const label = t.unit?.unit_label || t.unit_label || "";
      if (!label.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Task List</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage housekeeping tasks and checklists</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
            <Plus className="w-3.5 h-3.5" /> Create Task
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
          Failed to load tasks.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{hkStats?.open ?? displayData.filter((t: any) => t.status === "open").length}</div>
            <ClipboardList className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Open</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#F5A623" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{hkStats?.in_progress ?? displayData.filter((t: any) => t.status === "in_progress").length}</div>
            <Loader2 className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">In Progress</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{hkStats?.completed_today ?? displayData.filter((t: any) => t.status === "resolved" || t.status === "completed").length}</div>
            <Check className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Completed Today</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#F5F7FA" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>{properties?.length || 0}</div>
            <Building className="w-5 h-5" style={{ color: "#64748B" }} />
          </div>
          <div className="text-xs" style={{ color: "#64748B" }}>Properties</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Housekeeping Tasks"
          subtitle={`${filtered.length} tasks`}
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#64748B" }} />
                <input
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search unit/room..."
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border w-40"
                  style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }}
                />
              </div>
              <select
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}
              >
                <option value="">All Properties</option>
                {(properties || []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          }
        />
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No tasks found</p>
          </div>
        ) : (
          <Table
            data={filtered}
            keyExtractor={(t: any) => t.id}
            columns={[
              { key: "room", header: "Room/Unit", render: (t: any) => (
                <span className="font-medium text-sm">{t.unit?.unit_label || t.unit_label || "—"}</span>
              )},
              { key: "task_type", header: "Task Type", render: (t: any) => (
                <span className="text-xs capitalize" style={{ color: "#64748B" }}>{(t.task_type || "").replace(/_/g, " ")}</span>
              )},
              { key: "priority", header: "Priority", render: (t: any) => (
                <Badge variant={PRIORITY_BADGE[t.priority] || "gray"}>{t.priority || "—"}</Badge>
              )},
              { key: "assigned_to", header: "Assigned To", render: (t: any) => (
                <span className="text-xs" style={{ color: "#64748B" }}>{t.assignee ? `${t.assignee.first_name} ${t.assignee.last_name || ""}` : t.assigned_to || "—"}</span>
              )},
              { key: "status", header: "Status", render: (t: any) => (
                <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{
                  background: t.status === "open" ? "rgba(100,116,139,0.1)" : t.status === "in_progress" ? "rgba(245,166,35,0.1)" : "rgba(43,174,142,0.1)",
                  color: t.status === "open" ? "#64748B" : t.status === "in_progress" ? "#D4850A" : "#2BAE8E",
                }}>{(t.status || "").replace(/_/g, " ")}</span>
              )},
              { key: "created_at", header: "Created At", render: (t: any) => (
                <span className="text-xs" style={{ color: "#64748B" }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</span>
              )},
              { key: "actions", header: "Actions", render: (t: any) => (
                <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => setExpandedTask(expandedTask === t.id ? null : t.id)} className="p-1 rounded hover:bg-gray-100" title="View Details">
                    <Eye className="w-3.5 h-3.5" style={{ color: "#1A3C5E" }} />
                  </button>
                  {(t.status === "open" || t.status === "assigned") && (
                    <button onClick={() => handleStartTask(t.id)} className="p-1 rounded hover:bg-gray-100" title="Start Task">
                      <Play className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
                    </button>
                  )}
                  {t.status === "in_progress" && (
                    <button onClick={() => setChecklistTask(t)} className="p-1 rounded hover:bg-gray-100" title="Complete with Checklist">
                      <ListChecks className="w-3.5 h-3.5" style={{ color: "#F5A623" }} />
                    </button>
                  )}
                </div>
              )},
            ]}
          />
        )}
      </Card>

      {expandedTask && (() => {
        const t = filtered.find((x: any) => x.id === expandedTask);
        if (!t) return null;
        return (
          <Card>
            <CardHeader
              title={`Task Details — ${t.unit?.unit_label || t.unit_label || ""}`}
              subtitle={`${t.task_type || ""} · ${t.priority || ""}`}
              action={<button onClick={() => setExpandedTask(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>}
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-xs" style={{ color: "#64748B" }}>Assigned To</span><p className="font-medium">{t.assignee ? `${t.assignee.first_name} ${t.assignee.last_name || ""}` : t.assigned_to || "—"}</p></div>
              <div><span className="text-xs" style={{ color: "#64748B" }}>Status</span><p className="font-medium capitalize">{(t.status || "").replace(/_/g, " ")}</p></div>
              <div><span className="text-xs" style={{ color: "#64748B" }}>Created</span><p className="font-medium">{t.created_at ? new Date(t.created_at).toLocaleString() : "—"}</p></div>
              <div><span className="text-xs" style={{ color: "#64748B" }}>Scheduled</span><p className="font-medium">{t.scheduled_at ? new Date(t.scheduled_at).toLocaleString() : "—"}</p></div>
              <div className="col-span-2"><span className="text-xs" style={{ color: "#64748B" }}>Notes</span><p className="font-medium">{t.notes || "—"}</p></div>
            </div>
          </Card>
        );
      })()}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowCreateForm(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="text-base font-semibold" style={{ color: "#1A3C5E" }}>Create Task</h2>
              <button onClick={() => setShowCreateForm(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Task Type</label>
                <input type="text" value={formData.task_type} onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} placeholder="e.g. deep_clean" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Unit ID</label>
                <input type="text" value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} placeholder="Unit ID" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Assigned To (Live Availability)</label>
                <select value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }}>
                  <option value="">Select employee (or leave unassigned)</option>
                  {(employees || []).map((e: any) => {
                    const avail = staffAvailability?.find((s: any) => s.id === e.id || s.user?.id === e.user_id);
                    const badgeText = avail?.availability_badge?.text ? ` [${avail.availability_badge.text}]` : "";
                    return (
                      <option key={e.id} value={e.id}>
                        {e.user ? `${e.user.first_name} ${e.user.last_name || ""}` : e.employee_code}{badgeText}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Priority</label>
                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
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
              <button onClick={handleCreateTask} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {checklistTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setChecklistTask(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[80vh] overflow-y-auto" style={{ border: "1px solid #E2E8F0" }}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="text-base font-semibold" style={{ color: "#1A3C5E" }}>Checklist — {checklistTask.unit?.unit_label || ""}</h2>
              <button onClick={() => setChecklistTask(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
            </div>
            <div className="p-6 space-y-3">
              {(checklists || []).length === 0 ? (
                <p className="text-sm" style={{ color: "#64748B" }}>No checklists available for this task</p>
              ) : (
                (checklists || []).map((cl: any) => (
                  <label key={cl.id} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer" style={{ background: cl.completed ? "rgba(43,174,142,0.04)" : "#F5F7FA" }}>
                    <input type="checkbox" checked={cl.completed || false} readOnly className="w-4 h-4 rounded accent-teal-600" />
                    <span className="text-sm" style={{ color: cl.completed ? "#1A2E44" : "#64748B" }}>{cl.item || cl.checkpoint || cl.name}</span>
                  </label>
                ))
              )}
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #E2E8F0" }}>
              <button onClick={() => setChecklistTask(null)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Close</button>
              <button onClick={async () => {
                try {
                  await fetch(`/api/housekeeping/${checklistTask.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "resolved" }),
                  });
                  setFeedback({ type: "success", message: "Task completed with checklist" });
                  setChecklistTask(null);
                  mutate();
                } catch {
                  setFeedback({ type: "error", message: "Failed to complete task" });
                }
              }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "#2BAE8E" }}>
                <Check className="w-3 h-3" /> Complete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
