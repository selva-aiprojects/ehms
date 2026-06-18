"use client";

import { Briefcase } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";

const memberships = [
  { corporate: "Acme Corp", plan: "Hot Desk Pool", seats: 10, used: 8, status: "active", renews: "01 Jul 2026" },
  { corporate: "TechStart Inc", plan: "Dedicated Seats", seats: 5, used: 5, status: "active", renews: "15 Jul 2026" },
  { corporate: "Design Studio", plan: "Private Cabin", seats: 2, used: 1, status: "active", renews: "20 Jun 2026" },
  { corporate: "LegalWorks", plan: "Virtual Office", seats: 0, used: 0, status: "pending", renews: "—" },
];

export default function WorkplacePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Workplace & Managed Offices</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Innovate Coworking</p>
        </div>
        <Button variant="secondary" size="sm"><Briefcase className="w-3.5 h-3.5" /> New Membership</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Seat Utilization", value: "68%", color: "#2BAE8E" },
          { label: "Active Members", value: "142", color: "#1A3C5E" },
          { label: "Meeting Rooms", value: "4/6 Free", color: "#2BAE8E" },
          { label: "Monthly Revenue", value: "₹8.4L", color: "#F5A623", text: "#1A2E44" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: s.color }}>
            <div className="text-2xl font-bold" style={{ color: s.text || "#FFF" }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: s.text || "rgba(255,255,255,0.8)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Interactive Floor Plan" subtitle="GF · Hot Desks & Open Area" />
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: "D-01", status: "available" }, { id: "D-02", status: "booked", m: "Rahul" },
              { id: "D-03", status: "available" }, { id: "D-04", status: "occupied", m: "Sneha" },
              { id: "C-01", status: "available" }, { id: "C-02", status: "booked", m: "Acme" },
              { id: "MR-01", status: "occupied", m: "Design" }, { id: "MR-02", status: "available" },
              { id: "DS-01", status: "occupied", m: "Priya" }, { id: "DS-02", status: "occupied", m: "Arjun" },
            ].map((s) => (
              <div key={s.id} className="p-2 rounded-lg text-center text-xs cursor-pointer" style={{
                background: s.status === "available" ? "rgba(42,157,143,0.1)" :
                            s.status === "occupied" ? "rgba(14,36,61,0.08)" :
                            "rgba(255,193,7,0.15)",
                border: s.status === "occupied" ? "1px solid #1A3C5E" : "1px solid #E2E8F0",
              }}>
                <div className="font-semibold" style={{ color: "#1A3C5E" }}>{s.id}</div>
                <div className="text-[10px] mt-0.5 truncate" style={{ color: "#64748B" }}>{"m" in s ? (s as any).m : "Available"}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "#64748B" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#2BAE8E" }} /> Available</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#1A3C5E" }} /> Occupied</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#F5A623" }} /> Booked</span>
          </div>
        </Card>
        <Card>
          <CardHeader title="Visitor Management" subtitle="Today" />
          {[
            { name: "Ankit Jain", host: "Priya S.", time: "10:30 AM", status: "checked_in" },
            { name: "Meera Nair", host: "Arjun N.", time: "2:00 PM", status: "pre_registered" },
          ].map((v, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg mb-2" style={{ background: "#F5F7FA" }}>
              <div>
                <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{v.name}</div>
                <div className="text-xs" style={{ color: "#64748B" }}>Host: {v.host} · {v.time}</div>
              </div>
              <Badge variant={v.status === "checked_in" ? "teal" : "amber"}>{v.status.replace("_", " ")}</Badge>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full mt-2">Pre-register Visitor</Button>
        </Card>
      </div>

      <Card>
        <CardHeader title="Corporate Memberships" subtitle="Seat pooling & license billing" />
        <Table
          data={memberships}
          keyExtractor={(_, i) => String(i)}
          columns={[
            { key: "corporate", header: "Corporate" }, { key: "plan", header: "Plan" },
            { key: "seats", header: "Seats Allocated" },
            { key: "used", header: "Seats Used", render: (m) => `${m.used}/${m.seats}` },
            { key: "status", header: "Status", render: (m) => <Badge variant={m.status === "active" ? "teal" : "amber"}>{m.status}</Badge> },
            { key: "renews", header: "Renews" },
          ]}
        />
      </Card>
    </div>
  );
}
