"use client";

import { useEffect, useRef } from "react";

/* ─── KPI data ─── */
const kpiCards = [
  {
    label: "Total amount",
    value: "26,000",
    prefix: "",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "Avg. Reservations",
    value: "3.5h",
    prefix: "",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    label: "Total guests",
    value: "$000",
    prefix: "",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
];

/* ─── Line chart (SVG) ─── */
function LineChart() {
  // Two datasets matching the reference (teal + blue wavy lines)
  const points1 = [10, 30, 20, 55, 40, 70, 55, 80, 65, 90, 75, 60];
  const points2 = [40, 55, 45, 70, 60, 85, 70, 95, 80, 75, 85, 70];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yLabels = [100, 80, 60, 40, 20, 0];

  const W = 800, H = 200;
  const padL = 40, padR = 20, padT = 10, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const toX = (i: number) => padL + (i / (points1.length - 1)) * chartW;
  const toY = (v: number) => padT + chartH - (v / 100) * chartH;

  const makePath = (pts: number[]) =>
    pts.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");

  const makeArea = (pts: number[]) =>
    makePath(pts) +
    ` L ${toX(pts.length - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 160 }}>
        <defs>
          <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2BAE8E" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2BAE8E" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A3C5E" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#1A3C5E" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines */}
        {yLabels.map((v) => (
          <g key={v}>
            <line
              x1={padL} y1={toY(v)} x2={W - padR} y2={toY(v)}
              stroke="#E2E8F0" strokeWidth={1}
            />
            <text x={padL - 6} y={toY(v) + 4} textAnchor="end" fontSize={10} fill="#64748B">{v}</text>
          </g>
        ))}

        {/* Area fills */}
        <path d={makeArea(points2)} fill="url(#grad2)" />
        <path d={makeArea(points1)} fill="url(#grad1)" />

        {/* Lines */}
        <path d={makePath(points2)} fill="none" stroke="#1A3C5E" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={makePath(points1)} fill="none" stroke="#2BAE8E" strokeWidth={2.5} strokeLinejoin="round" />

        {/* X-axis labels */}
        {months.map((m, i) => (
          <text key={m} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="#64748B">{m}</text>
        ))}
      </svg>
    </div>
  );
}

/* ─── Donut chart (SVG) ─── */
function DonutChart({
  pct, color, size = 120,
}: { pct: number; color: string; size?: number }) {
  const r = 42, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E2E8F0" strokeWidth={12} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={12}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={18} fontWeight="700" fill="#1A3C5E">
        {pct}%
      </text>
    </svg>
  );
}

/* ─── Reports list ─── */
const reportRows = [
  { label: "Today's total",  value: "$2,300" },
  { label: "Total amount",   value: "$30,000" },
  { label: "Lifediscount",   value: "$5,301" },
  { label: "Total amount",   value: "$3,000" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      {/* Page title */}
      <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Dashboard</h1>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 flex items-center justify-between"
            style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(26,60,94,0.06)" }}
          >
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: "#1A3C5E" }}>{card.value}</p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(43,174,142,0.12)", color: "#2BAE8E" }}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── Line Chart Card ── */}
      <div
        className="bg-white rounded-2xl p-5"
        style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(26,60,94,0.06)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>Revenue & Occupancy Trend</h2>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#64748B" }}>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: "#2BAE8E" }} /> Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: "#1A3C5E" }} /> Occupancy
            </span>
          </div>
        </div>
        <LineChart />
      </div>

      {/* ── Bottom row: Reservations | Guests | Reports ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Reservations donut */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(26,60,94,0.06)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A3C5E" }}>Reservations</h3>
          <div className="flex flex-col items-center gap-4">
            <DonutChart pct={98} color="#2BAE8E" />
            <div className="w-full space-y-2 text-xs">
              {[
                { label: "Center Saw", color: "#1A3C5E" },
                { label: "Fall Saw",   color: "#2BAE8E" },
                { label: "Last Saw",   color: "#4DB88A" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2" style={{ color: "#64748B" }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Guests donut */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(26,60,94,0.06)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A3C5E" }}>Guests</h3>
          <div className="flex flex-col items-center gap-4">
            <DonutChart pct={67} color="#2BAE8E" />
            <div className="w-full space-y-2 text-xs">
              {[
                { label: "Utility",  color: "#1A3C5E" },
                { label: "Grown",    color: "#2BAE8E" },
                { label: "Foams",    color: "#4DB88A" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2" style={{ color: "#64748B" }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reports from */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(26,60,94,0.06)" }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#1A3C5E" }}>Reports from</h3>
          <div className="space-y-3">
            {reportRows.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-2"
                style={{ borderBottom: i < reportRows.length - 1 ? "1px solid #F5F7FA" : "none" }}
              >
                <span style={{ color: "#64748B" }}>{row.label}</span>
                <span className="font-semibold" style={{ color: "#1A3C5E" }}>{row.value}</span>
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)", color: "#fff" }}
          >
            View Full Report
          </button>
        </div>

      </div>
    </div>
  );
}
