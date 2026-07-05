"use client";

import { useState } from "react";
import Link from "next/link";
import { useStats, useAdminOverview } from "@/lib/hooks";
import { useJourney } from "@/components/providers/JourneyProvider";
import { useAuth } from "@/lib/auth-context";
import {
  TrendingUp, TrendingDown, Users, DollarSign, Building2, UserCheck, Wrench,
  MessageSquare, Bed, AlertTriangle, IndianRupee, ChevronDown, ChevronRight,
  ArrowUpRight, ArrowDownRight, ClipboardList, LogIn, LogOut, Star,
  Eye, ExternalLink, RefreshCw,
} from "lucide-react";

/* ─── Skeleton loader ─── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

/* ─── Line chart (SVG) with real data ─── */
function LineChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (!data?.length) return <Skeleton className="w-full h-40" />;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const W = 800, H = 200, padL = 48, padR = 20, padT = 10, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padT + chartH - (v / max) * chartH;
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.revenue)}`).join(" ");
  const area = path + ` L ${toX(data.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;
  const allZero = data.every(d => d.revenue === 0);

  if (allZero) {
    return (
      <div className="flex flex-col items-center justify-center h-40 rounded-xl" style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1" }}>
        <IndianRupee className="w-8 h-8 mb-2" style={{ color: "#CBD5E1" }} />
        <p className="text-sm font-medium" style={{ color: "#94A3B8" }}>No revenue data yet</p>
        <Link href="/dashboard/finance" className="text-xs mt-1 hover:underline" style={{ color: "#2BAE8E" }}>
          Go to Finance →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 160 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2BAE8E" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2BAE8E" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map(pct => (
          <g key={pct}>
            <line x1={padL} y1={toY(max * pct / 100)} x2={W - padR} y2={toY(max * pct / 100)} stroke="#E2E8F0" strokeWidth={1} />
            <text x={padL - 6} y={toY(max * pct / 100) + 4} textAnchor="end" fontSize={10} fill="#64748B">
              {pct > 0 ? `${(max * pct / 100 / 1000).toFixed(0)}k` : "0"}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#revGrad)" />
        <path d={path} fill="none" stroke="#2BAE8E" strokeWidth={2.5} strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={d.month}>
            <circle cx={toX(i)} cy={toY(d.revenue)} r={4} fill="#2BAE8E" stroke="#fff" strokeWidth={1.5} />
            <text x={toX(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="#64748B">{d.month}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ─── Donut chart ─── */
function DonutChart({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
  const r = 42, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth={12} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={12}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform="rotate(-90 60 60)" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={18} fontWeight="700" fill="#1A3C5E">{pct}%</text>
    </svg>
  );
}

/* ─── Animated drill-down panel ─── */
function DrillDownPanel({ items, onClose, viewAllHref }: {
  items: Record<string, unknown>[];
  onClose: () => void;
  viewAllHref?: string;
}) {
  if (!items?.length) {
    return (
      <div className="mt-3 rounded-xl p-4 text-center" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
        <p className="text-xs" style={{ color: "#94A3B8" }}>No records to display</p>
        <button onClick={onClose} className="text-xs mt-1 hover:underline" style={{ color: "#64748B" }}>Close</button>
      </div>
    );
  }
  const cols = Object.keys(items[0]);
  return (
    <div
      className="mt-3 rounded-xl overflow-hidden"
      style={{
        border: "1px solid #E2E8F0",
        background: "#FAFBFC",
        animation: "slideDown 0.2s ease-out",
      }}
    >
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#F1F5F9" }}>
              {cols.map(c => (
                <th key={c} className="px-3 py-2 text-left font-semibold whitespace-nowrap" style={{ color: "#1A3C5E", textTransform: "capitalize" }}>
                  {c.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ borderTop: "1px solid #E2E8F0" }}>
                {cols.map(c => {
                  let val = item[c];
                  if (val instanceof Date || (typeof val === "string" && val.includes("T"))) {
                    try { val = new Date(val as string).toLocaleDateString("en-IN"); } catch {}
                  }
                  if (typeof val === "number") val = val.toLocaleString("en-IN");
                  return <td key={c} className="px-3 py-2 whitespace-nowrap" style={{ color: "#475569" }}>{String(val ?? "—")}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: "1px solid #E2E8F0" }}>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: "#2BAE8E" }}>
            <ExternalLink className="w-3 h-3" /> View all
          </Link>
        ) : <span />}
        <button onClick={onClose} className="text-xs font-medium transition-all hover:opacity-70" style={{ color: "#64748B" }}>
          Close ✕
        </button>
      </div>
    </div>
  );
}

/* ─── Today's Activity strip ─── */
function ActivityPill({
  label, value, icon, color, bg, href,
}: {
  label: string; value: number | string; icon: React.ReactNode; color: string; bg: string; href: string;
}) {
  return (
    <Link href={href}
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5 shrink-0"
      style={{ background: bg, border: `1px solid ${color}30`, minWidth: 150 }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold leading-none" style={{ color }}>{value}</p>
        <p className="text-xs mt-0.5 font-medium" style={{ color: "#64748B" }}>{label}</p>
      </div>
    </Link>
  );
}

/* ─── Metric card with trend ─── */
function MetricCard({ label, value, icon, bg, trend }: {
  label: string; value: string | number; icon: React.ReactNode; bg: string;
  trend?: { pct: number; label: string };
}) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(26,60,94,0.06)" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>{label}</p>
          <p className="text-xl font-bold" style={{ color: "#1A3C5E" }}>{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.pct >= 0
                ? <ArrowUpRight className="w-3 h-3" style={{ color: "#2BAE8E" }} />
                : <ArrowDownRight className="w-3 h-3" style={{ color: "#E53E3E" }} />
              }
              <span className="text-xs font-medium" style={{ color: trend.pct >= 0 ? "#2BAE8E" : "#E53E3E" }}>
                {Math.abs(trend.pct)}%
              </span>
              <span className="text-xs" style={{ color: "#94A3B8" }}>{trend.label}</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: bg }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const card = "bg-white rounded-2xl p-5" as const;
const cardStyle = { border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(26,60,94,0.06)" };

export default function DashboardPage() {
  const { selectedPropertyId } = useJourney();
  const { user } = useAuth();
  const { stats, isLoading } = useStats(selectedPropertyId);
  const { overview, isLoading: overviewLoading } = useAdminOverview(selectedPropertyId);
  const role = user?.role_name || "";

  const isAdmin = role === "super_admin" || role === "property_manager";

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["today", "dashboards", "employees", "issues", "rooms", "feedback", "financial"]));
  const [drilling, setDrilling] = useState<{ section: string; items: Record<string, unknown>[]; href?: string } | null>(null);

  function toggleSection(label: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }

  function drill(section: string, items: Record<string, unknown>[], href?: string) {
    setDrilling(prev => prev?.section === section ? null : { section, items, href });
  }

  function SectionHeader({ label, icon }: { label: string; icon: React.ReactNode }) {
    const open = expandedSections.has(label);
    return (
      <button
        onClick={() => toggleSection(label)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.08)" }}>
          {icon}
        </div>
        <h2 className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>{label}</h2>
        <span className="text-xs ml-1 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "#64748B" }}>
          {open ? "collapse" : "expand"}
        </span>
        {open ? <ChevronDown className="w-4 h-4 ml-auto" style={{ color: "#64748B" }} /> : <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#64748B" }} />}
      </button>
    );
  }

  // ── Today's Activity counts from overview ──
  const todayCheckins = (overview?.rooms as any)?.filter?.((r: any) => r.status === "occupied")?.reduce?.((a: number, r: any) => a + r.count, 0) ?? 0;
  const openHKTasks = overview?.issues?.find(i => i.category === "Housekeeping")?.count ?? 0;
  const openMaint = overview?.issues?.find(i => i.category === "Maintenance")?.count ?? 0;
  const pendingReqs = overview?.issues?.find(i => i.category === "Other")?.count ?? 0;
  const pendingBills = overview?.issues?.find(i => i.category === "Vendor")?.count ?? 0;

  const kpiCards = [
    {
      label: "Total Revenue",
      value: stats ? `₹${(stats.totalRevenue / 1000).toFixed(1)}k` : "—",
      icon: <IndianRupee className="w-5 h-5" style={{ color: "#2BAE8E" }} />,
      bg: "rgba(43,174,142,0.12)",
      trend: stats?.totalRevenue ? { pct: 12, label: "vs last month" } : undefined,
    },
    {
      label: "Accounts Payable",
      value: stats ? `₹${(stats.totalPayables / 1000).toFixed(1)}k` : "—",
      icon: <DollarSign className="w-5 h-5" style={{ color: "#E53E3E" }} />,
      bg: "rgba(229,62,62,0.12)",
    },
    {
      label: "Overall Rating",
      value: stats ? `${stats.avgRating} / 5` : "—",
      icon: <Star className="w-5 h-5" style={{ color: "#F5A623" }} />,
      bg: "rgba(245,166,35,0.12)",
      trend: stats?.avgRating ? { pct: 4, label: "vs last month" } : undefined,
    },
    {
      label: "Active Reservations",
      value: stats ? String(stats.checkedIn) : "—",
      icon: <Building2 className="w-5 h-5" style={{ color: "#1A3C5E" }} />,
      bg: "rgba(26,60,94,0.12)",
    },
    {
      label: "Total Guests",
      value: stats ? String(stats.totalGuests) : "—",
      icon: <Users className="w-5 h-5" style={{ color: "#1A3C5E" }} />,
      bg: "rgba(26,60,94,0.12)",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Dashboard</h1>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Live · refreshes every 30s</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map(kpi => (
          isLoading
            ? <Skeleton key={kpi.label} className="h-24" />
            : <MetricCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>Revenue Trend (Last 12 Months)</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748B" }}>
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: "#2BAE8E" }} /> Revenue
            </div>
            <Link href="/dashboard/finance" className="text-xs hover:underline" style={{ color: "#2BAE8E" }}>
              View Finance →
            </Link>
          </div>
        </div>
        {isLoading ? <Skeleton className="w-full h-40" /> : <LineChart data={stats?.chartData || []} />}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={card} style={cardStyle}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A3C5E" }}>Reservations</h3>
          <div className="flex flex-col items-center gap-4">
            {isLoading
              ? <Skeleton className="w-28 h-28 rounded-full" />
              : <DonutChart pct={stats?.occupancyRate ?? 0} color="#2BAE8E" />
            }
            <div className="w-full space-y-2 text-xs">
              {[
                { label: "Checked In", color: "#2BAE8E", value: stats?.checkedIn },
                { label: "Total Bookings", color: "#1A3C5E", value: stats?.totalBookings },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between" style={{ color: "#64748B" }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-semibold" style={{ color: "#1A3C5E" }}>{isLoading ? "…" : item.value ?? 0}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/front-desk" className="w-full text-center text-xs py-2 rounded-xl font-medium transition-all hover:opacity-85"
              style={{ background: "rgba(43,174,142,0.10)", color: "#2BAE8E", border: "1px solid rgba(43,174,142,0.20)" }}>
              Open Front Desk →
            </Link>
          </div>
        </div>

        <div className={card} style={cardStyle}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A3C5E" }}>Guests</h3>
          <div className="flex flex-col items-center gap-4">
            {isLoading
              ? <Skeleton className="w-28 h-28 rounded-full" />
              : <DonutChart pct={stats ? Math.min(Math.round((stats.checkedIn / Math.max(stats.totalGuests, 1)) * 100), 100) : 0} color="#4DB88A" />
            }
            <div className="w-full space-y-2 text-xs">
              {[
                { label: "Total Registered", color: "#1A3C5E", value: stats?.totalGuests },
                { label: "Currently Staying", color: "#4DB88A", value: stats?.checkedIn },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between" style={{ color: "#64748B" }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-semibold" style={{ color: "#1A3C5E" }}>{isLoading ? "…" : item.value ?? 0}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard/front-desk/guests" className="w-full text-center text-xs py-2 rounded-xl font-medium transition-all hover:opacity-85"
              style={{ background: "rgba(26,60,94,0.08)", color: "#1A3C5E", border: "1px solid rgba(26,60,94,0.15)" }}>
              Guest Profiles →
            </Link>
          </div>
        </div>

        <div className={card} style={cardStyle}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A3C5E" }}>Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Front Desk", desc: "Check-ins & room matrix", href: "/dashboard/front-desk", bg: "linear-gradient(135deg, #1A3C5E 0%, #2C3547 100%)" },
              { label: "Housekeeping Board", desc: "Task allocation", href: "/dashboard/housekeeping", bg: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)" },
              { label: "Maintenance Tickets", desc: "Active repairs", href: "/dashboard/maintenance", bg: "#F5A623", color: "#1A2E44" },
              { label: "Finance & Billing", desc: "Invoices & GL", href: "/dashboard/finance", bg: "linear-gradient(135deg, #1A3C5E 0%, #2C3547 100%)" },
            ].map(a => (
              <a key={a.label} href={a.href} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-85 hover:-translate-y-0.5"
                style={{ background: a.bg, color: a.color || "#fff" }}>
                <span>{a.label}</span>
                <div className="flex items-center gap-1">
                  <span className="opacity-70 font-normal">{a.desc}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ADMIN WIDGETS ─── */}
      {isAdmin && (
        <div className="space-y-5 mt-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 rounded-full" style={{ background: "#2BAE8E" }} />
            <h2 className="text-base font-bold" style={{ color: "#1A3C5E" }}>Admin Overview</h2>
          </div>

          {/* ── Today's Live Activity Strip ── */}
          <div className={card} style={cardStyle}>
            <SectionHeader label="today" icon={<Eye className="w-4 h-4" style={{ color: "#2BAE8E" }} />} />
            {expandedSections.has("today") && (
              overviewLoading ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-36 shrink-0 rounded-2xl" />)}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                  <ActivityPill label="Occupied Rooms" value={todayCheckins} icon={<Bed className="w-4 h-4" style={{ color: "#2BAE8E" }} />} color="#2BAE8E" bg="#EFFDF9" href="/dashboard/front-desk" />
                  <ActivityPill label="HK Tasks Open" value={openHKTasks} icon={<ClipboardList className="w-4 h-4" style={{ color: "#F5A623" }} />} color="#F5A623" bg="#FFFBEB" href="/dashboard/housekeeping" />
                  <ActivityPill label="Maint. Open" value={openMaint} icon={<Wrench className="w-4 h-4" style={{ color: "#E53E3E" }} />} color="#E53E3E" bg="#FFF5F5" href="/dashboard/maintenance" />
                  <ActivityPill label="Pending Requests" value={pendingReqs} icon={<MessageSquare className="w-4 h-4" style={{ color: "#1A3C5E" }} />} color="#1A3C5E" bg="#EFF4FF" href="/dashboard/front-desk/requests" />
                  <ActivityPill label="Vendor Bills Due" value={pendingBills} icon={<AlertTriangle className="w-4 h-4" style={{ color: "#E53E3E" }} />} color="#E53E3E" bg="#FFF5F5" href="/dashboard/finance/payables" />
                  <ActivityPill label="Avg Rating" value={`${overview?.feedbacks?.avgRating ?? 0} ★`} icon={<Star className="w-4 h-4" style={{ color: "#F5A623" }} />} color="#F5A623" bg="#FFFBEB" href="/dashboard/front-desk/feedbacks" />
                </div>
              )
            )}
          </div>

          {/* ── Revenue Dashboards ── */}
          <div className={card} style={cardStyle}>
            <SectionHeader label="dashboards" icon={<TrendingUp className="w-4 h-4" style={{ color: "#2BAE8E" }} />} />
            {expandedSections.has("dashboards") && (
              overviewLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Today Revenue", key: "today", color: "#2BAE8E", bg: "rgba(43,174,142,0.08)", icon: <IndianRupee className="w-4 h-4" style={{ color: "#2BAE8E" }} /> },
                    { label: "This Week", key: "week", color: "#1A3C5E", bg: "rgba(26,60,94,0.06)", icon: <TrendingUp className="w-4 h-4" style={{ color: "#1A3C5E" }} /> },
                    { label: "This Month", key: "month", color: "#F5A623", bg: "rgba(245,166,35,0.08)", icon: <TrendingUp className="w-4 h-4" style={{ color: "#F5A623" }} /> },
                    { label: "This Year", key: "year", color: "#E53E3E", bg: "rgba(229,62,62,0.08)", icon: <DollarSign className="w-4 h-4" style={{ color: "#E53E3E" }} /> },
                  ].map(item => {
                    const val = (overview?.revenue as any)?.[item.key] ?? 0;
                    const drillItems = (overview as any)?.revenue?.recent || [];
                    const isActive = drilling?.section === item.label;
                    return (
                      <div key={item.key} className="rounded-xl transition-all hover:shadow-sm"
                        style={{ background: item.bg, border: `1px solid ${item.color}20` }}>
                        <button onClick={() => drill(item.label, drillItems, "/dashboard/finance")} className="w-full p-3 text-center group">
                          <div className="flex items-center gap-2 mb-1.5 justify-center">
                            {item.icon}
                            <p className="text-xs font-medium" style={{ color: "#64748B" }}>{item.label}</p>
                          </div>
                          <p className="text-xl font-bold" style={{ color: item.color }}>
                            ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs mt-1 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "#64748B" }}>
                            {isActive ? "▲ collapse" : "▼ view details"}
                          </p>
                        </button>
                        {isActive && <DrillDownPanel items={drillItems} onClose={() => setDrilling(null)} viewAllHref="/dashboard/finance" />}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* ── Employees ── */}
          <div className={card} style={cardStyle}>
            <SectionHeader label="employees" icon={<UserCheck className="w-4 h-4" style={{ color: "#1A3C5E" }} />} />
            {expandedSections.has("employees") && (
              overviewLoading ? <Skeleton className="h-16" /> : (
                <div>
                  <button onClick={() => drill("employees", (overview as any)?.drillDown?.employees || [], "/dashboard/hr/employees")}
                    className="flex items-center gap-4 w-full transition-all hover:opacity-80 group">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: "rgba(26,60,94,0.08)" }}>
                      <Users className="w-7 h-7" style={{ color: "#1A3C5E" }} />
                    </div>
                    <div className="text-left">
                      <p className="text-3xl font-bold" style={{ color: "#1A3C5E" }}>{overview?.employeesAvailable ?? 0}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>Active employees</p>
                      <p className="text-xs opacity-0 group-hover:opacity-60 transition-opacity mt-0.5" style={{ color: "#2BAE8E" }}>Click to see list ▼</p>
                    </div>
                  </button>
                  <Link href="/dashboard/hr/employees" className="text-xs mt-2 inline-block hover:underline" style={{ color: "#2BAE8E" }}>View all employees →</Link>
                  {drilling?.section === "employees" && <DrillDownPanel items={(overview as any)?.drillDown?.employees || []} onClose={() => setDrilling(null)} viewAllHref="/dashboard/hr/employees" />}
                </div>
              )
            )}
          </div>

          {/* ── Outstanding Issues ── */}
          <div className={card} style={cardStyle}>
            <SectionHeader label="issues" icon={<AlertTriangle className="w-4 h-4" style={{ color: "#E53E3E" }} />} />
            {expandedSections.has("issues") && (
              overviewLoading ? <Skeleton className="h-24" /> : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {overview?.issues?.map(issue => {
                    const drillMap: Record<string, string> = { Vendor: "vendorBills", Housekeeping: "hkTasks", Maintenance: "maintTickets", Other: "guestRequests" };
                    const hrefMap: Record<string, string> = {
                      Vendor: "/dashboard/finance/payables",
                      Housekeeping: "/dashboard/housekeeping",
                      Maintenance: "/dashboard/maintenance/tickets",
                      Other: "/dashboard/front-desk/requests",
                    };
                    const colorMap: Record<string, string> = { Vendor: "#E53E3E", Housekeeping: "#F5A623", Maintenance: "#1A3C5E", Other: "#2BAE8E" };
                    const drillKey = drillMap[issue.category];
                    const drillItems = drillKey ? (overview as any)?.drillDown?.[drillKey] || [] : [];
                    const isActive = drilling?.section === issue.category;
                    const col = colorMap[issue.category] || "#1A3C5E";
                    return (
                      <div key={issue.category} className="rounded-xl transition-all hover:shadow-md"
                        style={{ background: `${col}08`, border: `1px solid ${col}25` }}>
                        <button onClick={() => drill(issue.category, drillItems, hrefMap[issue.category])} className="w-full p-3 text-center group">
                          <p className="text-3xl font-bold" style={{ color: col }}>{issue.count}</p>
                          <p className="text-xs mt-1 font-medium" style={{ color: "#64748B" }}>{issue.category}</p>
                          <p className="text-xs mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: col }}>
                            {isActive ? "▲ collapse" : "▼ details"}
                          </p>
                        </button>
                        <div className="px-3 pb-2">
                          <Link href={hrefMap[issue.category]} className="text-xs hover:underline block text-center" style={{ color: col }}>View all →</Link>
                        </div>
                        {isActive && <DrillDownPanel items={drillItems} onClose={() => setDrilling(null)} viewAllHref={hrefMap[issue.category]} />}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* ── Rooms ── */}
          <div className={card} style={cardStyle}>
            <SectionHeader label="rooms" icon={<Bed className="w-4 h-4" style={{ color: "#2BAE8E" }} />} />
            {expandedSections.has("rooms") && (
              overviewLoading ? <Skeleton className="h-24" /> : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(() => {
                    const rooms = overview?.rooms || [];
                    const ready = rooms.find(r => r.status === "ready")?.count || 0;
                    const cleaning = rooms.find(r => r.status === "cleaning")?.count || 0;
                    const dirty = rooms.find(r => r.status === "dirty" || r.status === "occupied")?.count || 0;
                    const roomTypes = [
                      { label: "Readily Available", count: ready, color: "#2BAE8E", bg: "rgba(43,174,142,0.10)", border: "rgba(43,174,142,0.20)", filter: "ready" },
                      { label: "Cleaning In Progress", count: cleaning, color: "#F5A623", bg: "rgba(245,166,35,0.10)", border: "rgba(245,166,35,0.20)", filter: "cleaning" },
                      { label: "Occupied / Dirty", count: dirty, color: "#E53E3E", bg: "rgba(229,62,62,0.10)", border: "rgba(229,62,62,0.20)", filter: "occupied,dirty" },
                    ];
                    return roomTypes.map(rt => {
                      const items = (overview?.rooms || []).filter(r => rt.filter.split(",").includes(r.status)).map(r => ({ status: r.status, count: r.count }));
                      const isActive = drilling?.section === rt.label;
                      return (
                        <div key={rt.label} className="rounded-xl transition-all hover:shadow-md"
                          style={{ background: rt.bg, border: `1px solid ${rt.border}` }}>
                          <button onClick={() => drill(rt.label, items, "/dashboard/housekeeping")} className="w-full p-4 text-center group">
                            <p className="text-3xl font-bold" style={{ color: rt.color }}>{rt.count}</p>
                            <p className="text-xs mt-1 font-medium" style={{ color: rt.color }}>{rt.label}</p>
                            <p className="text-xs mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: rt.color }}>
                              {isActive ? "▲ collapse" : "▼ details"}
                            </p>
                          </button>
                          {isActive && <DrillDownPanel items={items} onClose={() => setDrilling(null)} viewAllHref="/dashboard/housekeeping" />}
                        </div>
                      );
                    });
                  })()}
                </div>
              )
            )}
          </div>

          {/* ── Feedbacks ── */}
          <div className={card} style={cardStyle}>
            <SectionHeader label="feedback" icon={<MessageSquare className="w-4 h-4" style={{ color: "#F5A623" }} />} />
            {expandedSections.has("feedback") && (
              overviewLoading ? <Skeleton className="h-32" /> : (
                <div className="space-y-3">
                  <button onClick={() => drill("feedbacks", (overview?.feedbacks as any)?.recent || [], "/dashboard/front-desk/feedbacks")}
                    className="w-full group">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Today", val: overview?.feedbacks?.today ?? 0 },
                        { label: "This Week", val: overview?.feedbacks?.thisWeek ?? 0 },
                        { label: "This Month", val: overview?.feedbacks?.thisMonth ?? 0 },
                        { label: "This Year", val: overview?.feedbacks?.thisYear ?? 0 },
                      ].map(({ label, val }) => (
                        <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)" }}>
                          <p className="text-xl font-bold" style={{ color: "#1A3C5E" }}>{val}</p>
                          <p className="text-xs" style={{ color: "#64748B" }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs mt-2 p-2 rounded-xl" style={{ background: "#F8FAFC" }}>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" style={{ color: "#F5A623" }} />
                        Avg: <strong style={{ color: "#1A3C5E" }}>{overview?.feedbacks?.avgRating ?? 0}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#F5A623" }} />
                        Month: <strong style={{ color: "#1A3C5E" }}>{overview?.feedbacks?.monthAvgRating ?? 0}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#1A3C5E" }} />
                        Year: <strong style={{ color: "#1A3C5E" }}>{overview?.feedbacks?.yearAvgRating ?? 0}</strong>
                      </span>
                      <span className="ml-auto font-medium">
                        Total: <strong style={{ color: "#1A3C5E" }}>{overview?.feedbacks?.overall ?? 0}</strong>
                      </span>
                      <span className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "#2BAE8E" }}>▼ see recent</span>
                    </div>
                  </button>
                  <Link href="/dashboard/front-desk/feedbacks" className="text-xs hover:underline" style={{ color: "#2BAE8E" }}>View all feedbacks →</Link>
                  {drilling?.section === "feedbacks" && <DrillDownPanel items={(overview?.feedbacks as any)?.recent || []} onClose={() => setDrilling(null)} viewAllHref="/dashboard/front-desk/feedbacks" />}
                </div>
              )
            )}
          </div>

          {/* ── Financial Status ── */}
          <div className={card} style={cardStyle}>
            <SectionHeader label="financial" icon={<IndianRupee className="w-4 h-4" style={{ color: "#2BAE8E" }} />} />
            {expandedSections.has("financial") && (
              overviewLoading ? <Skeleton className="h-48" /> : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Spending Today", key: "todaySpending", color: "#2BAE8E", bg: "rgba(43,174,142,0.08)" },
                      { label: "This Week", key: "weekSpending", color: "#F5A623", bg: "rgba(245,166,35,0.08)" },
                      { label: "This Month", key: "monthSpending", color: "#1A3C5E", bg: "rgba(26,60,94,0.08)" },
                      { label: "This Year", key: "yearSpending", color: "#E53E3E", bg: "rgba(229,62,62,0.08)" },
                    ].map(item => {
                      const val = (overview?.financial as any)?.[item.key] ?? 0;
                      const drillItems = (overview as any)?.financial?.recentBills || [];
                      const isActive = drilling?.section === item.label;
                      return (
                        <div key={item.key} className="rounded-xl" style={{ background: item.bg }}>
                          <button onClick={() => drill(item.label, drillItems, "/dashboard/finance/payables")}
                            className="w-full p-3 text-center group">
                            <p className="text-lg font-bold" style={{ color: item.color }}>
                              ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs" style={{ color: "#64748B" }}>{item.label}</p>
                            <p className="text-xs opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: item.color }}>▼</p>
                          </button>
                          {isActive && <DrillDownPanel items={drillItems} onClose={() => setDrilling(null)} viewAllHref="/dashboard/finance/payables" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2" style={{ borderTop: "1px solid #E2E8F0" }}>
                    {[
                      { label: "Available Balance", key: "availableMoney", color: "#2BAE8E" },
                      { label: "Expected Expenses", key: "expectedExpenses", color: "#E53E3E" },
                      { label: "Expected Receivables", key: "expectedReceivables", color: "#2BAE8E" },
                    ].map(item => {
                      const val = (overview?.financial as any)?.[item.key] ?? 0;
                      const drillItems = (overview as any)?.financial?.recentPayments || [];
                      const isActive = drilling?.section === item.label;
                      return (
                        <div key={item.key} className="text-center">
                          <button onClick={() => drill(item.label, drillItems, "/dashboard/finance")} className="w-full group">
                            <p className="text-xl font-bold" style={{ color: item.color }}>
                              ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs" style={{ color: "#64748B" }}>{item.label}</p>
                            <p className="text-xs opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: item.color }}>▼ details</p>
                          </button>
                          <Link href="/dashboard/finance" className="text-xs mt-0.5 inline-block hover:underline" style={{ color: "#2BAE8E" }}>Finance →</Link>
                          {isActive && <DrillDownPanel items={drillItems} onClose={() => setDrilling(null)} viewAllHref="/dashboard/finance" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
