"use client";

import { useState, useEffect } from "react";
import { useStats } from "@/lib/hooks";
import { useJourney } from "@/components/providers/JourneyProvider";
import { TrendingUp, Users, DollarSign, Building2 } from "lucide-react";

/* ─── Skeleton loader ─── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

/* ─── Line chart (SVG) with real data ─── */
function LineChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (!data?.length) return <Skeleton className="w-full h-40" />;
  const max = Math.max(...data.map(d => d.revenue), 1);
  const W = 800, H = 200, padL = 40, padR = 20, padT = 10, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padT + chartH - (v / max) * chartH;
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.revenue)}`).join(" ");
  const area = path + ` L ${toX(data.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 160 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2BAE8E" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2BAE8E" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map(pct => (
          <g key={pct}>
            <line x1={padL} y1={toY(max * pct / 100)} x2={W - padR} y2={toY(max * pct / 100)} stroke="#E2E8F0" strokeWidth={1} />
            <text x={padL - 6} y={toY(max * pct / 100) + 4} textAnchor="end" fontSize={10} fill="#64748B">
              {pct > 0 ? `${Math.round(max * pct / 100 / 1000)}k` : "0"}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#revGrad)" />
        <path d={path} fill="none" stroke="#2BAE8E" strokeWidth={2.5} strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={d.month}>
            <circle cx={toX(i)} cy={toY(d.revenue)} r={3} fill="#2BAE8E" />
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

const card = "bg-white rounded-2xl p-5" as const;
const cardStyle = { border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(26,60,94,0.06)" };

export default function DashboardPage() {
  const { selectedPropertyId } = useJourney();
  const { stats, isLoading } = useStats(selectedPropertyId);

  const kpiCards = [
    {
      label: "Total Revenue",
      value: stats ? `₹${(stats.totalRevenue / 1000).toFixed(1)}k` : "—",
      icon: <DollarSign className="w-5 h-5" style={{ color: "#2BAE8E" }} />,
      bg: "rgba(43,174,142,0.12)",
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
      icon: <TrendingUp className="w-5 h-5" style={{ color: "#F5A623" }} />,
      bg: "rgba(245,166,35,0.12)",
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map(card2 => (
          <div key={card2.label} className={card} style={cardStyle}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>{card2.label}</p>
                {isLoading
                  ? <Skeleton className="h-7 w-24 mt-1" />
                  : <p className="text-xl font-bold" style={{ color: "#1A3C5E" }}>{card2.value}</p>
                }
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: card2.bg }}>
                {card2.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>Revenue Trend (Last 12 Months)</h2>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748B" }}>
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: "#2BAE8E" }} /> Revenue
          </div>
        </div>
        {isLoading ? <Skeleton className="w-full h-40" /> : <LineChart data={stats?.chartData || []} />}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reservations donut */}
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
          </div>
        </div>

        {/* Guests donut */}
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
          </div>
        </div>

        {/* Quick actions */}
        <div className={card} style={cardStyle}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A3C5E" }}>Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Front Desk", desc: "Check-ins & room matrix", href: "/dashboard/front-desk", bg: "linear-gradient(135deg, #1A3C5E 0%, #2C3547 100%)" },
              { label: "Housekeeping Board", desc: "Task allocation", href: "/dashboard/housekeeping", bg: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)" },
              { label: "Maintenance Tickets", desc: "Active repairs", href: "/dashboard/maintenance", bg: "#F5A623", color: "#1A2E44" },
              { label: "Finance & Billing", desc: "Invoices & GL", href: "/dashboard/finance", bg: "linear-gradient(135deg, #1A3C5E 0%, #2C3547 100%)" },
            ].map(a => (
              <a key={a.label} href={a.href} className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-85"
                style={{ background: a.bg, color: a.color || "#fff" }}>
                <span>{a.label}</span>
                <span className="opacity-70 font-normal">{a.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
