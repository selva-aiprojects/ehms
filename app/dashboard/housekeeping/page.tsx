"use client";

import { useState, useEffect } from "react";
import { Sparkles, MapPin, Clock, AlertCircle, Loader2, RefreshCw, CheckCircle, Plus, ClipboardList, Layers, Users, Calendar, Star, Wrench } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useHousekeeping } from "@/lib/hooks";
import { useUpdateHousekeepingTask, useCreateHousekeepingTask } from "@/lib/hooks/mutations";

import CreateTaskModal from "./components/CreateTaskModal";
import TaskChecklistModal from "./components/TaskChecklistModal";

const PRIORITY_BADGE: Record<string, "red" | "amber" | "gray" | "teal"> = {
  critical: "red", high: "amber", medium: "gray", low: "teal",
};

const STATUS_DOT: Record<string, string> = {
  open: "var(--color-text-muted)", assigned: "var(--color-navy)", in_progress: "var(--color-warning)", resolved: "var(--color-primary)", completed: "var(--color-primary)", closed: "var(--color-text-muted)",
};

function StatusDot({ status }: { status: string }) {
  return <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: STATUS_DOT[status] || "var(--color-text-muted)" }} />;
}

function SkeletonStatBox() {
  return <div className="rounded-xl p-4 animate-pulse" style={{ background: "var(--color-border)" }}><div className="w-12 h-8 rounded mb-2" style={{ background: "var(--color-border-strong)" }} /><div className="w-20 h-3 rounded" style={{ background: "var(--color-border-strong)" }} /></div>;
}

function SkeletonTaskRow() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg animate-pulse" style={{ background: "var(--color-light)" }}>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-border)" }} />
        <div><div className="w-24 h-4 rounded mb-1" style={{ background: "var(--color-border)" }} /><div className="w-32 h-3 rounded" style={{ background: "var(--color-border)" }} /></div>
      </div>
      <div className="w-12 h-6 rounded" style={{ background: "var(--color-border)" }} />
    </div>
  );
}

export default function HousekeepingPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [applyingTask, setApplyingTask] = useState<string | null>(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedChecklistTask, setSelectedChecklistTask] = useState<any | null>(null);

  const { tasks, isLoading, isError, mutate } = useHousekeeping({ status: statusFilter });
  const updateTask = useUpdateHousekeepingTask();
  const createTask = useCreateHousekeepingTask();

  const displayTasks = tasks || [];
  const isLoadingDisplay = isLoading && !tasks;

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  if (isLoadingDisplay) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--color-text-muted)] text-sm font-medium">Loading Housekeeping Operations...</p>
        </div>
      </div>
    );
  }

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

  async function handleCreateTaskSubmit(data: any) {
    setActionFeedback(null);
    try {
      await createTask.trigger(data);
      setActionFeedback({ type: "success", message: "New task dispatched successfully" });
      mutate();
    } catch {
      setActionFeedback({ type: "error", message: "Failed to dispatch task" });
      throw new Error("Failed to dispatch task");
    }
  }

  function handleCreateTask() {
    setShowCreateTaskModal(true);
  }

  const floorSummary = [...new Set(displayTasks.map((t: any) => t.unit?.floor || t.unit?.floor_number || t.floor || t.floor_number || 0))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Housekeeping Operations</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Oceanview Hotel · {new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "var(--color-light)", color: "var(--color-text-muted)" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          {isError && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(var(--color-danger-rgb),0.08)", color: "var(--color-danger)" }}>
              <AlertCircle className="w-3 h-3" /> Offline
            </div>
          )}
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <Sparkles className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            <span><strong>{displayTasks.length}</strong> tasks · <strong>8</strong> staff</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCreateTask}>
            <Plus className="w-3.5 h-3.5" /> New Task
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.1)" : "rgba(var(--color-danger-rgb),0.08)",
            color: actionFeedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.2)" : "rgba(var(--color-danger-rgb),0.2)"}`,
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
            <div className="rounded-xl p-4" style={{ background: "var(--color-warning)" }}>
              <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{openTasks}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(0,0,0,0.6)" }}>Open Tasks</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-primary)" }}>
              <div className="text-2xl font-bold">{inProgressTasks}</div>
              <div className="text-xs mt-1 opacity-80">In Progress</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-navy)" }}>
              <div className="text-2xl font-bold">{resolvedTasks}</div>
              <div className="text-xs mt-1 opacity-80">Completed Today</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: criticalCount > 0 ? "var(--color-danger)" : "var(--color-primary)" }}>
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
              background: (s === "all" && !statusFilter) || statusFilter === s ? "var(--color-navy)" : "var(--color-light)",
              color: (s === "all" && !statusFilter) || statusFilter === s ? "var(--color-white)" : "var(--color-text-muted)",
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
                <ClipboardList className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No tasks assigned to you</p>
              </div>
            ) : (
              myTasks.map((task: any, i: number) => (
                <div key={task.id || i} className="flex items-center justify-between p-3 rounded-lg transition-all" style={{ background: i % 2 === 0 ? "var(--color-light)" : "transparent" }}>
                  <div className="flex items-center gap-3">
                    <StatusDot status={task.status} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: "var(--color-text)" }}>Room {task.unit?.unit_label || task.unit_label}</span>
                        <Badge variant={PRIORITY_BADGE[task.priority] || "gray"}>{task.priority}</Badge>
                        {task.task_type && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(var(--color-primary-dark-rgb),0.1)", color: "var(--color-primary)" }}>
                            {task.task_type.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {(task.unit?.floor || task.unit?.floor_number || task.floor || task.floor_number) && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Floor {task.unit?.floor || task.unit?.floor_number || task.floor || task.floor_number}</span>
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
                      <Button variant="ghost" size="sm" onClick={() => setSelectedChecklistTask(task)} disabled={applyingTask === task.id}>
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
                <div key={i} className="flex items-center justify-between p-3 rounded-lg animate-pulse" style={{ background: "var(--color-light)" }}>
                  <div><div className="w-16 h-4 rounded mb-1" style={{ background: "var(--color-border)" }} /><div className="w-24 h-3 rounded" style={{ background: "var(--color-border)" }} /></div>
                  <div className="w-10 h-5 rounded" style={{ background: "var(--color-border)" }} />
                </div>
              ))
            ) : floorSummary.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No floor data available</p>
              </div>
            ) : (
              (floorSummary as any[]).map((fl) => {
                const floorTasks = displayTasks.filter((t: any) => (t.unit?.floor || t.unit?.floor_number || t.floor || t.floor_number || 0) === fl);
                const pending = floorTasks.filter((t: any) => t.status !== "resolved" && t.status !== "completed").length;
                const total = floorTasks.length;
                return (
                  <div key={fl} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                    <div>
                      <div className="font-medium text-sm" style={{ color: "var(--color-text)" }}>Floor {fl}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
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
            { stage: "In Use", count: "450", color: "var(--color-primary)" },
            { stage: "Soiled", count: "120", color: "var(--color-warning)" },
            { stage: "Dispatched", count: "200", color: "var(--color-navy)" },
            { stage: "Received", count: "180", color: "var(--color-primary)" },
            { stage: "Scrapped", count: "12", color: "var(--color-danger)" },
          ].map((s, i) => (
            <div key={s.stage} className="text-center flex-1 min-w-[80px] py-2" style={{ borderRight: i < 4 ? "1px solid var(--color-border)" : "none" }}>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.count}</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.stage}</div>
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
            <div key={staff.name} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: i % 2 === 0 ? "var(--color-light)" : "transparent" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: staff.name === "You" ? "var(--color-primary)" : "var(--color-navy)" }}>
                  {staff.name[0]}
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
                    {staff.name}
                    {staff.name === "You" && <span className="ml-1.5"><Badge variant="teal">Me</Badge></span>}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {staff.completed} done, {staff.rooms} assigned
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <Star className="w-3 h-3" style={{ color: "var(--color-warning)" }} />
                  {staff.rating}
                </div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: staff.efficiency >= 90 ? "rgba(var(--color-primary-dark-rgb),0.1)" : staff.efficiency >= 80 ? "rgba(var(--color-warning-rgb),0.1)" : "rgba(var(--color-danger-rgb),0.1)", color: staff.efficiency >= 90 ? "var(--color-primary)" : staff.efficiency >= 80 ? "var(--color-gold-dark)" : "var(--color-danger)" }}>
                  {staff.efficiency}%
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-2.5 mt-2 rounded-lg" style={{ background: "rgba(var(--color-primary-dark-rgb),0.08)" }}>
            <span className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>Team Total</span>
            <div className="flex items-center gap-3 text-xs">
              <span style={{ color: "var(--color-text-muted)" }}>28 rooms assigned</span>
              <span className="font-medium" style={{ color: "var(--color-navy)" }}>20 completed</span>
              <span style={{ color: "var(--color-text-muted)" }}>Avg 4.6 rating</span>
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
              {i < 10 && <div className="absolute left-[7px] top-4 bottom-0 w-0.5" style={{ background: "var(--color-border)" }} />}
              <div className="shrink-0 mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: i < 6 ? "var(--color-primary)" : "var(--color-navy)", background: i < 6 ? "rgba(var(--color-primary-dark-rgb),0.15)" : "rgba(var(--color-navy-rgb),0.15)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: i < 6 ? "var(--color-primary)" : "var(--color-navy)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium shrink-0" style={{ color: "var(--color-text-muted)", width: "60px" }}>{item.time}</span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{item.event}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)", marginLeft: "68px" }}>
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
              <div className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: "var(--color-navy)" }}>
                <CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
                {section.category}
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <label key={item.label} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50" style={{ background: item.checked ? "rgba(var(--color-primary-dark-rgb),0.04)" : "var(--color-light)" }}>
                    <input type="checkbox" checked={item.checked} readOnly className="w-4 h-4 rounded accent-teal-600" />
                    <span className="text-sm" style={{ color: item.checked ? "var(--color-text)" : "var(--color-text-muted)", textDecoration: item.checked ? "line-through" : "none" }}>
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
            <div key={eq.name} className="p-3.5 rounded-lg" style={{ background: "var(--color-light)" }}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-navy-rgb),0.1)" }}>
                    <Wrench className="w-4 h-4" style={{ color: "var(--color-navy)" }} />
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: "var(--color-text)" }}>{eq.name}</div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Total: {eq.total}</div>
                  </div>
                </div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: eq.broken > 0 ? "rgba(var(--color-danger-rgb),0.1)" : eq.maintenance > 0 ? "rgba(var(--color-warning-rgb),0.1)" : "rgba(var(--color-primary-dark-rgb),0.1)", color: eq.broken > 0 ? "var(--color-danger)" : eq.maintenance > 0 ? "var(--color-gold-dark)" : "var(--color-primary)" }}>
                  {eq.broken > 0 ? `${eq.broken} Broken` : eq.maintenance > 0 ? `${eq.maintenance} Maint` : "Operational"}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} />
                  <span>{eq.operational} operational</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-warning)" }} />
                  <span>{eq.maintenance} maintenance</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-danger)" }} />
                  <span>{eq.broken} broken</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onSubmit={handleCreateTaskSubmit}
      />

      <TaskChecklistModal
        isOpen={selectedChecklistTask !== null}
        onClose={() => setSelectedChecklistTask(null)}
        task={selectedChecklistTask}
        onResolve={async (taskId) => {
          await updateTask.trigger(taskId, { status: "resolved" });
          setActionFeedback({ type: "success", message: `Task marked as resolved` });
          mutate();
        }}
      />
    </div>
  );
}
