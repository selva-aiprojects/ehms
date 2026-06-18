"use client";

import { Sparkles, MapPin, Clock } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

const tasks = [
  { room: "1204", type: "VIP Arrival", priority: "critical", floor: 10, assigned: "You", status: "in_progress", time: "Due 2:00 PM" },
  { room: "203", type: "Checkout Clean", priority: "high", floor: 2, assigned: "You", status: "open", time: "Due 1:00 PM" },
  { room: "105", type: "Stayover Tidy", priority: "medium", floor: 1, assigned: "You", status: "open", time: "Due 3:00 PM" },
  { room: "304", type: "Deep Clean", priority: "low", floor: 3, assigned: "You", status: "open", time: "Due 5:00 PM" },
  { room: "102", type: "Turnaround", priority: "high", floor: 1, assigned: "Ravi", status: "open", time: "Due 1:30 PM" },
  { room: "201", type: "Stayover Tidy", priority: "medium", floor: 2, assigned: "Sita", status: "in_progress", time: "Due 2:30 PM" },
];

const statusDot = (s: string) => {
  const styles: Record<string, string> = { open: "#64748B", in_progress: "#F5A623", completed: "#2BAE8E" };
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: styles[s] || "#64748B" }} />;
};

export default function HousekeepingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Housekeeping Operations</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Oceanview Hotel · 18 Jun 2026</p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
          <Sparkles className="w-4 h-4" style={{ color: "#2BAE8E" }} />
          <span><strong>12</strong> rooms · <strong>8</strong> staff</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Dirty Rooms", value: "8", bg: "#F5A623", text: "#1A2E44" },
          { label: "In Progress", value: "3", bg: "#2BAE8E" },
          { label: "Ready / Inspected", value: "24", bg: "#1A3C5E" },
          { label: "Maintenance Hold", value: "2", bg: "#E53E3E" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: s.bg }}>
            <div className="text-2xl font-bold" style={{ color: s.text || "#FFFFFF" }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: s.text || "rgba(255,255,255,0.8)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="My Tasks" subtitle="Sorted by floor & priority" />
          <div className="space-y-2">
            {tasks.filter(t => t.assigned === "You").map((task, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg transition-all" style={{ background: i % 2 === 0 ? "#F5F7FA" : "transparent" }}>
                <div className="flex items-center gap-3">
                  {statusDot(task.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: "#1A2E44" }}>Room {task.room}</span>
                      <Badge variant={task.priority === "critical" ? "red" : task.priority === "high" ? "amber" : "gray"}>{task.priority}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: "#64748B" }}>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Floor {task.floor}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.time}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">{task.status === "in_progress" ? "Resume" : "Start"}</Button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Floor Summary" subtitle="Staff location & room status" />
          <div className="space-y-3">
            {[10, 2, 1, 3].map((fl) => (
              <div key={fl} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div>
                  <div className="font-medium text-sm" style={{ color: "#1A2E44" }}>Floor {fl}</div>
                  <div className="text-xs" style={{ color: "#64748B" }}>{fl === 10 ? "1 staff · VIP priority" : `${fl === 2 ? 3 : 2} rooms pending`}</div>
                </div>
                <Badge variant="teal">{["4","8","6","5"][fl===10?0:fl===2?1:fl===1?2:3]}/6</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Linen Lifecycle Ledger" subtitle="Batch: L-2024-06-18" />
        <div className="flex items-center justify-between text-sm">
          {[
            { stage: "In Use", count: "450", color: "#2BAE8E" },
            { stage: "Soiled", count: "120", color: "#F5A623" },
            { stage: "Dispatched", count: "200", color: "#1A3C5E" },
            { stage: "Received", count: "180", color: "#2BAE8E" },
            { stage: "Scrapped", count: "12", color: "#E53E3E" },
          ].map((s, i) => (
            <div key={s.stage} className="text-center flex-1" style={{ borderRight: i < 4 ? "1px solid #E2E8F0" : "none" }}>
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.count}</div>
              <div className="text-xs" style={{ color: "#64748B" }}>{s.stage}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
