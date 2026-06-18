"use client";

import { useState, useEffect } from "react";
import { Wrench, AlertTriangle, AlertCircle, Loader2, RefreshCw, Plus, CheckCircle, Clock, User, Building2, Filter, Search as SearchIcon, Package, Users, Star, TrendingUp, BarChart3, Calendar, Phone, Truck } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import { useMaintenance } from "@/lib/hooks";
import { useCreateMaintenanceTicket } from "@/lib/hooks/mutations";

const MOCK_TICKETS = [
  { id: "MNT-001", title: "AC not cooling", asset_name: "AC #1204-01", unit_label: "1204", priority: "critical", status: "in_progress", assigned_name: "Ravi M.", created_at: new Date().toISOString(), category: "HVAC" },
  { id: "MNT-002", title: "Geyser leakage", asset_name: "Geyser #305-01", unit_label: "305", priority: "high", status: "open", assigned_name: "Suresh K.", created_at: new Date().toISOString(), category: "Plumbing" },
  { id: "MNT-003", title: "TV not powering on", asset_name: "TV #203-01", unit_label: "203", priority: "medium", status: "open", assigned_name: "Unassigned", created_at: new Date().toISOString(), category: "Electrical" },
  { id: "MNT-004", title: "HVAC Preventive (90d)", asset_name: "HVAC System A", unit_label: "Common", priority: "low", status: "open", assigned_name: "Team A", created_at: new Date().toISOString(), category: "HVAC" },
  { id: "MNT-005", title: "Door lock jammed", asset_name: "Lock #102-01", unit_label: "102", priority: "high", status: "resolved", assigned_name: "Ravi M.", created_at: new Date(Date.now() - 86400000).toISOString(), category: "Electrical" },
  { id: "MNT-006", title: "Pool pump noise", asset_name: "Pool Pump P-01", unit_label: "Ground", priority: "medium", status: "open", assigned_name: "Unassigned", created_at: new Date().toISOString(), category: "Pool" },
  { id: "MNT-007", title: "Elevator B stuck", asset_name: "Elevator B", unit_label: "Lobby", priority: "critical", status: "in_progress", assigned_name: "Otis Tech", created_at: new Date().toISOString(), category: "Elevator" },
];

const AMC_DATA = [
  { vendor: "CoolTech HVAC", asset: "HVAC Systems", expiry: "15 Aug 2026", days: 58, status: "active" },
  { vendor: "SafeLock Inc.", asset: "Smart Locks", expiry: "02 Mar 2026", days: -108, status: "expired" },
  { vendor: "ElectroCare", asset: "Electrical", expiry: "20 Sep 2026", days: 94, status: "active" },
  { vendor: "PlumbPro", asset: "Plumbing", expiry: "05 Jul 2026", days: 17, status: "active" },
  { vendor: "Otis Elevators", asset: "Elevators", expiry: "30 Aug 2026", days: 73, status: "active" },
  { vendor: "FireSafe Systems", asset: "Fire Safety", expiry: "10 Jun 2026", days: -8, status: "expired" },
];

const PREVENTIVE_SCHEDULE = [
  { task: "HVAC Service", asset: "System A", freq: "90 days", last: "20 Mar 2026", next: "18 Jun 2026", status: "Due Today" },
  { task: "Fire Alarm Test", asset: "Building A", freq: "30 days", last: "18 May 2026", next: "17 Jun 2026", status: "Overdue" },
  { task: "Generator Check", asset: "Gen-01", freq: "60 days", last: "20 Apr 2026", next: "19 Jun 2026", status: "Tomorrow" },
  { task: "Water Treatment", asset: "Plant-01", freq: "15 days", last: "05 Jun 2026", next: "20 Jun 2026", status: "Scheduled" },
  { task: "STP Maintenance", asset: "STP-01", freq: "30 days", last: "25 May 2026", next: "24 Jun 2026", status: "Scheduled" },
];

const PARTS_INVENTORY = [
  { name: "AC Filter (16x25)", sku: "FIL-1625", stock: 24, min: 10, max: 50, unit: "pcs", category: "HVAC" },
  { name: "LED Bulb (9W)", sku: "LED-9W", stock: 8, min: 20, max: 100, unit: "pcs", category: "Electrical" },
  { name: "Geyser Thermostat", sku: "GYS-TH", stock: 3, min: 5, max: 15, unit: "pcs", category: "Plumbing" },
  { name: "PVC Pipe 1\"", sku: "PVC-1", stock: 15, min: 10, max: 30, unit: "m", category: "Plumbing" },
  { name: "Door Lock Kit", sku: "DLK-001", stock: 2, min: 5, max: 20, unit: "pcs", category: "Hardware" },
  { name: "Capacitor 50µF", sku: "CAP-50", stock: 6, min: 8, max: 25, unit: "pcs", category: "Electrical" },
  { name: "Fan Regulator", sku: "FAN-RG", stock: 11, min: 5, max: 15, unit: "pcs", category: "Electrical" },
  { name: "Water Pump Seal", sku: "WPS-01", stock: 4, min: 5, max: 10, unit: "pcs", category: "Plumbing" },
  { name: "Circuit Breaker (16A)", sku: "CBR-16A", stock: 7, min: 10, max: 30, unit: "pcs", category: "Electrical" },
  { name: "Tap Washer Set", sku: "TWS-10", stock: 18, min: 15, max: 50, unit: "pcs", category: "Plumbing" },
];

const TEAM_MEMBERS = [
  { name: "Ravi M.", role: "Senior Technician", department: "HVAC", status: "available", tickets: 3, phone: "+91-98765-43210", email: "ravi.m@hms.com", avatar: "RM" },
  { name: "Suresh K.", role: "Plumber", department: "Plumbing", status: "busy", tickets: 5, phone: "+91-98765-43211", email: "suresh.k@hms.com", avatar: "SK" },
  { name: "Amit S.", role: "Electrician", department: "Electrical", status: "available", tickets: 2, phone: "+91-98765-43212", email: "amit.s@hms.com", avatar: "AS" },
  { name: "Vijay P.", role: "Technician", department: "Pool", status: "off", tickets: 0, phone: "+91-98765-43213", email: "vijay.p@hms.com", avatar: "VP" },
  { name: "Priya M.", role: "Supervisor", department: "All", status: "available", tickets: 1, phone: "+91-98765-43214", email: "priya.m@hms.com", avatar: "PM" },
  { name: "Rahul V.", role: "Apprentice", department: "Electrical", status: "busy", tickets: 4, phone: "+91-98765-43215", email: "rahul.v@hms.com", avatar: "RV" },
  { name: "Deepak C.", role: "Technician", department: "HVAC", status: "available", tickets: 2, phone: "+91-98765-43216", email: "deepak.c@hms.com", avatar: "DC" },
  { name: "Manish T.", role: "Plumber", department: "Plumbing", status: "off", tickets: 0, phone: "+91-98765-43217", email: "manish.t@hms.com", avatar: "MT" },
];

const VENDOR_PERFORMANCE = [
  { name: "CoolTech HVAC", category: "HVAC", response_time: "2.5h", rating: 4.5, completed: 47, avg_cost: "₹4,200", status: "active" },
  { name: "SafeLock Inc.", category: "Hardware", response_time: "1.2h", rating: 4.8, completed: 23, avg_cost: "₹1,800", status: "active" },
  { name: "ElectroCare", category: "Electrical", response_time: "3.0h", rating: 4.2, completed: 35, avg_cost: "₹3,100", status: "active" },
  { name: "PlumbPro", category: "Plumbing", response_time: "4.5h", rating: 3.8, completed: 18, avg_cost: "₹2,500", status: "active" },
  { name: "FireSafe Systems", category: "Fire Safety", response_time: "1.0h", rating: 4.9, completed: 12, avg_cost: "₹8,500", status: "active" },
  { name: "Otis Elevators", category: "Elevator", response_time: "0.8h", rating: 4.6, completed: 8, avg_cost: "₹15,000", status: "active" },
  { name: "AquaPure", category: "Water Treatment", response_time: "5.0h", rating: 3.5, completed: 9, avg_cost: "₹6,000", status: "active" },
];

const WEEKLY_WORKLOAD = [
  { day: "Mon", tickets: 12, completed: 8 },
  { day: "Tue", tickets: 8, completed: 7 },
  { day: "Wed", tickets: 15, completed: 11 },
  { day: "Thu", tickets: 10, completed: 6 },
  { day: "Fri", tickets: 7, completed: 5 },
  { day: "Sat", tickets: 4, completed: 3 },
  { day: "Sun", tickets: 2, completed: 2 },
];

const PRIORITY_CONFIG: Record<string, { badge: "red" | "amber" | "gray" | "teal"; color: string }> = {
  critical: { badge: "red", color: "#E53E3E" },
  high: { badge: "amber", color: "#F5A623" },
  medium: { badge: "gray", color: "#64748B" },
  low: { badge: "teal", color: "#2BAE8E" },
};

const STATUS_BADGE: Record<string, "red" | "amber" | "teal" | "gray" | "navy"> = {
  open: "red", assigned: "navy", in_progress: "amber", resolved: "teal", closed: "gray",
};

const TEAM_STATUS_COLOR: Record<string, string> = {
  available: "#2BAE8E", busy: "#F5A623", off: "#CBD5E1",
};

const TEAM_STATUS_BG: Record<string, string> = {
  available: "rgba(42,157,143,0.1)", busy: "rgba(245,166,35,0.1)", off: "rgba(203,213,225,0.2)",
};

function StockBar({ current, min, max }: { current: number; min: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  const isLow = current <= min;
  const color = isLow ? "#E53E3E" : current <= min * 1.5 ? "#F5A623" : "#2BAE8E";
  return (
    <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-3 h-3"
          style={{
            fill: i < full ? "#F5A623" : hasHalf && i === full ? "#F5A623" : "transparent",
            color: i < full || (hasHalf && i === full) ? "#F5A623" : "#CBD5E1",
          }}
        />
      ))}
    </span>
  );
}

function SkeletonStat() {
  return <div className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}><div className="w-12 h-8 rounded mb-2" style={{ background: "#CBD5E1" }} /><div className="w-16 h-3 rounded" style={{ background: "#CBD5E1" }} /></div>;
}

export default function MaintenancePage() {
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: "medium", category: "" });

  const { tickets, isLoading, isError, mutate } = useMaintenance({ priority: priorityFilter, status: statusFilter });
  const createTicket = useCreateMaintenanceTicket();

  const displayTickets = (tickets && (tickets as any[]).length > 0) ? (tickets as any[]) : MOCK_TICKETS;
  const isLoadingDisplay = isLoading && !tickets;

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const openCount = displayTickets.filter((t) => t.status === "open").length;
  const inProgressCount = displayTickets.filter((t) => t.status === "in_progress").length;
  const resolvedToday = displayTickets.filter((t) => t.status === "resolved").length;
  const criticalCount = displayTickets.filter((t) => t.priority === "critical" && t.status !== "resolved" && t.status !== "closed").length;

  const lowStockCount = PARTS_INVENTORY.filter((p) => p.stock <= p.min).length;
  const totalPartsValue = PARTS_INVENTORY.reduce((sum, p) => sum + p.stock, 0);
  const availableStaff = TEAM_MEMBERS.filter((m) => m.status === "available").length;
  const totalStaff = TEAM_MEMBERS.length;
  const avgVendorRating = (VENDOR_PERFORMANCE.reduce((sum, v) => sum + v.rating, 0) / VENDOR_PERFORMANCE.length).toFixed(1);
  const totalCompletedThisWeek = WEEKLY_WORKLOAD.reduce((sum, d) => sum + d.completed, 0);
  const totalTicketsThisWeek = WEEKLY_WORKLOAD.reduce((sum, d) => sum + d.tickets, 0);
  const peakDay = [...WEEKLY_WORKLOAD].sort((a, b) => b.tickets - a.tickets)[0];

  async function handleCreateTicket() {
    if (!newTicket.title.trim()) {
      setActionFeedback({ type: "error", message: "Please enter a ticket title" });
      return;
    }
    setActionFeedback(null);
    try {
      await createTicket.trigger({
        property_id: "00000000-0000-0000-0000-000000000000",
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
      });
      setActionFeedback({ type: "success", message: `Ticket created: ${newTicket.title}` });
      setShowNewTicketForm(false);
      setNewTicket({ title: "", description: "", priority: "medium", category: "" });
      mutate();
    } catch {
      setActionFeedback({ type: "error", message: "Failed to create ticket" });
    }
  }

  function formatDate(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch { return dateStr; }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Maintenance & Asset Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>All properties · Real-time ticket dashboard</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isLoading && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "#E53E3E", color: "#FFFFFF" }}>
              <AlertTriangle className="w-3.5 h-3.5" /> {criticalCount} Critical
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowNewTicketForm(!showNewTicketForm)}>
            {showNewTicketForm ? <AlertCircle className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
            {showNewTicketForm ? "Cancel" : "New Ticket"}
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)",
            color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}`,
          }}
        >
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Could not load live data. Displaying mock data.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {showNewTicketForm && (
        <Card>
          <CardHeader title="Create New Ticket" />
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Title *</label>
              <input type="text" value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                placeholder="Brief description of the issue" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Description</label>
              <textarea value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} rows={2}
                placeholder="Detailed description..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Priority</label>
                <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}>
                  <option value="low">Low</option><option value="medium">Medium</option>
                  <option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Category</label>
                <select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}>
                  <option value="">Select</option><option value="HVAC">HVAC</option>
                  <option value="Plumbing">Plumbing</option><option value="Electrical">Electrical</option>
                  <option value="Elevator">Elevator</option><option value="Pool">Pool</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNewTicketForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleCreateTicket} disabled={createTicket.isMutating}>
                {createTicket.isMutating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating</> : <><Plus className="w-3.5 h-3.5" /> Create Ticket</>}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {["all", "open", "in_progress", "resolved"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s === "all" ? undefined : s)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              background: (s === "all" && !statusFilter) || statusFilter === s ? "#1A3C5E" : "#F5F7FA",
              color: (s === "all" && !statusFilter) || statusFilter === s ? "#FFFFFF" : "#64748B",
            }}
          >{s === "all" ? "All" : s.replace("_", " ")}</button>
        ))}
        <div style={{ width: 1, height: 20, background: "#E2E8F0", margin: "0 4px" }} />
        {["all_prio", "critical", "high", "medium", "low"].map((p) => (
          <button key={p} onClick={() => setPriorityFilter(p === "all_prio" ? undefined : p)}
            className="px-2 py-1 text-[10px] font-medium rounded-lg transition-all"
            style={{
              background: (p === "all_prio" && !priorityFilter) || priorityFilter === p ? "rgba(42,157,143,0.15)" : "#F5F7FA",
              color: (p === "all_prio" && !priorityFilter) || priorityFilter === p ? "#2BAE8E" : "#64748B",
            }}
          >{p === "all_prio" ? "All Priority" : p}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {isLoadingDisplay ? Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />) : (
          <>
            <div className="rounded-xl p-4 text-white" style={{ background: "#E53E3E" }}>
              <div className="text-2xl font-bold">{openCount}</div>
              <div className="text-xs mt-1 opacity-80">Open</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#F5A623" }}>
              <div className="text-2xl font-bold">{inProgressCount}</div>
              <div className="text-xs mt-1 opacity-80">In Progress</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
              <div className="text-2xl font-bold">{resolvedToday}</div>
              <div className="text-xs mt-1 opacity-80">Resolved Today</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
              <div className="text-2xl font-bold">{displayTickets.length > 0 ? "4.2h" : "—"}</div>
              <div className="text-xs mt-1 opacity-80">Avg Resolution</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Active Tickets" subtitle={`${displayTickets.length} total · sorted by priority`} />
          {isLoadingDisplay ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded animate-pulse" style={{ background: "#F5F7FA" }} />
              ))}
            </div>
          ) : displayTickets.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#2BAE8E" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No tickets match your filters</p>
            </div>
          ) : (
            <Table
              data={displayTickets}
              keyExtractor={(t) => t.id}
              columns={[
                { key: "id", header: "ID", render: (t) => <span className="font-mono text-xs" style={{ color: "#2BAE8E" }}>{t.id}</span> },
                { key: "title", header: "Issue", render: (t) => <span className="text-sm">{t.title}</span> },
                { key: "unit_label", header: "Unit", render: (t) => <span className="text-xs" style={{ color: "#64748B" }}>{t.unit_label || "—"}</span> },
                { key: "category", header: "Category", render: (t) => t.category ? <Badge variant="gray">{t.category}</Badge> : <span style={{ color: "#64748B" }}>—</span> },
                { key: "priority", header: "Priority", render: (t) => <Badge variant={PRIORITY_CONFIG[t.priority]?.badge || "gray"}>{t.priority}</Badge> },
                { key: "status", header: "Status", render: (t) => <Badge variant={STATUS_BADGE[t.status] || "gray"}>{t.status.replace("_", " ")}</Badge> },
                { key: "assigned_name", header: "Assigned", render: (t) => <span className="text-xs">{t.assigned_name || "—"}</span> },
              ]}
            />
          )}
        </Card>
        <Card>
          <CardHeader title="AMC Monitor" subtitle={`${AMC_DATA.filter(a => a.status === "active").length} active · ${AMC_DATA.filter(a => a.status === "expired").length} expired`} />
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {AMC_DATA.map((amc, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm" style={{ color: "#1A2E44" }}>{amc.vendor}</span>
                  <Badge variant={amc.status === "active" ? "teal" : "red"}>{amc.status}</Badge>
                </div>
                <div className="text-xs" style={{ color: "#64748B" }}>
                  {amc.asset} · Exp: {amc.expiry}
                  <span className="ml-1 font-medium" style={{ color: amc.days < 0 ? "#E53E3E" : "#F5A623" }}>
                    {amc.days > 0 ? `(${amc.days}d left)` : `(${Math.abs(amc.days)}d overdue)`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Preventive Maintenance Schedule" subtitle="Auto-generated" />
        <Table
          data={PREVENTIVE_SCHEDULE}
          keyExtractor={(_, i) => String(i)}
          columns={[
            { key: "task", header: "Task" }, { key: "asset", header: "Asset" },
            { key: "freq", header: "Frequency" }, { key: "last", header: "Last Done" },
            { key: "next", header: "Next Due" },
            { key: "status", header: "Status", render: (t) => (
              <Badge variant={t.status === "Overdue" ? "red" : t.status === "Due Today" ? "amber" : "teal"}>{t.status}</Badge>
            )},
          ]}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Parts Inventory" subtitle={`${PARTS_INVENTORY.length} items · ${lowStockCount} low stock`} />
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {PARTS_INVENTORY.map((part, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" style={{ color: part.stock <= part.min ? "#E53E3E" : "#2BAE8E" }} />
                      <span className="font-medium text-sm" style={{ color: "#1A2E44" }}>{part.name}</span>
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>SKU: {part.sku} · {part.category}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color: part.stock <= part.min ? "#E53E3E" : part.stock <= part.min * 1.5 ? "#F5A623" : "#2BAE8E" }}>
                      {part.stock}
                    </span>
                    <span className="text-[10px] ml-0.5" style={{ color: "#94A3B8" }}>{part.unit}</span>
                  </div>
                </div>
                <StockBar current={part.stock} min={part.min} max={part.max} />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: "#94A3B8" }}>
                  <span>Reorder at: {part.min}</span>
                  <span>Max: {part.max}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Maintenance Team" subtitle={`${availableStaff}/${totalStaff} available · ${TEAM_MEMBERS.filter(m => m.status === "busy").length} busy`} />
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {TEAM_MEMBERS.map((member, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: member.status === "available" ? "#2BAE8E" : member.status === "busy" ? "#F5A623" : "#CBD5E1" }}>
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm" style={{ color: "#1A2E44" }}>{member.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: TEAM_STATUS_BG[member.status], color: TEAM_STATUS_COLOR[member.status] }}>
                        {member.status}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "#64748B" }}>{member.role} · {member.department}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px]" style={{ color: "#94A3B8" }}>
                  <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> {member.tickets} tickets</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {member.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Vendor Performance" subtitle={`Avg rating: ${avgVendorRating} ⭐ · ${VENDOR_PERFORMANCE.length} vendors`} />
          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {VENDOR_PERFORMANCE.map((vendor, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
                      <span className="font-medium text-sm" style={{ color: "#1A2E44" }}>{vendor.name}</span>
                    </div>
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>{vendor.category} · {vendor.avg_cost}/visit</span>
                  </div>
                  <StarRating rating={vendor.rating} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="px-2 py-1.5 rounded" style={{ background: "#FFFFFF" }}>
                    <div className="text-xs font-bold" style={{ color: "#1A3C5E" }}>{vendor.response_time}</div>
                    <div className="text-[9px]" style={{ color: "#94A3B8" }}>Response</div>
                  </div>
                  <div className="px-2 py-1.5 rounded" style={{ background: "#FFFFFF" }}>
                    <div className="text-xs font-bold" style={{ color: "#1A3C5E" }}>{vendor.completed}</div>
                    <div className="text-[9px]" style={{ color: "#94A3B8" }}>Jobs</div>
                  </div>
                  <div className="px-2 py-1.5 rounded" style={{ background: "#FFFFFF" }}>
                    <div className="text-xs font-bold" style={{ color: vendor.rating >= 4.5 ? "#2BAE8E" : vendor.rating >= 4 ? "#F5A623" : "#E53E3E" }}>
                      {vendor.rating}
                    </div>
                    <div className="text-[9px]" style={{ color: "#94A3B8" }}>Rating</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 opacity-80" />
            <span className="text-xs opacity-80">Total Parts</span>
          </div>
          <div className="text-2xl font-bold">{totalPartsValue}</div>
          <div className="text-xs mt-1 opacity-70">{lowStockCount} items below reorder point</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 opacity-80" />
            <span className="text-xs opacity-80">Team Available</span>
          </div>
          <div className="text-2xl font-bold">{availableStaff}/{totalStaff}</div>
          <div className="text-xs mt-1 opacity-70">{TEAM_MEMBERS.filter(m => m.status === "busy").length} currently busy</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#F5A623" }}>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 opacity-80" />
            <span className="text-xs opacity-80">Avg Vendor Rating</span>
          </div>
          <div className="text-2xl font-bold">{avgVendorRating}</div>
          <div className="text-xs mt-1 opacity-70">Across {VENDOR_PERFORMANCE.length} vendors</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#7C3AED" }}>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 opacity-80" />
            <span className="text-xs opacity-80">Weekly Total</span>
          </div>
          <div className="text-2xl font-bold">{totalTicketsThisWeek}</div>
          <div className="text-xs mt-1 opacity-70">Peak: {peakDay.day} ({peakDay.tickets})</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Weekly Workload Chart"
          subtitle={`${totalTicketsThisWeek} tickets · ${totalCompletedThisWeek} completed (${Math.round((totalCompletedThisWeek / totalTicketsThisWeek) * 100)}% completion)`}
        />
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between gap-3" style={{ height: 180 }}>
            {WEEKLY_WORKLOAD.map((day, i) => {
              const maxTickets = Math.max(...WEEKLY_WORKLOAD.map((d) => d.tickets));
              const ticketHeight = (day.tickets / maxTickets) * 100;
              const completedHeight = (day.completed / maxTickets) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="flex items-center gap-0.5 text-[9px] font-medium" style={{ color: "#64748B" }}>
                    <span>{day.tickets}</span>
                    <span style={{ color: "#CBD5E1" }}>/</span>
                    <span>{day.completed}</span>
                  </div>
                  <div className="relative w-full max-w-[36px] flex gap-0.5 items-end" style={{ height: `${Math.max(ticketHeight, 4)}%` }}>
                    <div
                      className="w-1/2 rounded-t-sm transition-all"
                      style={{ height: "100%", background: "#1A3C5E", opacity: 0.8 }}
                    />
                    <div
                      className="w-1/2 rounded-t-sm transition-all"
                      style={{ height: `${(completedHeight / ticketHeight) * 100}%`, background: "#2BAE8E" }}
                    />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: "#94A3B8" }}>{day.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: "#F5F7FA" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: "#1A3C5E", opacity: 0.8 }} />
              <span className="text-xs" style={{ color: "#64748B" }}>Tickets Raised</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: "#2BAE8E" }} />
              <span className="text-xs" style={{ color: "#64748B" }}>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
              <span className="text-xs" style={{ color: "#64748B" }}>This week</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
