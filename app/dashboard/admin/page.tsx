"use client";

import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";

const users = [
  { name: "Rajesh Mehta", email: "rajesh@samp.com", role: "Property Manager", property: "Oceanview Hotel", status: "active" },
  { name: "Sneha Kapoor", email: "sneha@samp.com", role: "Property Manager", property: "Cityscape Apts", status: "active" },
  { name: "Priya Sharma", email: "priya@samp.com", role: "Front Desk", property: "Oceanview Hotel", status: "active" },
  { name: "Ravi Kumar", email: "ravi@samp.com", role: "Housekeeping Staff", property: "Oceanview Hotel", status: "active" },
  { name: "Anita Desai", email: "anita@samp.com", role: "Finance Manager", property: "Global", status: "active" },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Admin & Configuration</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Global configuration, security, audit logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="System Health" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: "#64748B" }}>API Uptime</span><span style={{ color: "#2BAE8E" }}>99.97%</span></div>
            <div className="flex justify-between"><span style={{ color: "#64748B" }}>Avg Response</span><span style={{ color: "#2BAE8E" }}>142ms</span></div>
            <div className="flex justify-between"><span style={{ color: "#64748B" }}>Active Sessions</span><span style={{ color: "#1A3C5E" }}>247</span></div>
            <div className="flex justify-between"><span style={{ color: "#64748B" }}>DB Connections</span><span style={{ color: "#1A3C5E" }}>18/50</span></div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Compliance Vault" subtitle="Certificate expiry alerts" />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span style={{ color: "#1A2E44" }}>Fire Safety</span><Badge variant="teal">Valid</Badge></div>
            <div className="flex items-center justify-between"><span style={{ color: "#1A2E44" }}>Liquor License</span><Badge variant="amber">30d left</Badge></div>
            <div className="flex items-center justify-between"><span style={{ color: "#1A2E44" }}>RERA Registration</span><Badge variant="teal">Valid</Badge></div>
            <div className="flex items-center justify-between"><span style={{ color: "#1A2E44" }}>Pollution Clearance</span><Badge variant="red">Expired</Badge></div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Audit Log" subtitle="Recent activity" />
          <div className="space-y-2 text-xs">
            {[
              { user: "Rajesh M.", action: "Updated rate plan", time: "2 min ago" },
              { user: "Priya S.", action: "Checked in guest #1204", time: "15 min ago" },
              { user: "Anita D.", action: "Approved PO #PO-024", time: "1 hr ago" },
              { user: "Ravi K.", action: "Completed HK task", time: "2 hrs ago" },
            ].map((a, i) => (
              <div key={i} className="flex justify-between py-1"><span style={{ color: "#1A2E44" }}>{a.user} — {a.action}</span><span style={{ color: "#64748B" }}>{a.time}</span></div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="User Management" subtitle={`${users.length} users · 12 roles`} />
        <Table
          data={users}
          keyExtractor={(_, i) => String(i)}
          columns={[
            { key: "name", header: "Name" }, { key: "email", header: "Email" },
            { key: "role", header: "Role" }, { key: "property", header: "Scope" },
            { key: "status", header: "Status", render: () => <Badge variant="teal">Active</Badge> },
          ]}
        />
      </Card>
    </div>
  );
}
