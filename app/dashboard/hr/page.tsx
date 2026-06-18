"use client";

import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";

const employees = [
  { code: "EMP-001", name: "Rajesh Mehta", dept: "Management", role: "Property Manager", attendance: "94%", status: "active" },
  { code: "EMP-042", name: "Priya Sharma", dept: "Front Office", role: "Front Desk Exec", attendance: "97%", status: "active" },
  { code: "EMP-087", name: "Ravi Kumar", dept: "Housekeeping", role: "HK Staff", attendance: "91%", status: "active" },
  { code: "EMP-103", name: "Suresh K.", dept: "Maintenance", role: "Maint. Staff", attendance: "88%", status: "active" },
  { code: "EMP-056", name: "Anita Desai", dept: "Finance", role: "Finance Manager", attendance: "99%", status: "active" },
];

export default function HRPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>HRMS & Payroll</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Attendance, shifts, payroll & statutory compliance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: "86", color: "#1A3C5E" },
          { label: "On Duty Today", value: "52", color: "#2BAE8E" },
          { label: "On Leave", value: "8", color: "#F5A623", text: "#1A2E44" },
          { label: "Payroll MTD", value: "₹12.5L", color: "#2BAE8E" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 text-white" style={{ background: s.color }}>
            <div className="text-2xl font-bold" style={{ color: s.text || "#FFF" }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: s.text ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Employee Directory" subtitle="All properties" />
        <Table
          data={employees}
          keyExtractor={(_, i) => String(i)}
          columns={[
            { key: "code", header: "Code" }, { key: "name", header: "Name" },
            { key: "dept", header: "Department" }, { key: "role", header: "Role" },
            { key: "attendance", header: "Attendance" },
            { key: "status", header: "Status", render: () => <Badge variant="teal">Active</Badge> },
          ]}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Shift Schedule" subtitle="Today" />
          {[
            { shift: "Morning (6A - 2P)", staff: 22, dept: "HK, Kitchen, Front Desk" },
            { shift: "Afternoon (2P - 10P)", staff: 18, dept: "Front Desk, Maintenance" },
            { shift: "Night (10P - 6A)", staff: 8, dept: "Security, Night Audit" },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between py-3 text-sm" style={{ borderBottom: i < 2 ? "1px solid #E2E8F0" : "none" }}>
              <div>
                <div className="font-medium" style={{ color: "#1A2E44" }}>{s.shift}</div>
                <div className="text-xs" style={{ color: "#64748B" }}>{s.dept}</div>
              </div>
              <Badge variant="teal">{s.staff} staff</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <CardHeader title="Statutory Compliance" subtitle="This month" />
          <div className="space-y-3 text-sm">
            {[
              { label: "PF (Provident Fund)", amount: "₹1,85,000", status: "Processed" },
              { label: "ESI", amount: "₹42,000", status: "Processed" },
              { label: "Professional Tax", amount: "₹8,500", status: "Pending" },
              { label: "TDS", amount: "₹2,10,000", status: "Due" },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span style={{ color: "#1A2E44" }}>{c.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium" style={{ color: "#1A3C5E" }}>{c.amount}</span>
                  <Badge variant={c.status === "Processed" ? "teal" : c.status === "Pending" ? "amber" : "red"}>{c.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
