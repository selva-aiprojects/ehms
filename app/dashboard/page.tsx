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
function LineChart({ data, smooth }: { data: { label: string; revenue: number; expenses: number }[]; smooth: boolean }) {
  if (!data?.length) return <Skeleton className="w-full h-56" />;
  const max = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)), 1);
  const W = 800, H = 250, padL = 60, padR = 30, padT = 30, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const toX = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * chartW;
  const toY = (v: number) => padT + chartH - (v / max) * chartH;

  const formatVal = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v.toFixed(0)}`;
  };

  const revPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.revenue), val: d.revenue }));
  const expPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.expenses), val: d.expenses }));

  const getPath = (pts: typeof revPoints) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (!smooth) {
      return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    }
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const revPath = getPath(revPoints);
  const expPath = getPath(expPoints);

  const revArea = revPath + ` L ${toX(data.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;
  const expArea = expPath + ` L ${toX(data.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;
  const allZero = data.every(d => d.revenue === 0 && d.expenses === 0);

  if (allZero) {
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-xl" style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1" }}>
        <IndianRupee className="w-8 h-8 mb-2" style={{ color: "#CBD5E1" }} />
        <p className="text-sm font-medium" style={{ color: "#94A3B8" }}>No financial data yet</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 220 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2BAE8E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2BAE8E" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E53E3E" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#E53E3E" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map(pct => (
          <g key={pct}>
            <line x1={padL} y1={toY(max * pct / 100)} x2={W - padR} y2={toY(max * pct / 100)} stroke="#F1F5F9" strokeWidth={1} />
            <text x={padL - 10} y={toY(max * pct / 100) + 4} textAnchor="end" fontSize={10} fill="#94A3B8">
              {formatVal(max * pct / 100)}
            </text>
          </g>
        ))}
        {data.length > 1 && (
          <>
            <path d={revArea} fill="url(#revGrad)" />
            <path d={expArea} fill="url(#expGrad)" />
          </>
        )}
        <path d={revPath} fill="none" stroke="#2BAE8E" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={expPath} fill="none" stroke="#E53E3E" strokeWidth={2.5} strokeLinejoin="round" />

        {revPoints.map((p, i) => (
          <g key={`rev-pt-${i}`}>
            <circle cx={p.x} cy={p.y} r={4.5} fill="#2BAE8E" stroke="#fff" strokeWidth={1.5} />
            {p.val > 0 && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={9} fontWeight="600" fill="#1e293b">
                {formatVal(p.val)}
              </text>
            )}
          </g>
        ))}

        {expPoints.map((p, i) => (
          <g key={`exp-pt-${i}`}>
            <circle cx={p.x} cy={p.y} r={4.5} fill="#E53E3E" stroke="#fff" strokeWidth={1.5} />
            {p.val > 0 && (
              <text x={p.x} y={p.y + 14} textAnchor="middle" fontSize={9} fontWeight="600" fill="#991b1b">
                {formatVal(p.val)}
              </text>
            )}
          </g>
        ))}

        {data.map((d, i) => (
          <text key={d.label} x={toX(i)} y={H - 10} textAnchor="middle" fontSize={10} fill="#64748B">{d.label}</text>
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
  label, value, icon, color, bg, href, onClick,
}: {
  label: string; value: number | string; icon: React.ReactNode; color: string; bg: string; href: string; onClick?: (e: React.MouseEvent) => void;
}) {
  const content = (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5 shrink-0 cursor-pointer"
      style={{ background: bg, border: `1px solid ${color}30`, minWidth: 150 }}
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold leading-none" style={{ color }}>{value}</p>
        <p className="text-xs mt-0.5 font-medium" style={{ color: "#64748B" }}>{label}</p>
      </div>
    </div>
  );
  if (onClick) return content;
  return <Link href={href}>{content}</Link>;
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
  const { user, loading } = useAuth();
  
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "half_yearly" | "annually" | "custom">("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customFilterActive, setCustomFilterActive] = useState(false);
  const [smoothCurve, setSmoothCurve] = useState(true);

  const filters = {
    period,
    start_date: period === "custom" && customFilterActive ? startDate : undefined,
    end_date: period === "custom" && customFilterActive ? endDate : undefined,
  };

  const { stats, isLoading } = useStats(selectedPropertyId, filters);
  const { overview, isLoading: overviewLoading } = useAdminOverview(selectedPropertyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#2BAE8E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

  const current = stats?.current || {
    bookings: 0,
    checkedIn: 0,
    guests: 0,
    revenue: 0,
    payables: 0,
    avgRating: 0,
    occupancyRate: 0,
    expenses: { salary: 0, maintenance: 0, subscriptions: 0, utilities: 0, other: 0, total: 0 },
    channels: { channelPartners: 0, direct: 0, walkins: 0 },
    positiveRatingPct: 0,
  };

  const previous = stats?.previous || {
    bookings: 0,
    checkedIn: 0,
    guests: 0,
    revenue: 0,
    payables: 0,
    avgRating: 0,
    occupancyRate: 0,
    expenses: { salary: 0, maintenance: 0, subscriptions: 0, utilities: 0, other: 0, total: 0 },
    channels: { channelPartners: 0, direct: 0, walkins: 0 },
    positiveRatingPct: 0,
  };

  const trendLabel = period === "quarterly"
    ? "vs last quarter"
    : period === "half_yearly"
    ? "vs last 6 months"
    : period === "annually"
    ? "vs last year"
    : period === "custom"
    ? "vs prev period"
    : "vs last month";

  const revDiff = current.revenue - previous.revenue;
  const revTrend = {
    pct: previous.revenue > 0 ? Math.round((revDiff / previous.revenue) * 100) : (current.revenue > 0 ? 100 : 0),
    label: trendLabel,
  };

  const expDiff = current.expenses.total - previous.expenses.total;
  const expTrend = {
    pct: previous.expenses.total > 0 ? Math.round((expDiff / previous.expenses.total) * 100) : (current.expenses.total > 0 ? 100 : 0),
    label: trendLabel,
  };

  const ratingDiff = current.avgRating - previous.avgRating;
  const ratingTrend = {
    pct: previous.avgRating > 0 ? Math.round((ratingDiff / previous.avgRating) * 100) : (current.avgRating > 0 ? 100 : 0),
    label: trendLabel,
  };

  const bookingsDiff = current.bookings - previous.bookings;
  const bookingsTrend = {
    pct: previous.bookings > 0 ? Math.round((bookingsDiff / previous.bookings) * 100) : (current.bookings > 0 ? 100 : 0),
    label: trendLabel,
  };

  const occupancyDiff = current.occupancyRate - previous.occupancyRate;
  const occupancyTrend = {
    pct: previous.occupancyRate > 0 ? Math.round((occupancyDiff / previous.occupancyRate) * 100) : (current.occupancyRate > 0 ? 100 : 0),
    label: trendLabel,
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
    return `₹${amount.toFixed(0)}`;
  };

  const kpiCards = [
    {
      label: "Total Revenue",
      value: stats ? formatCurrency(current.revenue) : "—",
      icon: <IndianRupee className="w-5 h-5" style={{ color: "#2BAE8E" }} />,
      bg: "rgba(43,174,142,0.12)",
      trend: revTrend,
    },
    {
      label: "Total Expenses",
      value: stats ? formatCurrency(current.expenses.total) : "—",
      icon: <DollarSign className="w-5 h-5" style={{ color: "#E53E3E" }} />,
      bg: "rgba(229,62,62,0.12)",
      trend: expTrend,
    },
    {
      label: "Overall Rating",
      value: stats ? `${current.avgRating} / 5` : "—",
      icon: <Star className="w-5 h-5" style={{ color: "#F5A623" }} />,
      bg: "rgba(245,166,35,0.12)",
      trend: ratingTrend,
    },
    {
      label: "Total Bookings",
      value: stats ? String(current.bookings) : "—",
      icon: <Building2 className="w-5 h-5" style={{ color: "#1A3C5E" }} />,
      bg: "rgba(26,60,94,0.12)",
      trend: bookingsTrend,
    },
    {
      label: "Occupancy Rate",
      value: stats ? `${current.occupancyRate}%` : "—",
      icon: <Users className="w-5 h-5" style={{ color: "#1A3C5E" }} />,
      bg: "rgba(26,60,94,0.12)",
      trend: occupancyTrend,
    },
  ];

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(229,62,62,0.1)" }}>
          <AlertTriangle className="w-8 h-8" style={{ color: "#E53E3E" }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "#1A3C5E" }}>Dashboard Access Restricted</h2>
        <p className="text-sm max-w-md mb-4" style={{ color: "#64748B" }}>
          This unified operational dashboard is only accessible to Superadmin and Property Manager roles. Please use the sidebar to navigate to your assigned operational modules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Unified Executive Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time revenue metrics, quality logs, and operational expenses</p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Live · refreshes every 30s</span>
        </div>
      </div>

      {/* Dynamic Date Filters Panel */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4" style={{ border: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>Analysis Period:</label>
          <select
            value={period}
            onChange={(e) => {
              const val = e.target.value as any;
              setPeriod(val);
              if (val !== "custom") {
                setCustomFilterActive(false);
              }
            }}
            className="text-xs px-3 py-1.5 rounded-lg border outline-none font-medium"
            style={{ borderColor: "#CBD5E1", color: "#1A3C5E", background: "#F8FAFC" }}
          >
            <option value="monthly">Monthly (This Month vs Last Month)</option>
            <option value="quarterly">Quarterly (This Q vs Last Q)</option>
            <option value="half_yearly">Half-Yearly (Last 6 Months)</option>
            <option value="annually">Annually (This Year vs Last Year)</option>
            <option value="custom">Custom Date Range (On Demand)</option>
          </select>
        </div>

        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-3 animate-fade-in">
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "#64748B" }}>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium"
                style={{ borderColor: "#CBD5E1" }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: "#64748B" }}>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium"
                style={{ borderColor: "#CBD5E1" }}
              />
            </div>
            <button
              onClick={() => setCustomFilterActive(true)}
              className="text-xs px-4 py-1.5 rounded-lg font-bold text-white transition-all hover:opacity-90"
              style={{ background: "#2BAE8E" }}
            >
              Apply Filter
            </button>
          </div>
        )}
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
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>Revenue vs Expenses Trend</h2>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Comparison of cash inflows and operational expenses</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#2BAE8E" }}>
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#2BAE8E" }} /> Revenue
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#E53E3E" }}>
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#E53E3E" }} /> Expenses
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 border-l pl-4" style={{ borderColor: "#E2E8F0" }}>
              <input
                type="checkbox"
                id="smoothCurve"
                checked={smoothCurve}
                onChange={(e) => setSmoothCurve(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#2BAE8E] cursor-pointer"
              />
              <label htmlFor="smoothCurve" className="text-xs font-medium cursor-pointer" style={{ color: "#64748B" }}>
                Smooth curve
              </label>
            </div>
          </div>
        </div>
        {isLoading ? <Skeleton className="w-full h-56" /> : <LineChart data={stats?.chartData || []} smooth={smoothCurve} />}
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={card} style={cardStyle}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#1A3C5E" }}>Operations Expenses</h3>
          <p className="text-xs text-slate-400 mb-4">Functional cost breakdown for this period</p>
          <div className="space-y-3">
            {isLoading ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)
            ) : (
              [
                { label: "Staff Salary", value: current.expenses.salary, color: "#1A3C5E" },
                { label: "Property Maintenance", value: current.expenses.maintenance, color: "#F5A623" },
                { label: "Software & Subscriptions", value: current.expenses.subscriptions, color: "#2BAE8E" },
                { label: "Utilities & Rent", value: current.expenses.utilities, color: "#64748B" },
                { label: "Other Expenses", value: current.expenses.other, color: "#94A3B8" },
              ].map(e => {
                const total = current.expenses.total || 1;
                const pct = Math.round((e.value / total) * 100);
                return (
                  <div key={e.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span style={{ color: "#475569" }}>{e.label}</span>
                      <span style={{ color: "#1A3C5E" }}>{formatCurrency(e.value)} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full w-full bg-slate-100">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: e.color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={card} style={cardStyle}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#1A3C5E" }}>Booking Channels</h3>
          <p className="text-xs text-slate-400 mb-4">Traffic source split for active reservations</p>
          <div className="space-y-3">
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : (
              [
                { label: "Channel Partners (OTAs)", value: current.channels.channelPartners, color: "#2BAE8E" },
                { label: "Direct (Website/Social)", value: current.channels.direct, color: "#1A3C5E" },
                { label: "Walk-ins (Direct Counter)", value: current.channels.walkins, color: "#F5A623" },
              ].map(ch => {
                const total = (current.channels.channelPartners + current.channels.direct + current.channels.walkins) || 1;
                const pct = Math.round((ch.value / total) * 100);
                return (
                  <div key={ch.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span style={{ color: "#475569" }}>{ch.label}</span>
                      <span style={{ color: "#1A3C5E" }}>{ch.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full w-full bg-slate-100">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ch.color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={card} style={cardStyle}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#1A3C5E" }}>Quality & Reviews</h3>
          <p className="text-xs text-slate-400 mb-4">Guest feedback performance ratings</p>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <div className="flex flex-col items-center gap-4 py-1">
              <div className="text-center">
                <div className="text-4xl font-extrabold" style={{ color: "#1A3C5E" }}>{current.avgRating.toFixed(1)} <span className="text-lg font-bold text-slate-400">/ 5.0</span></div>
                <div className="text-xs font-semibold uppercase tracking-wider mt-1 text-slate-400">Average Rating</div>
              </div>
              
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span style={{ color: "#475569" }}>Positive Review Rate</span>
                  <span style={{ color: "#2BAE8E" }}>{current.positiveRatingPct}%</span>
                </div>
                <div className="h-2.5 rounded-full w-full bg-slate-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${current.positiveRatingPct}%`, background: "#2BAE8E" }} />
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Positive ratings include 4-star and 5-star reviews
                </p>
              </div>

              <Link href="/dashboard/front-desk/feedbacks" className="w-full text-center text-xs py-2 rounded-xl font-medium transition-all hover:opacity-85"
                style={{ background: "rgba(26,60,94,0.08)", color: "#1A3C5E", border: "1px solid rgba(26,60,94,0.15)" }}>
                View Reviews & Feedbacks →
              </Link>
            </div>
          )}
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
                <div className="space-y-3">
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                    <ActivityPill label="Occupied Rooms" value={todayCheckins} icon={<Bed className="w-4 h-4" style={{ color: "#2BAE8E" }} />} color="#2BAE8E" bg="#EFFDF9" href="/dashboard/front-desk" onClick={() => drill("Occupied Rooms", ((overview as any)?.drillDown?.rooms || []).filter((r: any) => r.status === "occupied" || r.status === "dirty"), "/dashboard/front-desk")} />
                    <ActivityPill label="HK Tasks Open" value={openHKTasks} icon={<ClipboardList className="w-4 h-4" style={{ color: "#F5A623" }} />} color="#F5A623" bg="#FFFBEB" href="/dashboard/housekeeping" onClick={() => drill("HK Tasks Open", (overview as any)?.drillDown?.hkTasks || [], "/dashboard/housekeeping")} />
                    <ActivityPill label="Maint. Open" value={openMaint} icon={<Wrench className="w-4 h-4" style={{ color: "#E53E3E" }} />} color="#E53E3E" bg="#FFF5F5" href="/dashboard/maintenance" onClick={() => drill("Maint. Open", (overview as any)?.drillDown?.maintTickets || [], "/dashboard/maintenance")} />
                    <ActivityPill label="Pending Requests" value={pendingReqs} icon={<MessageSquare className="w-4 h-4" style={{ color: "#1A3C5E" }} />} color="#1A3C5E" bg="#EFF4FF" href="/dashboard/front-desk/requests" onClick={() => drill("Pending Requests", (overview as any)?.drillDown?.guestRequests || [], "/dashboard/front-desk/requests")} />
                    <ActivityPill label="Vendor Bills Due" value={pendingBills} icon={<AlertTriangle className="w-4 h-4" style={{ color: "#E53E3E" }} />} color="#E53E3E" bg="#FFF5F5" href="/dashboard/finance/payables" onClick={() => drill("Vendor Bills Due", (overview as any)?.drillDown?.vendorBills || [], "/dashboard/finance/payables")} />
                    <ActivityPill label="Avg Rating" value={`${overview?.feedbacks?.avgRating ?? 0} ★`} icon={<Star className="w-4 h-4" style={{ color: "#F5A623" }} />} color="#F5A623" bg="#FFFBEB" href="/dashboard/front-desk/feedbacks" onClick={() => drill("Avg Rating", (overview?.feedbacks as any)?.recent || [], "/dashboard/front-desk/feedbacks")} />
                  </div>
                  {drilling && ["Occupied Rooms", "HK Tasks Open", "Maint. Open", "Pending Requests", "Vendor Bills Due", "Avg Rating"].includes(drilling.section) && (
                    <DrillDownPanel items={drilling.items} onClose={() => setDrilling(null)} viewAllHref={drilling.href} />
                  )}
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
                    { label: "Today Revenue", key: "today", recentKey: "recentToday", color: "#2BAE8E", bg: "rgba(43,174,142,0.08)", icon: <IndianRupee className="w-4 h-4" style={{ color: "#2BAE8E" }} /> },
                    { label: "This Week", key: "week", recentKey: "recentWeek", color: "#1A3C5E", bg: "rgba(26,60,94,0.06)", icon: <TrendingUp className="w-4 h-4" style={{ color: "#1A3C5E" }} /> },
                    { label: "This Month", key: "month", recentKey: "recentMonth", color: "#F5A623", bg: "rgba(245,166,35,0.08)", icon: <TrendingUp className="w-4 h-4" style={{ color: "#F5A623" }} /> },
                    { label: "This Year", key: "year", recentKey: "recentYear", color: "#E53E3E", bg: "rgba(229,62,62,0.08)", icon: <DollarSign className="w-4 h-4" style={{ color: "#E53E3E" }} /> },
                  ].map(item => {
                    const val = (overview?.revenue as any)?.[item.key] ?? 0;
                    const drillItems = (overview as any)?.revenue?.[item.recentKey] || (overview as any)?.revenue?.recent || [];
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
                      const filterStatuses = rt.filter.split(",");
                      const items = ((overview as any)?.drillDown?.rooms || []).filter((r: any) => filterStatuses.includes(r.status) || (rt.filter.includes("ready") && r.status === "vacant"));
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
                        { label: "Overall", val: overview?.feedbacks?.overall ?? 0 },
                      ].map(item => (
                        <div key={item.label} className="p-3 rounded-xl text-center transition-all hover:shadow-sm"
                          style={{ background: "#FFFBEB", border: "1px solid rgba(245,166,35,0.2)" }}>
                          <p className="text-2xl font-bold" style={{ color: "#F5A623" }}>{item.val}</p>
                          <p className="text-xs" style={{ color: "#64748B" }}>{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </button>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>Average Rating:</span>
                      <span className="text-lg font-bold px-3 py-0.5 rounded-full"
                        style={{ background: "#EFFDF9", color: "#2BAE8E", border: "1px solid rgba(43,174,142,0.3)" }}>
                        {overview?.feedbacks?.avgRating ?? 0} / 5.0 ★
                      </span>
                    </div>
                    <button onClick={() => drill("feedbacks", (overview?.feedbacks as any)?.recent || [], "/dashboard/front-desk/feedbacks")}
                      className="text-xs font-semibold hover:underline" style={{ color: "#2BAE8E" }}>
                      View reviews →
                    </button>
                  </div>
                  {drilling?.section === "feedbacks" && (
                    <DrillDownPanel items={(overview?.feedbacks as any)?.recent || []} onClose={() => setDrilling(null)} viewAllHref="/dashboard/front-desk/feedbacks" />
                  )}
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
                      { label: "Spending Today", key: "todaySpending", recentKey: "recentToday", color: "#2BAE8E", bg: "rgba(43,174,142,0.08)" },
                      { label: "This Week", key: "weekSpending", recentKey: "recentWeek", color: "#F5A623", bg: "rgba(245,166,35,0.08)" },
                      { label: "This Month", key: "monthSpending", recentKey: "recentMonth", color: "#1A3C5E", bg: "rgba(26,60,94,0.08)" },
                      { label: "This Year", key: "yearSpending", recentKey: "recentYear", color: "#E53E3E", bg: "rgba(229,62,62,0.08)" },
                    ].map(item => {
                      const val = (overview?.financial as any)?.[item.key] ?? 0;
                      const drillItems = (overview?.financial as any)?.[item.recentKey] || (overview as any)?.financial?.recentBills || [];
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
                      const drillItems = item.key === "expectedExpenses" ? ((overview as any)?.drillDown?.vendorBills || []) : ((overview as any)?.revenue?.recent || []);
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
