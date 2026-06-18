"use client";

import { Wrench, AlertTriangle } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";

const tickets = [
  { ticket: "MNT-001", title: "AC not cooling", asset: "AC #1204-01", unit: "1204", priority: "critical", status: "in_progress", assigned: "Ravi M.", created: "18 Jun 9:30 AM" },
  { ticket: "MNT-002", title: "Geyser leakage", asset: "Geyser #305-01", unit: "305", priority: "high", status: "open", assigned: "Suresh K.", created: "18 Jun 10:15 AM" },
  { ticket: "MNT-003", title: "TV not powering on", asset: "TV #203-01", unit: "203", priority: "medium", status: "open", assigned: "Unassigned", created: "18 Jun 11:00 AM" },
  { ticket: "MNT-004", title: "HVAC Preventive (90d)", asset: "HVAC System A", unit: "Common", priority: "low", status: "open", assigned: "Team A", created: "18 Jun 6:00 AM" },
  { ticket: "MNT-005", title: "Door lock jammed", asset: "Lock #102-01", unit: "102", priority: "high", status: "resolved", assigned: "Ravi M.", created: "17 Jun 2:00 PM" },
];

const statusBadge = (s: string) => {
  const map: Record<string, "red" | "amber" | "teal" | "gray"> = { open: "red", in_progress: "amber", resolved: "teal", closed: "gray" };
  return <Badge variant={map[s] || "gray"}>{s.replace("_", " ")}</Badge>;
};

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Maintenance & Asset Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>All properties · Real-time ticket dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: "#F5A623", color: "#1A2E44" }}>
            <AlertTriangle className="w-3.5 h-3.5" /> 2 Critical
          </div>
          <Button variant="secondary" size="sm"><Wrench className="w-3.5 h-3.5" /> New Ticket</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Open", value: "8", color: "#E53E3E" },
          { label: "In Progress", value: "3", color: "#F5A623" },
          { label: "Resolved Today", value: "5", color: "#2BAE8E" },
          { label: "Avg Resolution", value: "4.2h", color: "#1A3C5E" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 text-white" style={{ background: s.color }}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Active Tickets" subtitle="Sorted by priority" />
          <Table
            data={tickets}
            keyExtractor={(t) => t.ticket}
            columns={[
              { key: "ticket", header: "ID", render: (t) => <span className="font-mono text-xs" style={{ color: "#2BAE8E" }}>{t.ticket}</span> },
              { key: "title", header: "Issue" },
              { key: "unit", header: "Unit" },
              { key: "priority", header: "Priority", render: (t) => <Badge variant={t.priority === "critical" ? "red" : t.priority === "high" ? "amber" : "gray"}>{t.priority}</Badge> },
              { key: "status", header: "Status", render: (t) => statusBadge(t.status) },
              { key: "assigned", header: "Assigned" },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="AMC Monitor" subtitle="Annual Maintenance Contracts" />
          <div className="space-y-3">
            {[
              { vendor: "CoolTech HVAC", asset: "HVAC Systems", expiry: "15 Aug 2026", days: 58, status: "active" },
              { vendor: "SafeLock Inc.", asset: "Smart Locks", expiry: "02 Mar 2026", days: -108, status: "expired" },
              { vendor: "ElectroCare", asset: "Electrical", expiry: "20 Sep 2026", days: 94, status: "active" },
              { vendor: "PlumbPro", asset: "Plumbing", expiry: "05 Jul 2026", days: 17, status: "active" },
            ].map((amc, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm" style={{ color: "#1A2E44" }}>{amc.vendor}</span>
                  <Badge variant={amc.status === "active" ? "teal" : "red"}>{amc.status}</Badge>
                </div>
                <div className="text-xs" style={{ color: "#64748B" }}>
                  {amc.asset} · Exp: {amc.expiry} {amc.days > 0 ? `(${amc.days}d left)` : `(${Math.abs(amc.days)}d overdue)`}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Preventive Maintenance Schedule" subtitle="Auto-generated" />
        <Table
          data={[
            { task: "HVAC Service", asset: "System A", freq: "90 days", last: "20 Mar 2026", next: "18 Jun 2026", status: "Due Today" },
            { task: "Fire Alarm Test", asset: "Building A", freq: "30 days", last: "18 May 2026", next: "17 Jun 2026", status: "Overdue" },
            { task: "Generator Check", asset: "Gen-01", freq: "60 days", last: "20 Apr 2026", next: "19 Jun 2026", status: "Tomorrow" },
          ]}
          keyExtractor={(_, i) => String(i)}
          columns={[
            { key: "task", header: "Task" }, { key: "asset", header: "Asset" },
            { key: "freq", header: "Frequency" }, { key: "last", header: "Last Done" },
            { key: "next", header: "Next Due" },
            { key: "status", header: "Status", render: (t) => <Badge variant={t.status === "Overdue" ? "red" : "amber"}>{t.status}</Badge> },
          ]}
        />
      </Card>
    </div>
  );
}
