"use client";

import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";

const invoices = [
  { id: "INV-2026-001", guest: "Rajesh Kumar", property: "Oceanview Hotel", amount: "₹32,250", due: "22 Jun 2026", status: "paid" },
  { id: "INV-2026-002", guest: "Sarah Johnson", property: "Cityscape Apts", amount: "₹37,800", due: "25 Jun 2026", status: "sent" },
  { id: "INV-2026-003", guest: "Amit Sharma (Lease)", property: "Greenwood", amount: "₹28,000", due: "05 Jul 2026", status: "overdue" },
  { id: "INV-2026-004", guest: "Acme Corp", property: "Innovate Coworking", amount: "₹1,20,000", due: "01 Jul 2026", status: "pending" },
  { id: "INV-2026-005", guest: "Emily Chen", property: "Oceanview Hotel", amount: "₹1,05,000", due: "21 Jun 2026", status: "paid" },
];

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Finance & General Ledger</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Real-time P&L, invoices & bank reconciliation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Revenue MTD", value: "₹48.2L", change: "+12.3%", color: "#1A3C5E" },
          { label: "Outstanding AR", value: "₹4.8L", change: "-2.1%", color: "#E53E3E" },
          { label: "Vendor Payouts", value: "₹12.5L", change: "This month", color: "#2BAE8E" },
          { label: "Reconciled", value: "97.3%", change: "+0.8%", color: "#2BAE8E" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 text-white" style={{ background: s.color }}>
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-xs mt-1 opacity-80">{s.label}</div>
            <div className="text-[10px] mt-0.5 opacity-60">{s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent Invoices" subtitle="Across all properties" />
          <Table
            data={invoices}
            keyExtractor={(_, i) => String(i)}
            columns={[
              { key: "id", header: "Invoice #" }, { key: "guest", header: "Guest / Tenant" },
              { key: "property", header: "Property" }, { key: "amount", header: "Amount" },
              { key: "due", header: "Due Date" },
              { key: "status", header: "Status", render: (inv) => (
                <Badge variant={inv.status === "paid" ? "teal" : inv.status === "overdue" ? "red" : inv.status === "sent" ? "navy" : "amber"}>{inv.status}</Badge>
              )},
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Bank Reconciliation" subtitle="Last sync: 6:00 AM" />
          <div className="space-y-3">
            {[
              { bank: "HDFC Bank · Corp Acct", status: "Auto-matched", v: "teal" as const },
              { bank: "Razorpay Settlements", status: "2 unmatched", v: "amber" as const },
              { bank: "POS Terminal TERM-001", status: "In sync", v: "teal" as const },
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="text-sm" style={{ color: "#1A2E44" }}>{b.bank}</div>
                <Badge variant={b.v}>{b.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Profit & Loss Summary" subtitle="Oceanview Hotel · June 2026" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2" style={{ color: "#2BAE8E" }}>Revenue</h4>
            <div className="space-y-1.5">
              {[
                { label: "Room Revenue", amount: "₹28,50,000" },
                { label: "F&B", amount: "₹8,20,000" },
                { label: "Banquet", amount: "₹3,50,000" },
                { label: "Other Services", amount: "₹1,80,000" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between"><span style={{ color: "#64748B" }}>{r.label}</span><span style={{ color: "#1A2E44" }}>{r.amount}</span></div>
              ))}
              <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid #E2E8F0", color: "#1A3C5E" }}>
                <span>Total Revenue</span><span>₹42,00,000</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2" style={{ color: "#E53E3E" }}>Expenses</h4>
            <div className="space-y-1.5">
              {[
                { label: "Staff Salaries", amount: "₹12,50,000" },
                { label: "Vendor Services", amount: "₹5,80,000" },
                { label: "Utilities", amount: "₹2,40,000" },
                { label: "Maintenance", amount: "₹1,90,000" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between"><span style={{ color: "#64748B" }}>{r.label}</span><span style={{ color: "#1A2E44" }}>{r.amount}</span></div>
              ))}
              <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid #E2E8F0", color: "#1A3C5E" }}>
                <span>Total Expenses</span><span>₹22,60,000</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center p-6 rounded-xl" style={{ background: "#F5F7FA" }}>
            <div className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>NET PROFIT</div>
            <div className="text-3xl font-bold" style={{ color: "#2BAE8E" }}>₹19.4L</div>
            <div className="text-xs mt-1" style={{ color: "#2BAE8E" }}>+46.2% margin</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
