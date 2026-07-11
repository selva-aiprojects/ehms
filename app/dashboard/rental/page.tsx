"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, Home, Calendar, DollarSign, Shield, Search, TrendingUp, TrendingDown, Users, Clock, BadgeCheck, Wrench, MessageCircle, MessageSquare, BarChart3, GitCompareArrows, Timer, CalendarCheck, Repeat, Mail, Phone, GanttChartSquare, Landmark } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import { useLeases, useProperties, useGuests } from "@/lib/hooks";
import { useCreateLease } from "@/lib/hooks/mutations";
import { useJourney } from "@/components/providers/JourneyProvider";

const MOCK_LEASES = [
  { id: "L-001", tenant_name: "Amit Sharma", unit_label: "3BHK-05", property_name: "Greenwood Residency", start_date: "01 Jan 2026", end_date: "31 Dec 2026", monthly_rent: 28000, status: "active" },
  { id: "L-002", tenant_name: "Neha Gupta", unit_label: "2BHK-12", property_name: "Greenwood Residency", start_date: "15 Mar 2026", end_date: "14 Mar 2027", monthly_rent: 22000, status: "active" },
  { id: "L-003", tenant_name: "Rahul Verma", unit_label: "1BHK-08", property_name: "Lakeview Apartments", start_date: "01 Jun 2025", end_date: "31 May 2026", monthly_rent: 18000, status: "renewal_due" },
  { id: "L-004", tenant_name: "Priya Kapoor", unit_label: "Studio-03", property_name: "Viswa Service Apartments", start_date: "20 Apr 2026", end_date: "19 Apr 2027", monthly_rent: 15000, status: "signed" },
  { id: "L-005", tenant_name: "Vikram Singh", unit_label: "3BHK-07", property_name: "Greenwood Residency", start_date: "01 Aug 2024", end_date: "31 Jul 2025", monthly_rent: 26000, status: "terminated" },
  { id: "L-006", tenant_name: "Sneha Reddy", unit_label: "2BHK-09", property_name: "Greenwood Residency", start_date: "01 Feb 2026", end_date: "31 Jan 2027", monthly_rent: 25000, status: "active" },
  { id: "L-007", tenant_name: "Mohit Raj", unit_label: "1BHK-04", property_name: "Lakeview Apartments", start_date: "10 Jun 2025", end_date: "09 Jun 2026", monthly_rent: 16000, status: "renewal_due" },
  { id: "L-008", tenant_name: "Anita Desai", unit_label: "2BHK-11", property_name: "Greenwood Residency", start_date: "25 Jun 2025", end_date: "24 Jun 2026", monthly_rent: 21000, status: "renewal_due" },
];

const MOCK_RENT_ROLL = [
  { tenant: "Amit Sharma", amount: "₹28,000", status: "paid" },
  { tenant: "Neha Gupta", amount: "₹22,000", status: "paid" },
  { tenant: "Rahul Verma", amount: "₹18,000", status: "overdue" },
  { tenant: "Sneha Reddy", amount: "₹25,000", status: "pending" },
  { tenant: "Mohit Raj", amount: "₹16,000", status: "paid" },
  { tenant: "Anita Desai", amount: "₹21,000", status: "pending" },
];

const LEASE_BADGE: Record<string, "teal" | "amber" | "navy" | "gray" | "red"> = {
  active: "teal", renewal_due: "amber", signed: "navy", drafted: "gray", terminated: "red", renewed: "teal",
};

const MOCK_MAINTENANCE = [
  { id: "MT-001", tenant: "Amit Sharma", unit: "3BHK-05", issue: "Water leakage in bathroom", reported: "16 Jun 2026", priority: "high" as const, status: "in_progress" as const },
  { id: "MT-002", tenant: "Sneha Reddy", unit: "2BHK-09", issue: "AC not cooling properly", reported: "15 Jun 2026", priority: "medium" as const, status: "scheduled" as const },
  { id: "MT-003", tenant: "Neha Gupta", unit: "2BHK-12", issue: "Electrical switchboard repair", reported: "14 Jun 2026", priority: "medium" as const, status: "pending" as const },
  { id: "MT-004", tenant: "Rahul Verma", unit: "1BHK-08", issue: "Broken window latch", reported: "12 Jun 2026", priority: "low" as const, status: "pending" as const },
  { id: "MT-005", tenant: "Mohit Raj", unit: "1BHK-04", issue: "Gas stove not igniting", reported: "10 Jun 2026", priority: "high" as const, status: "resolved" as const },
];

const TENANT_MESSAGES = [
  { from: "Amit Sharma", subject: "Renewal discussion", preview: "I would like to discuss the renewal terms for next year...", date: "17 Jun 2026", unread: true },
  { from: "Neha Gupta", subject: "Parking space request", preview: "Could you please allocate an additional parking spot...", date: "16 Jun 2026", unread: true },
  { from: "Sneha Reddy", subject: "Guest room booking", preview: "I have family visiting next month and would like...", date: "15 Jun 2026", unread: false },
  { from: "Priya Kapoor", subject: "Welcome package", preview: "Thank you for the welcome kit! I had a question about...", date: "14 Jun 2026", unread: false },
  { from: "Mohit Raj", subject: "Maintenance follow-up", preview: "Just checking on the status of the gas stove repair...", date: "12 Jun 2026", unread: false },
  { from: "Rahul Verma", subject: "Moving out notice", preview: "I am writing to inform you that I will be vacating...", date: "10 Jun 2026", unread: true },
];

const PROPERTY_COMPARISON = [
  { name: "Greenwood Residency", occupancy: 87, avgRent: 24500, collection: 94, satisfaction: 4.5, revenue: 560000 },
  { name: "Lakeview Apartments", occupancy: 83, avgRent: 17000, collection: 88, satisfaction: 4.2, revenue: 380000 },
  { name: "Viswa Service Apartments", occupancy: 83, avgRent: 15000, collection: 91, satisfaction: 4.3, revenue: 420000 },
];

const NOTICE_PERIOD_TRACKING = [
  { tenant: "Rahul Verma", unit: "1BHK-08", noticeDate: "10 Jun 2026", moveOutDate: "10 Jul 2026", status: "active" as const, daysLeft: 22 },
  { tenant: "Anita Desai", unit: "2BHK-11", noticeDate: "05 Jun 2026", moveOutDate: "05 Jul 2026", status: "active" as const, daysLeft: 17 },
  { tenant: "Vikram Singh", unit: "3BHK-07", noticeDate: "20 May 2026", moveOutDate: "20 Jun 2026", status: "completed" as const, daysLeft: 0 },
  { tenant: "Priya Kapoor", unit: "Studio-03", noticeDate: "25 May 2026", moveOutDate: "24 Jun 2026", status: "pending" as const, daysLeft: 6 },
];

const RENT_FORECAST = [
  { month: "July 2026", expected: 165000, collected: 0, newLeases: 2, expiring: 1 },
  { month: "August 2026", expected: 172000, collected: 0, newLeases: 1, expiring: 0 },
  { month: "September 2026", expected: 180000, collected: 0, newLeases: 1, expiring: 2 },
];

function SkeletonStat() {
  return <div className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}><div className="w-12 h-8 rounded mb-2" style={{ background: "#CBD5E1" }} /><div className="w-20 h-3 rounded" style={{ background: "#CBD5E1" }} /></div>;
}

export default function RentalPage() {
  const { selectedPropertyId } = useJourney();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { leases, isLoading, isError, mutate } = useLeases({ status: statusFilter, property_id: selectedPropertyId || undefined });

  // Live queries for modal dropdowns
  const { properties } = useProperties("rental_apartment");
  const { guests } = useGuests("", 1);
  const { trigger: createLease, isMutating: isCreatingLease } = useCreateLease();

  // Modal form states
  const [showNewLeaseModal, setShowNewLeaseModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("30");

  const displayLeases = (leases && (leases as any[]).length > 0) ? (leases as any[]) : MOCK_LEASES;
  const isLoadingDisplay = isLoading && !leases;

  const handleCreateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !selectedUnit || !selectedTenant || !startDate || !endDate || !rentAmount) {
      setActionFeedback({ type: "error", message: "Please fill in all required fields." });
      return;
    }
    try {
      const res = await createLease({
        property_id: selectedProperty,
        unit_id: selectedUnit,
        tenant_id: selectedTenant,
        start_date: startDate,
        end_date: endDate,
        rent_amount: parseFloat(rentAmount),
        security_deposit: securityDeposit ? parseFloat(securityDeposit) : null,
        notice_period_days: parseInt(noticePeriod) || 30,
        status: "active",
      });
      setActionFeedback({ type: "success", message: `Lease created successfully with reference: ${res.data.agreement_ref}` });
      setShowNewLeaseModal(false);
      // Reset form states
      setSelectedProperty("");
      setSelectedUnit("");
      setSelectedTenant("");
      setStartDate("");
      setEndDate("");
      setRentAmount("");
      setSecurityDeposit("");
      setNoticePeriod("30");
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Failed to create lease" });
    }
  };

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const activeLeases = displayLeases.filter((l: any) => l.status === "active" || l.status === "signed");
  const renewalDue = displayLeases.filter((l: any) => l.status === "renewal_due");
  const totalRent = activeLeases.reduce((s: number, l: any) => s + (Number(l.rent_amount) || Number(l.monthly_rent) || 0), 0);
  const rentCollected = MOCK_RENT_ROLL.filter((r) => r.status === "paid").reduce((s, r) => s + parseInt(r.amount.replace(/[₹,]/g, "")), 0);
  const totalRentRoll = MOCK_RENT_ROLL.reduce((s, r) => s + parseInt(r.amount.replace(/[₹,]/g, "")), 0);
  const collectionPct = totalRentRoll > 0 ? Math.round((rentCollected / totalRentRoll) * 100) : 0;

  const depositTotal = activeLeases.reduce((s: number, l: any) => s + (Number(l.security_deposit) || 0), 0) || (activeLeases.length * 50000);
  const pendingRefunds = 120000;
  const deductionsThisQ = 45000;

  const pendingMaint = MOCK_MAINTENANCE.filter((m) => m.status !== "resolved").length;
  const urgentMaint = MOCK_MAINTENANCE.filter((m) => m.priority === "high" && m.status !== "resolved").length;
  const unreadMsgs = TENANT_MESSAGES.filter((m) => m.unread).length;

  if (isLoadingDisplay) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2BAE8E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#64748B] text-sm font-medium">Loading Rental Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Apartment Rental & Tenancy</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Lease lifecycle, rent roll & deposit management</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowNewLeaseModal(true)}>
            <FileText className="w-3.5 h-3.5" /> New Lease
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

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Could not load live lease data. Displaying mock data.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {isLoadingDisplay ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">{activeLeases.length}</div>
                <Home className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Active Leases</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#F5A623" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>{renewalDue.length}</div>
                <Calendar className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs" style={{ color: "rgba(0,0,0,0.6)" }}>Renewal Due (30d)</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">{collectionPct}%</div>
                <TrendingUp className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Rent Collection</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">₹{(depositTotal / 100000).toFixed(1)}L</div>
                <Shield className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Security Deposits</div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["all", "active", "renewal_due", "signed", "terminated"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s === "all" ? undefined : s)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              background: (s === "all" && !statusFilter) || statusFilter === s ? "#1A3C5E" : "#F5F7FA",
              color: (s === "all" && !statusFilter) || statusFilter === s ? "#FFFFFF" : "#64748B",
            }}
          >{s === "all" ? "All" : s.replace("_", " ")}</button>
        ))}
      </div>

      <Card>
        <CardHeader title="Lease Agreements" subtitle={`${activeLeases.length} active \u00B7 ${renewalDue.length} renewal due`} />
        {isLoadingDisplay ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded animate-pulse" style={{ background: "#F5F7FA" }} />)}
          </div>
        ) : displayLeases.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No lease agreements found</p>
          </div>
        ) : (
          <Table
            data={displayLeases}
            keyExtractor={(l) => l.id || Math.random().toString()}
            columns={[
              { key: "tenant_name", header: "Tenant", render: (l) => <span className="font-medium text-sm">{l.tenant_name || `${l.tenant?.first_name || ""} ${l.tenant?.last_name || ""}`}</span> },
              { key: "unit_label", header: "Unit", render: (l) => <span className="text-xs">{l.unit_label || l.unit?.unit_label || "\u2014"}</span> },
              { key: "property_name", header: "Property", render: (l) => <span className="text-xs" style={{ color: "#64748B" }}>{l.property_name || l.property?.name || "\u2014"}</span> },
              { key: "start_date", header: "Start", render: (l) => <span className="text-xs" style={{ color: "#64748B" }}>{l.start_date ? new Date(l.start_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "\u2014"}</span> },
              { key: "end_date", header: "End", render: (l) => <span className="text-xs" style={{ color: "#64748B" }}>{l.end_date ? new Date(l.end_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "\u2014"}</span> },
              { key: "monthly_rent", header: "Rent", render: (l) => <span className="font-medium">₹{(Number(l.rent_amount) || Number(l.monthly_rent) || 0).toLocaleString()}</span> },
              { key: "status", header: "Status", render: (l) => (
                <Badge variant={LEASE_BADGE[l.status] || "gray"}>{l.status?.replace("_", " ") || "\u2014"}</Badge>
              )},
            ]}
          />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Rent Roll" subtitle="This month's collection" />
          <div className="space-y-2">
            {MOCK_RENT_ROLL.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < MOCK_RENT_ROLL.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                <div>
                  <div className="font-medium" style={{ color: "#1A2E44" }}>{r.tenant}</div>
                  <div className="text-xs" style={{ color: "#64748B" }}>{r.amount}</div>
                </div>
                <Badge variant={r.status === "paid" ? "teal" : r.status === "overdue" ? "red" : "amber"}>{r.status}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex items-center justify-between text-sm" style={{ borderTop: "1px solid #E2E8F0" }}>
            <span className="font-semibold" style={{ color: "#1A3C5E" }}>Total Collected</span>
            <span className="font-semibold" style={{ color: "#2BAE8E" }}>₹{rentCollected.toLocaleString()}</span>
          </div>
        </Card>
        <Card>
          <CardHeader title="Upcoming Renewals" subtitle="Next 30 days" />
          {renewalDue.length === 0 ? (
            <div className="text-center py-8">
              <BadgeCheck className="w-6 h-6 mx-auto mb-2" style={{ color: "#2BAE8E" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No renewals due</p>
            </div>
          ) : (
            renewalDue.slice(0, 5).map((l: any, i: number) => {
              const endStr = l.end_date || "";
              const daysOverdue = -18 + i * 12;
              return (
                <div key={l.id || i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < Math.min(renewalDue.length, 5) - 1 ? "1px solid #E2E8F0" : "none" }}>
                  <div>
                    <div className="font-medium" style={{ color: "#1A2E44" }}>{l.tenant_name || l.tenant?.first_name || "Tenant"}</div>
                    <div className="text-xs" style={{ color: "#64748B" }}>{endStr}</div>
                  </div>
                  <Badge variant={daysOverdue < 0 ? "red" : "amber"}>
                    {daysOverdue > 0 ? `${daysOverdue}d` : `${Math.abs(daysOverdue)}d overdue`}
                  </Badge>
                </div>
              );
            })
          )}
        </Card>
        <Card>
          <CardHeader title="Deposit Ledger" subtitle="Summary" />
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <span style={{ color: "#1A2E44" }}>Total Held</span>
              <span className="font-semibold" style={{ color: "#1A3C5E" }}>₹{(depositTotal / 100000).toFixed(2)}L</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <span style={{ color: "#1A2E44" }}>Pending Refunds</span>
              <span style={{ color: "#F5A623" }}>₹{pendingRefunds.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <span style={{ color: "#1A2E44" }}>Deductions This Q</span>
              <span style={{ color: "#E53E3E" }}>₹{deductionsThisQ.toLocaleString()}</span>
            </div>
            <div className="pt-2 mt-2" style={{ borderTop: "1px solid #E2E8F0" }}>
              <Button variant="secondary" size="sm" className="w-full" onClick={() => setActionFeedback({ type: "success", message: "Refund process initiated" })}>
                Process Refund
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Portfolio Overview" subtitle="All rental properties" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Greenwood Residency", units: "24", occupied: "21", occPct: "87%", rev: "₹5.6L" },
            { name: "Lakeview Apartments", units: "12", occupied: "10", occPct: "83%", rev: "₹3.8L" },
            { name: "Viswa Service Apartments", units: "18", occupied: "15", occPct: "83%", rev: "₹4.2L" },
          ].map((p) => (
            <div key={p.name} className="p-4 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="font-semibold text-sm mb-2" style={{ color: "#1A3C5E" }}>{p.name}</div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div><div className="font-bold" style={{ color: "#1A2E44" }}>{p.occupied}/{p.units}</div><span style={{ color: "#64748B" }}>Occupied</span></div>
                <div><div className="font-bold" style={{ color: "#2BAE8E" }}>{p.occPct}</div><span style={{ color: "#64748B" }}>Occ.%</span></div>
                <div><div className="font-bold" style={{ color: "#1A3C5E" }}>{p.rev}</div><span style={{ color: "#64748B" }}>Revenue</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Maintenance Requests"
            subtitle={`${pendingMaint} pending \u00B7 ${urgentMaint} urgent`}
          />
          <div className="space-y-2">
            {MOCK_MAINTENANCE.map((m, i) => (
              <div key={m.id} className="flex items-start justify-between p-3 rounded-lg text-sm" style={{ background: "#F5F7FA" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5" style={{ color: m.priority === "high" ? "#E53E3E" : m.priority === "medium" ? "#F5A623" : "#64748B" }} />
                    <span className="font-medium" style={{ color: "#1A2E44" }}>{m.issue}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#64748B" }}>
                    <span>{m.unit}</span>
                    <span>\u00B7</span>
                    <span>{m.tenant}</span>
                    <span>\u00B7</span>
                    <span>Reported: {m.reported}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <Badge variant={m.priority === "high" ? "red" : m.priority === "medium" ? "amber" : "gray"}>{m.priority}</Badge>
                  <Badge variant={m.status === "in_progress" ? "navy" : m.status === "scheduled" ? "amber" : m.status === "resolved" ? "teal" : "gray"}>
                    {m.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid #E2E8F0" }}>
            <button className="text-xs font-medium hover:underline" style={{ color: "#2BAE8E" }}>
              View All Maintenance Requests
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Tenant Communication"
            subtitle={`${unreadMsgs} unread messages`}
          />
          <div className="space-y-1">
            {TENANT_MESSAGES.map((msg, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg text-sm transition-colors hover:bg-opacity-50" style={{ background: msg.unread ? "rgba(42,157,143,0.06)" : "transparent" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: msg.unread ? "#2BAE8E" : "#CBD5E1" }}>
                  {msg.from.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-xs ${msg.unread ? "" : ""}`} style={{ color: msg.unread ? "#1A2E44" : "#64748B" }}>
                      {msg.from}
                    </span>
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>{msg.date}</span>
                  </div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: "#1A3C5E" }}>{msg.subject}</div>
                  <div className="text-xs truncate mt-0.5" style={{ color: "#94A3B8" }}>{msg.preview}</div>
                </div>
                {msg.unread && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#2BAE8E" }} />}
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid #E2E8F0" }}>
            <button className="text-xs font-medium hover:underline" style={{ color: "#2BAE8E" }}>
              Open Message Center
            </button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Property Performance Comparison" subtitle="Key metrics by property" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ color: "#64748B" }}>
                  <th className="text-left py-2 pr-3 font-medium">Property</th>
                  <th className="text-center py-2 px-2 font-medium">Occ.%</th>
                  <th className="text-center py-2 px-2 font-medium">Avg Rent</th>
                  <th className="text-center py-2 px-2 font-medium">Collection</th>
                  <th className="text-center py-2 px-2 font-medium">Satisfaction</th>
                  <th className="text-right py-2 pl-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {PROPERTY_COMPARISON.map((p, i) => (
                  <tr key={p.name} style={{ borderBottom: i < PROPERTY_COMPARISON.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                    <td className="py-2.5 pr-3">
                      <span className="font-medium" style={{ color: "#1A2E44" }}>{p.name}</span>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <span style={{ color: p.occupancy >= 85 ? "#2BAE8E" : "#F5A623" }}>{p.occupancy}%</span>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <span style={{ color: "#1A3C5E" }}>₹{p.avgRent.toLocaleString()}</span>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-10 h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                          <div className="h-full rounded-full" style={{ width: `${p.collection}%`, background: p.collection >= 90 ? "#2BAE8E" : "#F5A623" }} />
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <span style={{ color: "#1A2E44" }}>{p.satisfaction.toFixed(1)}</span>
                    </td>
                    <td className="text-right py-2.5 pl-3">
                      <span className="font-semibold" style={{ color: "#1A3C5E" }}>₹{(p.revenue / 100000).toFixed(1)}L</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Notice Period Tracking" subtitle="Tenants with active notices" />
          <div className="space-y-2">
            {NOTICE_PERIOD_TRACKING.map((n, i) => (
              <div key={n.tenant} className="flex items-center justify-between p-3 rounded-lg text-sm" style={{ background: n.status === "active" ? "rgba(245,166,35,0.08)" : n.status === "completed" ? "rgba(42,157,143,0.08)" : "#F5F7FA" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {n.status === "active" ? <Timer className="w-3.5 h-3.5" style={{ color: "#F5A623" }} /> : n.status === "completed" ? <CheckCircle className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} /> : <Clock className="w-3.5 h-3.5" style={{ color: "#64748B" }} />}
                    <span className="font-medium" style={{ color: "#1A2E44" }}>{n.tenant}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "#64748B" }}>
                    <span>{n.unit}</span>
                    <span>\u00B7</span>
                    <span>Move-out: {n.moveOutDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {n.status === "active" && (
                    <div className="text-center">
                      <div className="font-bold text-xs" style={{ color: "#F5A623" }}>{n.daysLeft}d</div>
                      <div className="text-[9px]" style={{ color: "#94A3B8" }}>left</div>
                    </div>
                  )}
                  <Badge variant={n.status === "active" ? "amber" : n.status === "completed" ? "teal" : "gray"}>{n.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 2 upcoming vacancies</span>
            <button className="font-medium hover:underline" style={{ color: "#2BAE8E" }}>Manage Notice Periods</button>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Rental Income Forecast" subtitle="Next 3 months projection" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RENT_FORECAST.map((f, i) => {
            const maxVal = Math.max(...RENT_FORECAST.map((x) => x.expected));
            const barH = (f.expected / maxVal) * 100;
            return (
              <div key={f.month} className="p-4 rounded-lg" style={{ background: i === 0 ? "rgba(42,157,143,0.06)" : "#F5F7FA" }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm" style={{ color: "#1A3C5E" }}>{f.month}</h4>
                  <Badge variant="teal">Forecast</Badge>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <div className="text-2xl font-bold" style={{ color: "#1A3C5E" }}>₹{(f.expected / 1000).toFixed(0)}K</div>
                  <div className="text-xs mb-1" style={{ color: "#64748B" }}>expected</div>
                </div>
                <div className="h-2 rounded-full" style={{ background: "#E2E8F0" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${barH}%`, background: i === 0 ? "#2BAE8E" : i === 1 ? "#1A3C5E" : "#64748B" }} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="p-2 rounded text-center" style={{ background: "rgba(42,157,143,0.1)" }}>
                    <div className="font-semibold" style={{ color: "#2BAE8E" }}>+{f.newLeases}</div>
                    <span style={{ color: "#64748B" }}>New Leases</span>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: "rgba(229,62,62,0.08)" }}>
                    <div className="font-semibold" style={{ color: "#E53E3E" }}>-{f.expiring}</div>
                    <span style={{ color: "#64748B" }}>Expiring</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" style={{ color: "#2BAE8E" }} /> Projected growth: +8.2% QoQ</span>
          <button className="font-medium hover:underline" style={{ color: "#2BAE8E" }}>Generate Detailed Forecast</button>
        </div>
      </Card>

      {/* New Lease Modal Overlay */}
      {showNewLeaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h3 className="text-lg font-bold" style={{ color: "#1A3C5E" }}>Create New Lease Agreement</h3>
              <button onClick={() => setShowNewLeaseModal(false)} className="text-sm font-semibold hover:underline" style={{ color: "#64748B" }}>✕ Close</button>
            </div>

            <form onSubmit={handleCreateLease} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: "#1A2E44" }}>Tenant / Resident *</label>
                <select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} required className="w-full p-2 border rounded-lg text-sm bg-white outline-none focus:border-[#2BAE8E]" style={{ borderColor: "#E2E8F0" }}>
                  <option value="">Select Tenant</option>
                  {guests?.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.first_name} {g.last_name} ({g.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: "#1A2E44" }}>Rental Property *</label>
                  <select value={selectedProperty} onChange={(e) => { setSelectedProperty(e.target.value); setSelectedUnit(""); }} required className="w-full p-2 border rounded-lg text-sm bg-white outline-none focus:border-[#2BAE8E]" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Select Property</option>
                    {properties?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: "#1A2E44" }}>Vacant Apartment Unit *</label>
                  <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} required disabled={!selectedProperty} className="w-full p-2 border rounded-lg text-sm bg-white outline-none focus:border-[#2BAE8E] disabled:bg-gray-100" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Select Unit</option>
                    {(properties?.find((p: any) => p.id === selectedProperty)?.units?.filter((u: any) => u.status === "vacant" && u.unit_type === "apartment") || []).map((u: any) => (
                      <option key={u.id} value={u.id}>{u.unit_label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: "#1A2E44" }}>Monthly Rent (₹) *</label>
                  <input type="number" min="1" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} required placeholder="25000" className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#2BAE8E]" style={{ borderColor: "#E2E8F0" }} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: "#1A2E44" }}>Security Deposit (₹)</label>
                  <input type="number" min="0" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} placeholder="50000" className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#2BAE8E]" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: "#1A2E44" }}>Lease Start Date *</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#2BAE8E]" style={{ borderColor: "#E2E8F0" }} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold" style={{ color: "#1A2E44" }}>Lease End Date *</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#2BAE8E]" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold" style={{ color: "#1A2E44" }}>Notice Period (Days) *</label>
                <input type="number" min="1" value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} required className="w-full p-2 border rounded-lg text-sm outline-none focus:border-[#2BAE8E]" style={{ borderColor: "#E2E8F0" }} />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button variant="outline" type="button" size="sm" onClick={() => setShowNewLeaseModal(false)}>Cancel</Button>
                <Button variant="secondary" type="submit" size="sm" disabled={isCreatingLease}>
                  {isCreatingLease ? "Creating..." : "Create Lease"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
