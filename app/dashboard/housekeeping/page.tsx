"use client";

import { useState, useEffect } from "react";
import { Sparkles, MapPin, Clock, AlertCircle, Loader2, RefreshCw, CheckCircle, Plus, ClipboardList, Layers, Users, Calendar, Star, Wrench } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useHousekeeping } from "@/lib/hooks";
import { useUpdateHousekeepingTask, useCreateHousekeepingTask } from "@/lib/hooks/mutations";

const MOCK_TASKS = [
  { id: "hk-1", unit_label: "1204", task_type: "VIP Arrival", priority: "critical", floor: 10, assigned_name: "You", status: "in_progress", scheduled_at: new Date().toISOString(), notes: "Prepare VIP amenities" },
  { id: "hk-2", unit_label: "203", task_type: "Checkout Clean", priority: "high", floor: 2, assigned_name: "You", status: "open", scheduled_at: new Date(Date.now() + 3600000).toISOString(), notes: "" },
  { id: "hk-3", unit_label: "105", task_type: "Stayover Tidy", priority: "medium", floor: 1, assigned_name: "You", status: "open", scheduled_at: new Date(Date.now() + 7200000).toISOString(), notes: "" },
  { id: "hk-4", unit_label: "304", task_type: "Deep Clean", priority: "low", floor: 3, assigned_name: "You", status: "open", scheduled_at: new Date(Date.now() + 10800000).toISOString(), notes: "Use eco-friendly products" },
  { id: "hk-5", unit_label: "102", task_type: "Turnaround", priority: "high", floor: 1, assigned_name: "Ravi", status: "open", scheduled_at: new Date(Date.now() + 1800000).toISOString(), notes: "" },
  { id: "hk-6", unit_label: "201", task_type: "Stayover Tidy", priority: "medium", floor: 2, assigned_name: "Sita", status: "in_progress", scheduled_at: new Date(Date.now() + 5400000).toISOString(), notes: "" },
  { id: "hk-7", unit_label: "401", task_type: "Inspection", priority: "critical", floor: 4, assigned_name: "You", status: "assigned", scheduled_at: new Date(Date.now() + 900000).toISOString(), notes: "GM arrival tomorrow" },
  { id: "hk-8", unit_label: "106", task_type: "Evening Turndown", priority: "low", floor: 1, assigned_name: "You", status: "open", scheduled_at: new Date(Date.now() + 14400000).toISOString(), notes: "" },
];

const PRIORITY_BADGE: Record<string, "red" | "amber" | "gray" | "teal"> = {
  critical: "red", high: "amber", medium: "gray", low: "teal",
};

const STATUS_DOT: Record<string, string> = {
  open: "#64748B", assigned: "#1A3C5E", in_progress: "#F5A623", resolved: "#2BAE8E", completed: "#2BAE8E", closed: "#64748B",
};

function StatusDot({ status }: { status: string }) {
  return <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: STATUS_DOT[status] || "#64748B" }} />;
}

function SkeletonStatBox() {
  return <div className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}><div className="w-12 h-8 rounded mb-2" style={{ background: "#CBD5E1" }} /><div className="w-20 h-3 rounded" style={{ background: "#CBD5E1" }} /></div>;
}

function SkeletonTaskRow() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg animate-pulse" style={{ background: "#F5F7FA" }}>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ background: "#E2E8F0" }} />
        <div><div className="w-24 h-4 rounded mb-1" style={{ background: "#E2E8F0" }} /><div className="w-32 h-3 rounded" style={{ background: "#E2E8F0" }} /></div>
      </div>
      <div className="w-12 h-6 rounded" style={{ background: "#E2E8F0" }} />
    </div>
  );
}

export default function HousekeepingPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [applyingTask, setApplyingTask] = useState<string | null>(null);

  const { tasks, isLoading, isError, mutate } = useHousekeeping({ status: statusFilter });
  const updateTask = useUpdateHousekeepingTask();
  const createTask = useCreateHousekeepingTask();

  const displayTasks = tasks || [];
  const isLoadingDisplay = isLoading && !tasks;

  if (isLoadingDisplay) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2BAE8E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#64748B] text-sm font-medium">Loading Housekeeping Operations...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const myTasks = displayTasks.filter((t) => t.assignee?.first_name === "You" || !t.assignee || t.assignee?.first_name === "You");
  const openTasks = displayTasks.filter((t) => t.status === "open").length;
  const inProgressTasks = displayTasks.filter((t) => t.status === "in_progress").length;
  const resolvedTasks = displayTasks.filter((t) => t.status === "resolved" || t.status === "completed").length;
  const criticalCount = displayTasks.filter((t) => t.priority === "critical" && t.status !== "resolved" && t.status !== "completed").length;

  function formatTime(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return dateStr;
    }
  }

  async function handleTaskAction(task: any, newStatus: string) {
    setApplyingTask(task.id);
    setActionFeedback(null);
    try {
      await updateTask.trigger(task.id, { status: newStatus });
      setActionFeedback({ type: "success", message: `Task for ${task.unit?.unit_label || 'Room'} → ${newStatus.replace("_", " ")}` });
      mutate();
    } catch {
      setActionFeedback({ type: "error", message: `Failed to update task ${task.unit?.unit_label || 'Room'}` });
    } finally {
      setApplyingTask(null);
    }
  }

  async function handleCreateTask() {
    setActionFeedback(null);
    try {
      await createTask.trigger({
        unit_id: "",
        property_id: "",
        task_type: "inspection",
        priority: "medium",
        notes: "Auto-generated task",
      });
      setActionFeedback({ type: "success", message: "New task created" });
      mutate();
    } catch {
      setActionFeedback({ type: "error", message: "Failed to create task" });
    }
  }

  const floorSummary = [...new Set(displayTasks.map((t) => t.floor || t.floor_number || 0))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Housekeeping Operations</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Oceanview Hotel · {new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          {isError && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E" }}>
              <AlertCircle className="w-3 h-3" /> Offline
            </div>
          )}
          <div className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
            <Sparkles className="w-4 h-4" style={{ color: "#2BAE8E" }} />
            <span><strong>{displayTasks.length}</strong> tasks · <strong>8</strong> staff</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCreateTask}>
            <Plus className="w-3.5 h-3.5" /> New Task
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoadingDisplay ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatBox key={i} />)
        ) : (
          <>
            <div className="rounded-xl p-4" style={{ background: "#F5A623" }}>
              <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>{openTasks}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(0,0,0,0.6)" }}>Open Tasks</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
              <div className="text-2xl font-bold">{inProgressTasks}</div>
              <div className="text-xs mt-1 opacity-80">In Progress</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
              <div className="text-2xl font-bold">{resolvedTasks}</div>
              <div className="text-xs mt-1 opacity-80">Completed Today</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: criticalCount > 0 ? "#E53E3E" : "#2BAE8E" }}>
              <div className="text-2xl font-bold">{criticalCount}</div>
              <div className="text-xs mt-1 opacity-80">Critical Priority</div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["all", "open", "in_progress", "resolved"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s === "all" ? undefined : s)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              background: (s === "all" && !statusFilter) || statusFilter === s ? "#1A3C5E" : "#F5F7FA",
              color: (s === "all" && !statusFilter) || statusFilter === s ? "#FFFFFF" : "#64748B",
            }}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="My Tasks" subtitle="Sorted by floor & priority" />
          <div className="space-y-2">
            {isLoadingDisplay ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonTaskRow key={i} />)
            ) : myTasks.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
                <p className="text-sm" style={{ color: "#64748B" }}>No tasks assigned to you</p>
              </div>
            ) : (
              myTasks.map((task: any, i: number) => (
                <div key={task.id || i} className="flex items-center justify-between p-3 rounded-lg transition-all" style={{ background: i % 2 === 0 ? "#F5F7FA" : "transparent" }}>
                  <div className="flex items-center gap-3">
                    <StatusDot status={task.status} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: "#1A2E44" }}>Room {task.unit?.unit_label || task.unit_label}</span>
                        <Badge variant={PRIORITY_BADGE[task.priority] || "gray"}>{task.priority}</Badge>
                        {task.task_type && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(42,157,143,0.1)", color: "#2BAE8E" }}>
                            {task.task_type.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: "#64748B" }}>
                        {(task.floor || task.floor_number) && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Floor {task.floor || task.floor_number}</span>
                        )}
                        {task.scheduled_at && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {formatTime(task.scheduled_at)}</span>
                        )}
                        {task.notes && <span className="italic truncate max-w-[120px]">— {task.notes}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {task.status === "open" && (
                      <Button variant="ghost" size="sm" onClick={() => handleTaskAction(task, "in_progress")} disabled={applyingTask === task.id}>
                        {applyingTask === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Start"}
                      </Button>
                    )}
                    {task.status === "in_progress" && (
                      <Button variant="ghost" size="sm" onClick={() => handleTaskAction(task, "resolved")} disabled={applyingTask === task.id}>
                        {applyingTask === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Complete"}
                      </Button>
                    )}
                    {task.status === "assigned" && (
                      <Button variant="ghost" size="sm" onClick={() => handleTaskAction(task, "in_progress")} disabled={applyingTask === task.id}>
                        {applyingTask === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Accept"}
                      </Button>
                    )}
                    {task.status === "resolved" && <Badge variant="teal">Done</Badge>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Floor Summary" subtitle="Staff location & room status" />
          <div className="space-y-3">
            {isLoadingDisplay ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg animate-pulse" style={{ background: "#F5F7FA" }}>
                  <div><div className="w-16 h-4 rounded mb-1" style={{ background: "#E2E8F0" }} /><div className="w-24 h-3 rounded" style={{ background: "#E2E8F0" }} /></div>
                  <div className="w-10 h-5 rounded" style={{ background: "#E2E8F0" }} />
                </div>
              ))
            ) : floorSummary.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
                <p className="text-sm" style={{ color: "#64748B" }}>No floor data available</p>
              </div>
            ) : (
              floorSummary.map((fl) => {
                const floorTasks = displayTasks.filter((t: any) => (t.floor || t.floor_number) === fl);
                const pending = floorTasks.filter((t: any) => t.status !== "resolved" && t.status !== "completed").length;
                const total = floorTasks.length;
                return (
                  <div key={fl} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <div>
                      <div className="font-medium text-sm" style={{ color: "#1A2E44" }}>Floor {fl}</div>
                      <div className="text-xs" style={{ color: "#64748B" }}>
                        {floorTasks.some((t: any) => t.priority === "critical") ? "⚠ Has critical tasks" : `${pending} pending · ${total} total`}
                      </div>
                    </div>
                    <Badge variant={pending > 0 ? "amber" : "teal"}>{pending}/{total}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Linen Lifecycle Ledger" subtitle={`Batch: L-${new Date().toISOString().split("T")[0]}`} />
        <div className="flex items-center justify-between text-sm flex-wrap">
          {[
            { stage: "In Use", count: "450", color: "#2BAE8E" },
            { stage: "Soiled", count: "120", color: "#F5A623" },
            { stage: "Dispatched", count: "200", color: "#1A3C5E" },
            { stage: "Received", count: "180", color: "#2BAE8E" },
            { stage: "Scrapped", count: "12", color: "#E53E3E" },
          ].map((s, i) => (
            <div key={s.stage} className="text-center flex-1 min-w-[80px] py-2" style={{ borderRight: i < 4 ? "1px solid #E2E8F0" : "none" }}>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.count}</div>
              <div className="text-xs" style={{ color: "#64748B" }}>{s.stage}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="secondary" size="sm" className="w-full" onClick={() => setStatusFilter("open")}>
            <ClipboardList className="w-3.5 h-3.5" /> View Open Tasks
          </Button>
          <Button variant="secondary" size="sm" className="w-full" onClick={handleCreateTask}>
            <Plus className="w-3.5 h-3.5" /> Assign New Task
          </Button>
          <Button variant="secondary" size="sm" className="w-full" onClick={() => mutate()}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Board
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <ClipboardList className="w-3.5 h-3.5" /> Linen Report
          </Button>
        </div>
      </Card>

      {/* Staff Performance */}
      <Card>
        <CardHeader title="Staff Performance" subtitle="Today's productivity overview" />
        <div className="space-y-2">
          {[
            { name: "You", rooms: 4, rating: 4.8, completed: 3, efficiency: 92 },
            { name: "Ravi", rooms: 3, rating: 4.5, completed: 2, efficiency: 85 },
            { name: "Sita", rooms: 5, rating: 4.9, completed: 4, efficiency: 95 },
            { name: "Anita", rooms: 2, rating: 4.3, completed: 1, efficiency: 78 },
            { name: "Vijay", rooms: 4, rating: 4.6, completed: 3, efficiency: 88 },
            { name: "Priya", rooms: 3, rating: 4.7, completed: 2, efficiency: 90 },
            { name: "Deepak", rooms: 3, rating: 4.4, completed: 2, efficiency: 82 },
            { name: "Meera", rooms: 4, rating: 4.8, completed: 3, efficiency: 91 },
          ].map((staff, i) => (
            <div key={staff.name} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: i % 2 === 0 ? "#F5F7FA" : "transparent" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: staff.name === "You" ? "#2BAE8E" : "#1A3C5E" }}>
                  {staff.name[0]}
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: "#1A2E44" }}>
                    {staff.name}
                    {staff.name === "You" && <span className="ml-1.5"><Badge variant="teal">Me</Badge></span>}
                  </div>
                  <div className="text-xs" style={{ color: "#64748B" }}>
                    {staff.completed} done, {staff.rooms} assigned
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs" style={{ color: "#64748B" }}>
                  <Star className="w-3 h-3" style={{ color: "#F5A623" }} />
                  {staff.rating}
                </div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: staff.efficiency >= 90 ? "rgba(42,157,143,0.1)" : staff.efficiency >= 80 ? "rgba(245,166,35,0.1)" : "rgba(229,62,62,0.1)", color: staff.efficiency >= 90 ? "#2BAE8E" : staff.efficiency >= 80 ? "#D69E2E" : "#E53E3E" }}>
                  {staff.efficiency}%
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-2.5 mt-2 rounded-lg" style={{ background: "rgba(42,157,143,0.08)" }}>
            <span className="text-xs font-medium" style={{ color: "#2BAE8E" }}>Team Total</span>
            <div className="flex items-center gap-3 text-xs">
              <span style={{ color: "#64748B" }}>28 rooms assigned</span>
              <span className="font-medium" style={{ color: "#1A3C5E" }}>20 completed</span>
              <span style={{ color: "#64748B" }}>Avg 4.6 rating</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader title="Today's Schedule" subtitle="Events and tasks throughout the day" />
        <div className="space-y-0">
          {[
            { time: "06:00 AM", event: "Breakfast Setup", location: "Main Kitchen" },
            { time: "07:30 AM", event: "VIP Arrival - Room 1204", location: "10th Floor" },
            { time: "08:00 AM", event: "Staff Briefing", location: "Housekeeping Office" },
            { time: "09:00 AM", event: "Checkout Cleaning Begins", location: "All Floors" },
            { time: "10:00 AM", event: "Linen Delivery", location: "Service Elevator" },
            { time: "11:00 AM", event: "Room Inspection - Floor 4", location: "4th Floor" },
            { time: "12:00 PM", event: "Lunch Break", location: "Staff Cafeteria" },
            { time: "01:00 PM", event: "Deep Clean - Room 304", location: "3rd Floor" },
            { time: "02:30 PM", event: "Supply Restock", location: "Storage Room B" },
            { time: "04:00 PM", event: "Evening Turndown Service", location: "All Floors" },
            { time: "05:00 PM", event: "End of Day Report", location: "Housekeeping Office" },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 pb-3 relative">
              {i < 10 && <div className="absolute left-[7px] top-4 bottom-0 w-0.5" style={{ background: "#E2E8F0" }} />}
              <div className="shrink-0 mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: i < 6 ? "#2BAE8E" : "#1A3C5E", background: i < 6 ? "rgba(42,157,143,0.15)" : "rgba(26,60,94,0.15)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: i < 6 ? "#2BAE8E" : "#1A3C5E" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium shrink-0" style={{ color: "#64748B", width: "60px" }}>{item.time}</span>
                  <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>{item.event}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#64748B", marginLeft: "68px" }}>
                  <MapPin className="w-3 h-3 inline mr-0.5" /> {item.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quality Checklist */}
      <Card>
        <CardHeader title="Quality Checklist" subtitle="Daily quality assurance inspection" />
        <div className="space-y-4">
          {[
            { category: "Room Readiness", items: [
              { label: "Beds made with fresh linen", checked: true },
              { label: "Bathroom sanitized and restocked", checked: true },
              { label: "Floors vacuumed and mopped", checked: true },
              { label: "Windows and mirrors streak-free", checked: false },
              { label: "AM/FM amenities replenished", checked: true },
              { label: "Mini-bar stocked and verified", checked: false },
            ]},
            { category: "Public Areas", items: [
              { label: "Lobby clean and welcoming", checked: true },
              { label: "Elevators sanitized", checked: true },
              { label: "Corridors clear of debris", checked: false },
              { label: "Restrooms stocked and clean", checked: true },
              { label: "Entry doors and handles wiped", checked: true },
            ]},
            { category: "Linen and Supplies", items: [
              { label: "Linen inventory updated", checked: true },
              { label: "Housekeeping carts stocked", checked: false },
              { label: "Cleaning agents properly labeled", checked: true },
              { label: "Guest supplies sufficient for tomorrow", checked: true },
              { label: "Uniforms laundered and stored", checked: true },
            ]},
            { category: "Special Requests", items: [
              { label: "VIP amenities prepared for 1204", checked: true },
              { label: "Extra pillows delivered to 105", checked: true },
              { label: "Crib set up in 203", checked: false },
              { label: "Late checkout notes communicated", checked: true },
              { label: "Allergy pillows sent to 401", checked: false },
            ]},
          ].map((section) => (
            <div key={section.category}>
              <div className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: "#1A3C5E" }}>
                <CheckCircle className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
                {section.category}
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <label key={item.label} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50" style={{ background: item.checked ? "rgba(42,157,143,0.04)" : "#F5F7FA" }}>
                    <input type="checkbox" checked={item.checked} readOnly className="w-4 h-4 rounded accent-teal-600" />
                    <span className="text-sm" style={{ color: item.checked ? "#1A2E44" : "#64748B", textDecoration: item.checked ? "line-through" : "none" }}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Equipment Status */}
      <Card>
        <CardHeader title="Equipment Status" subtitle="Current operational status overview" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "Vacuum Cleaners", total: 8, operational: 6, maintenance: 1, broken: 1 },
            { name: "Floor Buffers", total: 4, operational: 3, maintenance: 1, broken: 0 },
            { name: "Carpet Extractors", total: 3, operational: 2, maintenance: 0, broken: 1 },
            { name: "Housekeeping Carts", total: 12, operational: 10, maintenance: 2, broken: 0 },
            { name: "Steam Cleaners", total: 3, operational: 3, maintenance: 0, broken: 0 },
            { name: "Linen Trolleys", total: 6, operational: 5, maintenance: 1, broken: 0 },
            { name: "Pressure Washers", total: 2, operational: 1, maintenance: 0, broken: 1 },
            { name: "Air Purifiers", total: 5, operational: 4, maintenance: 1, broken: 0 },
          ].map((eq) => (
            <div key={eq.name} className="p-3.5 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.1)" }}>
                    <Wrench className="w-4 h-4" style={{ color: "#1A3C5E" }} />
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: "#1A2E44" }}>{eq.name}</div>
                    <div className="text-xs" style={{ color: "#64748B" }}>Total: {eq.total}</div>
                  </div>
                </div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: eq.broken > 0 ? "rgba(229,62,62,0.1)" : eq.maintenance > 0 ? "rgba(245,166,35,0.1)" : "rgba(42,157,143,0.1)", color: eq.broken > 0 ? "#E53E3E" : eq.maintenance > 0 ? "#D69E2E" : "#2BAE8E" }}>
                  {eq.broken > 0 ? `${eq.broken} Broken` : eq.maintenance > 0 ? `${eq.maintenance} Maint` : "Operational"}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#2BAE8E" }} />
                  <span>{eq.operational} operational</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#F5A623" }} />
                  <span>{eq.maintenance} maintenance</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#E53E3E" }} />
                  <span>{eq.broken} broken</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
