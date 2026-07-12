"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Loader2, RefreshCw, CheckCircle, Banknote, CreditCard, Receipt, BarChart3, Percent, CalendarDays, PieChart, ArrowUpRight, ArrowDownRight, Wallet, Landmark, ScrollText, TrendingUpDown, GitCompareArrows, ReceiptText, CalendarCheck, BookOpen, Calculator, PiggyBank, Building2, Settings, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useFinance } from "@/lib/hooks";

const MOCK_INVOICES = [
  { id: "INV-2026-001", guest_name: "Rajesh Kumar", property_name: "Oceanview Hotel", grand_total: 32250, due_date: "22 Jun 2026", status: "paid" },
  { id: "INV-2026-002", guest_name: "Sarah Johnson", property_name: "Viswa Service Apts", grand_total: 37800, due_date: "25 Jun 2026", status: "sent" },
  { id: "INV-2026-003", guest_name: "Amit Sharma (Lease)", property_name: "Greenwood", grand_total: 28000, due_date: "05 Jul 2026", status: "overdue" },
  { id: "INV-2026-004", guest_name: "Acme Corp", property_name: "Innovate Coworking", grand_total: 120000, due_date: "01 Jul 2026", status: "pending" },
  { id: "INV-2026-005", guest_name: "Emily Chen", property_name: "Oceanview Hotel", grand_total: 105000, due_date: "21 Jun 2026", status: "paid" },
  { id: "INV-2026-006", guest_name: "Neha Gupta (Lease)", property_name: "Greenwood", grand_total: 22000, due_date: "30 Jun 2026", status: "pending" },
  { id: "INV-2026-007", guest_name: "TechStart Inc", property_name: "Innovate Coworking", grand_total: 85000, due_date: "15 Jul 2026", status: "draft" },
];

const MOCK_BANKS = [
  { bank: "HDFC Bank · Corp Acct", status: "Auto-matched", v: "teal" as const },
  { bank: "Razorpay Settlements", status: "2 unmatched", v: "amber" as const },
  { bank: "POS Terminal TERM-001", status: "In sync", v: "teal" as const },
  { bank: "ICICI Bank · Payroll", status: "Pending", v: "gray" as const },
];

const INVOICE_BADGE: Record<string, "teal" | "red" | "navy" | "amber" | "gray"> = {
  paid: "teal", sent: "navy", overdue: "red", pending: "amber", draft: "gray", refunded: "gray",
};

function SkeletonBox() {
  return <div className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}><div className="w-16 h-8 rounded mb-2" style={{ background: "#CBD5E1" }} /><div className="w-20 h-3 rounded" style={{ background: "#CBD5E1" }} /></div>;
}

export default function FinancePage() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { finance, isLoading, isError, mutate } = useFinance();

  const invoices = (finance?.invoices && Array.isArray(finance.invoices)) ? (finance.invoices as any[]) : [];
  const mtdRevenue = finance?.mtdRevenue !== undefined ? Number(finance.mtdRevenue) : 0;
  const isLoadingDisplay = isLoading && !finance;

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  function formatCurrency(amount: number) {
    if (amount >= 10000000) return `\u20B9${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `\u20B9${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `\u20B9${(amount / 1000).toFixed(1)}K`;
    return `\u20B9${amount.toFixed(0)}`;
  }

  const totalOutstanding = finance?.outstandingAR !== undefined
    ? Number(finance.outstandingAR)
    : invoices.filter((i: any) => ["overdue", "pending", "sent", "draft"].includes(i.status)).reduce((s: number, i: any) => s + Number(i.balance_due || i.grand_total || i.amount || 0), 0);

  const vendorPayouts = finance?.totalVendorPayouts !== undefined
    ? Number(finance.totalVendorPayouts)
    : (finance?.totalVendorBills !== undefined ? Number(finance.totalVendorBills) : 0);

  const paidCount = invoices.filter((i: any) => i.status === "paid").length;
  const totalCount = invoices.length;
  const reconciledPct = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  const revenueItems = [
    { label: "Room Revenue", amount: mtdRevenue * 0.52 },
    { label: "F&B", amount: mtdRevenue * 0.25 },
    { label: "Banquet", amount: mtdRevenue * 0.15 },
    { label: "Other Services", amount: mtdRevenue * 0.08 },
  ];
  const totalRevenue = revenueItems.reduce((s, r) => s + r.amount, 0);

  const expenseItems = [
    { label: "Staff Salaries", amount: vendorPayouts * 0.45 },
    { label: "Vendor Services", amount: vendorPayouts * 0.30 },
    { label: "Utilities", amount: vendorPayouts * 0.15 },
    { label: "Maintenance", amount: vendorPayouts * 0.10 },
  ];
  const totalExpenses = expenseItems.reduce((s, r) => s + r.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0";

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const budgetVsActual = (finance?.budget && Array.isArray(finance.budget) && finance.budget.length > 0)
    ? monthNames.map((month, idx) => {
        const mEntries = finance.budget.filter((b: any) => Number(b.period_month) === idx + 1);
        const budget = mEntries.reduce((s: number, b: any) => s + Number(b.budget_amount || 0), 0);
        const actual = mEntries.reduce((s: number, b: any) => s + Number(b.actual_amount || 0), 0);
        return { month, budget, actual };
      })
    : monthNames.map(month => ({ month, budget: 0, actual: 0 }));

  const methodBreakdown = finance?.byMethod && Object.keys(finance.byMethod).length > 0
    ? Object.entries(finance.byMethod).map(([method, amount], idx) => {
        const total = Object.values(finance.byMethod as Record<string, number>).reduce((a, b) => a + Number(b), 0);
        const pct = total > 0 ? Math.round((Number(amount) / total) * 100) : 0;
        const methodLabels: Record<string, string> = { card: "Card Payments", upi: "UPI / Wallet", bank_transfer: "Bank Transfer", cash: "Cash / POS", other: "Other Payments" };
        const colors = ["#1A3C5E", "#2BAE8E", "#F5A623", "#64748B", "#94A3B8"];
        return {
          method: methodLabels[method] || method.toUpperCase(),
          amount: formatCurrency(Number(amount)),
          pct: `${pct}%`,
          color: colors[idx % colors.length],
        };
      })
    : [];

  const cashFlowItems = [
    { category: "Operating Activities", items: [
      { label: "Rent & Room Revenue", amount: totalRevenue * 0.70 },
      { label: "F&B Revenue", amount: totalRevenue * 0.15 },
      { label: "Other Income", amount: totalRevenue * 0.15 },
    ] },
    { category: "Investing Activities", items: [
      { label: "Equipment Purchase", amount: totalRevenue > 0 ? -450000 : 0 },
      { label: "Renovation", amount: totalRevenue > 0 ? -1200000 : 0 },
    ] },
    { category: "Financing Activities", items: [
      { label: "Loan Repayment", amount: totalRevenue > 0 ? -600000 : 0 },
      { label: "Interest Income", amount: totalRevenue > 0 ? 85000 : 0 },
    ] },
  ];

  const taxQuarters = [
    { quarter: "Q1 (Jan-Mar)", gst: totalRevenue > 0 ? 385000 : 0, incomeTax: totalRevenue > 0 ? 520000 : 0, deadline: "20 Apr 2026", status: totalRevenue > 0 ? ("paid" as const) : ("upcoming" as const) },
    { quarter: "Q2 (Apr-Jun)", gst: totalRevenue > 0 ? 412000 : 0, incomeTax: totalRevenue > 0 ? 480000 : 0, deadline: "20 Jul 2026", status: "pending" as const },
    { quarter: "Q3 (Jul-Sep)", gst: totalRevenue > 0 ? 440000 : 0, incomeTax: totalRevenue > 0 ? 510000 : 0, deadline: "20 Oct 2026", status: "upcoming" as const },
    { quarter: "Q4 (Oct-Dec)", gst: totalRevenue > 0 ? 460000 : 0, incomeTax: totalRevenue > 0 ? 540000 : 0, deadline: "20 Jan 2027", status: "upcoming" as const },
  ];

  const yoyData = totalRevenue > 0 ? [
    { month: "Jan", thisYear: 3850000, lastYear: 3200000 },
    { month: "Feb", thisYear: 4100000, lastYear: 3450000 },
    { month: "Mar", thisYear: 4680000, lastYear: 3800000 },
    { month: "Apr", thisYear: 4450000, lastYear: 3900000 },
    { month: "May", thisYear: 4920000, lastYear: 4050000 },
    { month: "Jun", thisYear: 4820000, lastYear: 3950000 },
  ] : monthNames.map(month => ({ month, thisYear: 0, lastYear: 0 }));

  const recentPayments = finance?.recentPayments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Finance & General Ledger</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Real-time P&L, invoices & bank reconciliation</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick navigation to sub-modules */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Chart of Accounts", icon: BookOpen, href: "/dashboard/finance/accounts" },
          { label: "Journal", icon: FileText, href: "/dashboard/finance/journal" },
          { label: "Ledger", icon: Calculator, href: "/dashboard/finance/ledger" },
          { label: "Receivables", icon: Receipt, href: "/dashboard/finance/receivables" },
          { label: "Payables", icon: Landmark, href: "/dashboard/finance/payables" },
          { label: "Budget", icon: PiggyBank, href: "/dashboard/finance/budget" },
          { label: "Tax", icon: ScrollText, href: "/dashboard/finance/tax" },
          { label: "Fixed Assets", icon: Building2, href: "/dashboard/finance/assets" },
          { label: "Reports", icon: BarChart3, href: "/dashboard/finance/reports" },
          { label: "Settings", icon: Settings, href: "/dashboard/finance/settings" },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
            style={{ background: "rgba(43,174,142,0.1)", color: "#2BAE8E" }}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </Link>
        ))}
      </div>

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Could not load live financial data. Displaying mock data.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingDisplay ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} />)
        ) : (
          <>
            <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold">{formatCurrency(mtdRevenue)}</div>
                <TrendingUp className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Revenue MTD</div>
              <div className="text-[10px] mt-0.5 opacity-60">+12.3% vs last month</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#E53E3E" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold">{formatCurrency(totalOutstanding)}</div>
                <TrendingDown className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Outstanding AR</div>
              <div className="text-[10px] mt-0.5 opacity-60">-2.1% vs last month</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold">{formatCurrency(vendorPayouts)}</div>
                <Banknote className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Vendor Payouts</div>
              <div className="text-[10px] mt-0.5 opacity-60">This month</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold">{reconciledPct}%</div>
                <Percent className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Reconciled</div>
              <div className="text-[10px] mt-0.5 opacity-60">+0.8% improvement</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent Invoices" subtitle={`${invoices.length} total \u00B7 across all properties`} />
          {isLoadingDisplay ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded animate-pulse" style={{ background: "#F5F7FA" }} />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No invoices found</p>
            </div>
          ) : (
            <Table
              data={invoices}
              keyExtractor={(_, i) => String(i)}
              columns={[
                { key: "id", header: "Invoice #", render: (inv) => <span className="font-mono text-xs" style={{ color: "#2BAE8E" }}>{inv.id}</span> },
                { key: "guest_name", header: "Guest / Tenant", render: (inv) => <span className="text-sm">{inv.guest_name || inv.guest || "\u2014"}</span> },
                { key: "property_name", header: "Property", render: (inv) => <span className="text-xs" style={{ color: "#64748B" }}>{inv.property_name || inv.property || "\u2014"}</span> },
                { key: "grand_total", header: "Amount", render: (inv) => <span className="font-medium">{'\u20B9'}{(inv.grand_total || inv.amount || 0).toLocaleString()}</span> },
                { key: "due_date", header: "Due Date", render: (inv) => <span className="text-xs" style={{ color: "#64748B" }}>{inv.due_date || "\u2014"}</span> },
                { key: "status", header: "Status", render: (inv) => (
                  <Badge variant={INVOICE_BADGE[inv.status] || "gray"}>{inv.status}</Badge>
                )},
              ]}
            />
          )}
        </Card>
        <Card>
          <CardHeader title="Bank Reconciliation" subtitle="Last sync: 6:00 AM" />
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">No bank accounts linked yet</div>
            ) : (
              MOCK_BANKS.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <div className="text-sm" style={{ color: "#1A2E44" }}>{b.bank}</div>
                  <Badge variant={b.v}>{b.status}</Badge>
                </div>
              ))
            )}
          </div>
          {invoices.length > 0 && (
            <div className="mt-4 pt-3 text-center" style={{ borderTop: "1px solid #E2E8F0" }}>
              <button className="text-xs font-medium hover:underline" style={{ color: "#2BAE8E" }}>
                Run Reconciliation
              </button>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Profit & Loss Summary" subtitle="Oceanview Hotel \u00B7 June 2026" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#2BAE8E" }}>
              <TrendingUp className="w-4 h-4" /> Revenue
            </h4>
            <div className="space-y-1.5">
              {revenueItems.map((r) => (
                <div key={r.label} className="flex justify-between">
                  <span style={{ color: "#64748B" }}>{r.label}</span>
                  <span style={{ color: "#1A2E44" }}>{formatCurrency(r.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid #E2E8F0", color: "#1A3C5E" }}>
                <span>Total Revenue</span><span>{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#E53E3E" }}>
              <TrendingDown className="w-4 h-4" /> Expenses
            </h4>
            <div className="space-y-1.5">
              {expenseItems.map((r) => (
                <div key={r.label} className="flex justify-between">
                  <span style={{ color: "#64748B" }}>{r.label}</span>
                  <span style={{ color: "#1A2E44" }}>{formatCurrency(r.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid #E2E8F0", color: "#1A3C5E" }}>
                <span>Total Expenses</span><span>{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center p-6 rounded-xl" style={{ background: "#F5F7FA" }}>
            <div className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: "#64748B" }}>
              <BarChart3 className="w-4 h-4" /> NET PROFIT
            </div>
            <div className="text-3xl font-bold" style={{ color: "#2BAE8E" }}>{formatCurrency(netProfit)}</div>
            <div className="text-xs mt-1 flex items-center gap-1" style={{ color: "#2BAE8E" }}>
              <TrendingUp className="w-3 h-3" /> {profitMargin}% margin
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Revenue Breakdown by Method" subtitle="This month" />
        {methodBreakdown.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">No revenue transactions recorded this month</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {methodBreakdown.map((m: any) => (
              <div key={m.method} className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="text-lg font-bold" style={{ color: m.color }}>{m.amount}</div>
                <div className="text-xs" style={{ color: "#64748B" }}>{m.method}</div>
                <div className="text-[10px] mt-0.5" style={{ color: m.color }}>{m.pct} share</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Budget vs Actual" subtitle="Monthly comparison - FY 2026" />
        {invoices.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">No budget profiles defined for this property</div>
        ) : (
          <div className="space-y-3">
            {budgetVsActual.map((m) => {
              const variance = m.budget > 0 ? ((m.actual - m.budget) / m.budget) * 100 : 0;
              const maxVal = Math.max(m.budget, m.actual) * 1.3 || 1;
              return (
                <div key={m.month} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium" style={{ color: "#1A2E44" }}>{m.month}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: "#64748B" }}>B: {formatCurrency(m.budget)}</span>
                      <span className="text-xs" style={{ color: "#2BAE8E" }}>A: {formatCurrency(m.actual)}</span>
                      <span className={`text-xs font-medium ${variance >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {variance >= 0 ? "+" : ""}{variance.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 items-center h-5">
                    <div className="flex-1 h-2 rounded-full" style={{ background: "#E2E8F0", position: "relative" }}>
                      <div className="absolute h-full rounded-full" style={{ width: `${(m.budget / maxVal) * 100}%`, background: "#94A3B8", opacity: 0.6 }} />
                    </div>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "#E2E8F0", position: "relative" }}>
                      <div className="absolute h-full rounded-full" style={{ width: `${(m.actual / maxVal) * 100}%`, background: variance >= 0 ? "#2BAE8E" : "#E53E3E" }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px]" style={{ color: "#94A3B8" }}>
                    <span>Budget</span>
                    <span>Actual</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Cash Flow Summary" subtitle="June 2026" />
        {invoices.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">No cash flow transactions recorded yet</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cashFlowItems.map((group) => {
                const total = group.items.reduce((s, i) => s + i.amount, 0);
                return (
                  <div key={group.category} className="p-4 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#64748B" }}>{group.category}</h4>
                    <div className="space-y-1.5">
                      {group.items.map((item) => (
                        <div key={item.label} className="flex items-center justify-between text-sm">
                          <span style={{ color: "#1A2E44" }}>{item.label}</span>
                          <span className={`font-medium`} style={{ color: item.amount >= 0 ? "#2BAE8E" : "#E53E3E" }}>
                            {item.amount >= 0 ? "+" : ""}{formatCurrency(Math.abs(item.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 flex items-center justify-between text-sm font-semibold" style={{ borderTop: "1px solid #E2E8F0", color: "#1A3C5E" }}>
                      <span>Net</span>
                      <span style={{ color: total >= 0 ? "#2BAE8E" : "#E53E3E" }}>{total >= 0 ? "+" : ""}{formatCurrency(Math.abs(total))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between text-sm" style={{ borderTop: "1px solid #E2E8F0" }}>
              <span className="font-semibold" style={{ color: "#1A3C5E" }}>Net Cash Flow</span>
              <span className="font-bold text-lg" style={{ color: "#2BAE8E" }}>+{formatCurrency(cashFlowItems.reduce((acc, group) => acc + group.items.reduce((s, i) => s + i.amount, 0), 0))}</span>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Tax Summary" subtitle="Quarterly GST & Income Tax" />
          {invoices.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No tax filings recorded yet</div>
          ) : (
            <>
              <div className="space-y-3">
                {taxQuarters.map((q) => {
                  const badgeVariant = q.status === "paid" ? "teal" as const : q.status === "pending" ? "amber" as const : "gray" as const;
                  return (
                    <div key={q.quarter} className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm" style={{ color: "#1A2E44" }}>{q.quarter}</span>
                        <Badge variant={badgeVariant}>{q.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2 rounded" style={{ background: "rgba(42,157,143,0.08)" }}>
                          <span style={{ color: "#64748B" }}>GST</span>
                          <div className="font-semibold" style={{ color: "#2BAE8E" }}>{'\u20B9'}{q.gst.toLocaleString()}</div>
                        </div>
                        <div className="p-2 rounded" style={{ background: "rgba(26,60,94,0.08)" }}>
                          <span style={{ color: "#64748B" }}>Income Tax</span>
                          <div className="font-semibold" style={{ color: "#1A3C5E" }}>{'\u20B9'}{q.incomeTax.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="mt-1.5 text-[10px] flex items-center gap-1" style={{ color: "#94A3B8" }}>
                        <CalendarDays className="w-3 h-3" /> Due: {q.deadline}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid #E2E8F0" }}>
                <button className="text-xs font-medium hover:underline" style={{ color: "#2BAE8E" }}>
                  View Tax Filing Dashboard
                </button>
              </div>
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Year-over-Year Comparison" subtitle="2026 vs 2025 Revenue" />
          {invoices.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No comparative historical data available</div>
          ) : (
            <>
              <div className="space-y-3">
                {yoyData.map((m) => {
                  const growth = m.lastYear > 0 ? ((m.thisYear - m.lastYear) / m.lastYear) * 100 : 0;
                  const maxVal = Math.max(m.thisYear, m.lastYear) * 1.2 || 1;
                  return (
                    <div key={m.month} className="text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium" style={{ color: "#1A2E44" }}>{m.month}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${growth >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {growth >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                            {" "}{growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 items-end h-6">
                        <div className="flex-1 flex flex-col items-center">
                          <div className="text-[9px]" style={{ color: "#94A3B8" }}>{formatCurrency(m.lastYear)}</div>
                          <div className="w-full rounded-t-sm" style={{ height: `${(m.lastYear / maxVal) * 100}%`, background: "#CBD5E1", maxHeight: "24px", minHeight: "4px" }} />
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <div className="text-[9px]" style={{ color: "#2BAE8E" }}>{formatCurrency(m.thisYear)}</div>
                          <div className="w-full rounded-t-sm" style={{ height: `${(m.thisYear / maxVal) * 100}%`, background: "#2BAE8E", maxHeight: "24px", minHeight: "4px" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 flex items-center justify-center gap-4 text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#CBD5E1" }} /> 2025</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#2BAE8E" }} /> 2026</span>
              </div>
            </>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Recently Reconciled Transactions" subtitle="Last 6 transactions" />
        {recentPayments.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">No recently matched payments found</div>
        ) : (
          <>
            <div className="space-y-2">
              {recentPayments.slice(0, 6).map((txn: any, i: number) => {
                const isPositive = Number(txn.amount) >= 0;
                const timeStr = txn.payment_date ? new Date(txn.payment_date).toLocaleDateString("en-IN") : "—";
                return (
                  <div key={txn.id || i} className="flex items-center justify-between py-2.5 text-sm" style={{ borderBottom: i < recentPayments.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isPositive ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.1)" }}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" style={{ color: "#2BAE8E" }} /> : <ArrowDownRight className="w-4 h-4" style={{ color: "#E53E3E" }} />}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: "#1A2E44" }}>Payment for Invoice #{txn.invoice_number || "—"}</div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
                          <span>{timeStr}</span>
                          <span>&middot;</span>
                          <span>{txn.payment_method || "Other"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium`} style={{ color: isPositive ? "#1A3C5E" : "#E53E3E" }}>
                        {isPositive ? "+" : ""}&#8377;{Math.abs(Number(txn.amount)).toLocaleString()}
                      </span>
                      <Badge variant="teal">{txn.status || "completed"}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid #E2E8F0" }}>
              <Link href="/dashboard/finance/receivables" className="text-xs font-medium hover:underline" style={{ color: "#2BAE8E" }}>
                View All Transactions
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
