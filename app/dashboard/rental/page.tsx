"use client";

import { FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";

const leases = [
  { tenant: "Amit Sharma", unit: "3BHK-05", property: "Greenwood Residency", start: "01 Jan 2026", end: "31 Dec 2026", rent: "₹28,000", status: "active" },
  { tenant: "Neha Gupta", unit: "2BHK-12", property: "Greenwood Residency", start: "15 Mar 2026", end: "14 Mar 2027", rent: "₹22,000", status: "active" },
  { tenant: "Rahul Verma", unit: "1BHK-08", property: "Lakeview Apartments", start: "01 Jun 2025", end: "31 May 2026", rent: "₹18,000", status: "renewal_due" },
  { tenant: "Priya Kapoor", unit: "Studio-03", property: "Cityscape Residences", start: "20 Apr 2026", end: "19 Apr 2027", rent: "₹15,000", status: "signed" },
  { tenant: "Vikram Singh", unit: "3BHK-07", property: "Greenwood Residency", start: "01 Aug 2024", end: "31 Jul 2025", rent: "₹26,000", status: "terminated" },
];

export default function RentalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Apartment Rental & Tenancy</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Lease lifecycle, rent roll & deposit management</p>
        </div>
        <Button variant="secondary" size="sm"><FileText className="w-3.5 h-3.5" /> New Lease</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Leases", value: "45", color: "#2BAE8E" },
          { label: "Renewal Due (30d)", value: "6", color: "#F5A623", text: "#1A2E44" },
          { label: "Rent Collection", value: "94.2%", color: "#1A3C5E" },
          { label: "Security Deposits", value: "₹12.6L", color: "#2BAE8E" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: s.color }}>
            <div className="text-2xl font-bold" style={{ color: s.text || "#FFFFFF" }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: s.text || "rgba(255,255,255,0.8)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Lease Agreements" subtitle={`${leases.filter(l => l.status === 'active').length} active · ${leases.filter(l => l.status === 'renewal_due').length} renewal due`} />
        <Table
          data={leases}
          keyExtractor={(_, i) => String(i)}
          columns={[
            { key: "tenant", header: "Tenant" },
            { key: "unit", header: "Unit" },
            { key: "property", header: "Property" },
            { key: "start", header: "Start Date" },
            { key: "end", header: "End Date" },
            { key: "rent", header: "Monthly Rent" },
            { key: "status", header: "Status", render: (l) => (
              <Badge variant={l.status === "active" ? "teal" : l.status === "renewal_due" ? "amber" : l.status === "signed" ? "navy" : "gray"}>
                {l.status.replace("_", " ")}
              </Badge>
            )},
          ]}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Rent Roll" subtitle="This month" />
          {[
            { tenant: "Amit Sharma", amount: "₹28,000", status: "paid" },
            { tenant: "Neha Gupta", amount: "₹22,000", status: "paid" },
            { tenant: "Rahul Verma", amount: "₹18,000", status: "overdue" },
            { tenant: "Sneha Reddy", amount: "₹25,000", status: "pending" },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < 3 ? "1px solid #E2E8F0" : "none" }}>
              <div>
                <div className="font-medium" style={{ color: "#1A2E44" }}>{r.tenant}</div>
                <div className="text-xs" style={{ color: "#64748B" }}>{r.amount}</div>
              </div>
              <Badge variant={r.status === "paid" ? "teal" : r.status === "overdue" ? "red" : "amber"}>{r.status}</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <CardHeader title="Upcoming Renewals" subtitle="Next 30 days" />
          {[
            { tenant: "Rahul Verma", end: "31 May 2026", days: -18, type: "overdue" },
            { tenant: "Anita Desai", end: "25 Jun 2026", days: 7, type: "due" },
            { tenant: "Mohit Raj", end: "30 Jun 2026", days: 12, type: "due" },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < 2 ? "1px solid #E2E8F0" : "none" }}>
              <div>
                <div className="font-medium" style={{ color: "#1A2E44" }}>{r.tenant}</div>
                <div className="text-xs" style={{ color: "#64748B" }}>{r.end}</div>
              </div>
              <Badge variant={r.type === "overdue" ? "red" : "amber"}>{r.days > 0 ? `${r.days}d` : `${Math.abs(r.days)}d overdue`}</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <CardHeader title="Deposit Ledger" subtitle="Summary" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span style={{ color: "#1A2E44" }}>Total Held</span><span className="font-semibold" style={{ color: "#1A3C5E" }}>₹12,60,000</span></div>
            <div className="flex justify-between"><span style={{ color: "#1A2E44" }}>Pending Refunds</span><span style={{ color: "#F5A623" }}>₹1,20,000</span></div>
            <div className="flex justify-between"><span style={{ color: "#1A2E44" }}>Deductions This Q</span><span style={{ color: "#E53E3E" }}>₹45,000</span></div>
            <div className="pt-2 mt-2" style={{ borderTop: "1px solid #E2E8F0" }}>
              <Button variant="secondary" size="sm" className="w-full">Process Refund</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
