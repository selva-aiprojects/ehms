"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  TicketCheck, AlertCircle, Loader2, RefreshCw, Search as SearchIcon,
  Plus, ChevronDown, ChevronRight, Clock, CheckCircle, X, Save,
  User, Wrench, Package, Calendar, Play
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useMaintenance, useMaintenanceStats, useMaintenanceTicketParts, useMaintenanceTimeEntries, useMaintenanceApprovals, useVendors } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

const PRIORITY_CONFIG: Record<string, { badge: "red" | "amber" | "gray" | "teal"; color: string }> = {
  critical: { badge: "red", color: "#E53E3E" },
  high: { badge: "amber", color: "#F5A623" },
  medium: { badge: "gray", color: "#64748B" },
  low: { badge: "teal", color: "#2BAE8E" },
};

const STATUS_BADGE: Record<string, "red" | "amber" | "teal" | "gray" | "navy"> = {
  open: "red", assigned: "navy", in_progress: "amber", resolved: "teal", closed: "gray",
};

const PRIORITIES = ["low", "medium", "high", "critical"];
const CATEGORIES = ["HVAC", "Plumbing", "Electrical", "Elevator", "Pool", "Other"];

export default function TicketsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({ title: "", description: "", priority: "medium", category: "", unit_id: "", assigned_to: "" });
  const [assigning, setAssigning] = useState<string | null>(null);

  const { tickets, isLoading, isError, mutate } = useMaintenance({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });
  const { maintStats, isLoading: statsLoading } = useMaintenanceStats();
  const { vendors, isLoading: vendorsLoading } = useVendors();
  const displayTickets = (tickets || []) as any[];

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const stats: any = maintStats?.data || {};

  const filtered = displayTickets.filter((t) => {
    const mSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.id?.toLowerCase().includes(search.toLowerCase());
    const mCat = !categoryFilter || t.category === categoryFilter;
    return mSearch && mCat;
  });

  const openAdd = () => {
    setFormData({ title: "", description: "", priority: "medium", category: "", unit_id: "", assigned_to: "" });
    setShowCreateModal(true);
  };

  const handleCreateTicket = async () => {
    if (!formData.title?.trim()) {
      setFeedback({ type: "error", message: "Title is required" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Create failed");
      setFeedback({ type: "success", message: "Ticket created" });
      setShowCreateModal(false);
      mutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to create ticket" });
    } finally {
      setSaving(false);
    }
  };

  const updateTicket = async (id: string, body: Record<string, any>, successMsg: string) => {
    try {
      const res = await fetch(`/api/maintenance/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      setFeedback({ type: "success", message: successMsg });
      mutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to update ticket" });
    }
  };

  const handleAssign = async (ticketId: string, assignedTo: string) => {
    await updateTicket(ticketId, { assigned_to: assignedTo, status: "assigned" }, "Ticket assigned");
    setAssigning(null);
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
    catch { return d || "—"; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Ticket Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Track and manage maintenance requests</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
            <Plus className="w-3.5 h-3.5" /> Create Ticket
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{
          background: feedback.type === "success" ? "rgba(43,174,142,0.08)" : "rgba(229,62,62,0.08)",
          color: feedback.type === "success" ? "#2BAE8E" : "#E53E3E",
          border: feedback.type === "success" ? "1px solid rgba(43,174,142,0.2)" : "1px solid rgba(229,62,62,0.2)",
        }}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" /> Failed to load tickets.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {(isLoading || statsLoading) && !tickets ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}>
              <div className="w-12 h-8 rounded mb-2" style={{ background: "#CBD5E1" }} />
              <div className="w-16 h-3 rounded" style={{ background: "#CBD5E1" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 text-white" style={{ background: "#E53E3E" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{stats.open ?? displayTickets.filter((t: any) => t.status === "open").length}</div>
              <TicketCheck className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Open</div>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ background: "#F5A623" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{stats.in_progress ?? displayTickets.filter((t: any) => t.status === "in_progress").length}</div>
              <Clock className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">In Progress</div>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{stats.resolved_today ?? displayTickets.filter((t: any) => t.status === "resolved").length}</div>
              <CheckCircle className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Resolved Today</div>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{stats.avg_resolution_hours ? `${stats.avg_resolution_hours}h` : "—"}</div>
              <Clock className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Avg Resolution Hours</div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader
          title="Maintenance Tickets"
          subtitle={`${filtered.length} tickets`}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#64748B" }} />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tickets..."
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border w-40"
                  style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                <option value="">All Priority</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
            <TicketCheck className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No tickets found</p>
          </div>
        ) : (
          <Table
            data={filtered}
            keyExtractor={(t: any) => t.id}
            columns={[
              { key: "id", header: "Ticket#", render: (t: any) => <span className="font-mono text-xs" style={{ color: "#2C3547" }}>#{t.id?.slice(0, 8)}</span> },
              { key: "title", header: "Issue", render: (t: any) => <span className="text-sm font-medium">{t.title}</span> },
              { key: "unit_label", header: "Unit", render: (t: any) => <span className="text-xs" style={{ color: "#667085" }}>{t.unit_label || "—"}</span> },
              { key: "category", header: "Category", render: (t: any) => t.category ? <Badge variant="gray">{t.category}</Badge> : <span style={{ color: "#667085" }}>—</span> },
              { key: "priority", header: "Priority", render: (t: any) => <Badge variant={PRIORITY_CONFIG[t.priority]?.badge || "gray"}>{t.priority}</Badge> },
              { key: "status", header: "Status", render: (t: any) => <Badge variant={STATUS_BADGE[t.status] || "gray"}>{t.status.replace("_", " ")}</Badge> },
              { key: "assigned_name", header: "Assigned To", render: (t: any) => <span className="text-xs" style={{ color: "#667085" }}>{t.assigned_name || "—"}</span> },
              { key: "created_at", header: "Created", render: (t: any) => <span className="text-xs" style={{ color: "#667085" }}>{formatDate(t.created_at)}</span> },
              { key: "actions", header: "Actions", render: (t: any) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setExpandedTicket(expandedTicket === t.id ? null : t.id)} className="p-1 rounded hover:bg-gray-100" title="Details">
                    {expandedTicket === t.id ? <ChevronDown className="w-3.5 h-3.5" style={{ color: "#2C3547" }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color: "#2C3547" }} />}
                  </button>
                  {(t.status === "open" || t.status === "assigned") && (
                    <div className="relative">
                      <button onClick={() => setAssigning(assigning === t.id ? null : t.id)} className="p-1 rounded hover:bg-gray-100" title="Assign">
                        <User className="w-3.5 h-3.5" style={{ color: "#2C3547" }} />
                      </button>
                      {assigning === t.id && (
                        <div className="absolute top-full left-0 z-20 mt-1 w-48 bg-white rounded-lg shadow-xl" style={{ border: "1px solid #E5E7EB" }}>
                          <div className="p-2">
                            <p className="text-[10px] font-medium mb-1" style={{ color: "#667085" }}>Assign to:</p>
                            <select onChange={(e) => { if (e.target.value) handleAssign(t.id, e.target.value); }} className="w-full px-2 py-1 rounded text-xs border outline-none" style={{ borderColor: "#E5E7EB", background: "#F5F7FA", color: "#1A2E44" }}>
                              <option value="">Select...</option>
                              {vendors?.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {t.status === "assigned" && (
                    <button onClick={() => updateTicket(t.id, { status: "in_progress" }, "Ticket started")} className="p-1 rounded hover:bg-gray-100" title="Start">
                      <Play className="w-3.5 h-3.5" style={{ color: "#F5A623" }} />
                    </button>
                  )}
                  {t.status === "in_progress" && (
                    <button onClick={() => updateTicket(t.id, { status: "resolved", resolved_at: new Date().toISOString() }, "Ticket resolved")} className="p-1 rounded hover:bg-gray-100" title="Resolve">
                      <CheckCircle className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
                    </button>
                  )}
                  {(t.status === "resolved" || t.status === "in_progress") && (
                    <button onClick={() => updateTicket(t.id, { status: "closed" }, "Ticket closed")} className="p-1 rounded hover:bg-gray-100" title="Close">
                      <X className="w-3.5 h-3.5" style={{ color: "#667085" }} />
                    </button>
                  )}
                </div>
              )},
            ]}
          />
        )}
      </Card>

      {/* Expandable detail rows */}
      {expandedTicket && <TicketDetail ticketId={expandedTicket} onClose={() => setExpandedTicket(null)} />}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: "1px solid #E5E7EB" }}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid #E5E7EB" }}>
              <h2 className="text-base font-semibold" style={{ color: "#2C3547" }}>Create Ticket</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#667085" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%", color: "#1A2E44" }}>
                    <option value="">Select</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%", color: "#1A2E44" }}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Unit ID</label>
                <input type="text" value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#667085" }}>Assign To</label>
                <select value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%", color: "#1A2E44" }}>
                  <option value="">Unassigned</option>
                  {vendors?.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #E5E7EB" }}>
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#667085", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleCreateTicket} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {saving ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketDetail({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const { ticketParts, isLoading: partsLoading } = useMaintenanceTicketParts(ticketId);
  const { timeEntries, isLoading: timeLoading } = useMaintenanceTimeEntries(ticketId);
  const { approvals, isLoading: approvalsLoading } = useMaintenanceApprovals(ticketId);

  return (
    <Card>
      <CardHeader
        title={`Ticket Details: #${ticketId.slice(0, 8)}`}
        action={<button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#667085" }} /></button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
          <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "#667085" }}>
            <Package className="w-3 h-3 inline mr-1" />Parts Used
          </h4>
          {partsLoading ? <SkeletonRow /> : !ticketParts?.length ? (
            <p className="text-xs" style={{ color: "#667085" }}>No parts used</p>
          ) : (
            <div className="space-y-1">
              {ticketParts.map((p: any) => (
                <div key={p.id} className="flex justify-between text-xs">
                  <span>{p.part_name}</span>
                  <span className="font-medium">{p.quantity} x ${p.unit_price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
          <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "#667085" }}>
            <Clock className="w-3 h-3 inline mr-1" />Time Logged
          </h4>
          {timeLoading ? <SkeletonRow /> : !timeEntries?.length ? (
            <p className="text-xs" style={{ color: "#667085" }}>No time entries</p>
          ) : (
            <div className="space-y-1">
              {timeEntries.map((e: any) => (
                <div key={e.id} className="flex justify-between text-xs">
                  <span>{e.technician_name || "—"}</span>
                  <span className="font-medium">{e.hours_logged}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
          <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "#667085" }}>
            <CheckCircle className="w-3 h-3 inline mr-1" />Approval History
          </h4>
          {approvalsLoading ? <SkeletonRow /> : !approvals?.length ? (
            <p className="text-xs" style={{ color: "#667085" }}>No approvals</p>
          ) : (
            <div className="space-y-1">
              {approvals.map((a: any) => (
                <div key={a.id} className="flex justify-between text-xs">
                  <span>{a.approver_name || "—"}</span>
                  <Badge variant={a.status === "approved" ? "teal" : a.status === "rejected" ? "red" : "amber"}>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}


