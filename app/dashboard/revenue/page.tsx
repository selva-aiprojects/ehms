"use client";

import { useState } from "react";
import { BarChart3, Loader2, TrendingUp, TrendingDown, Users, Bed, DollarSign, Percent, AlertTriangle, CalendarCheck } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { useRevenueDashboard } from "@/lib/hooks";
import { useJourney } from "@/components/providers/JourneyProvider";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function KPICard({ icon: Icon, label, value, subtext, color, trend }: {
  icon: any; label: string; value: string; subtext?: string; color: string; trend?: "up" | "down";
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>{label}</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: "#1A3C5E" }}>{value}</p>
          {subtext && (
            <div className="flex items-center gap-1 mt-0.5">
              {trend === "up" && <TrendingUp className="w-3 h-3" style={{ color: "#10B981" }} />}
              {trend === "down" && <TrendingDown className="w-3 h-3" style={{ color: "#EF4444" }} />}
              <p className="text-[10px]" style={{ color: trend === "down" ? "#EF4444" : "#10B981" }}>{subtext}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function MiniBarChart({ data, labelKey, valueKey, color }: { data: any[]; labelKey: string; valueKey: string; color: string }) {
  const maxVal = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: 80 }}>
      {data.slice(0, 14).map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = (val / maxVal) * 100;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-t-sm transition-all"
              style={{ height: `${Math.max(pct, 2)}%`, background: color, minHeight: 2 }}
              title={`${d[labelKey]}: ${val}`}
            />
            {data.length <= 7 && (
              <span className="text-[8px]" style={{ color: "#94A3B8" }}>
                {typeof d[labelKey] === "string" ? d[labelKey].slice(-2) : d[labelKey]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RevenueDashboardPage() {
  const { selectedPropertyId } = useJourney();
  const [period, setPeriod] = useState("30d");
  const { revenue, isLoading } = useRevenueDashboard(selectedPropertyId || undefined, period);

  if (isLoading || !revenue) {
    return (
      <div className="p-6 flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3B82F6" }} />
        <span className="ml-2 text-sm" style={{ color: "#64748B" }}>Loading revenue data...</span>
      </div>
    );
  }

  const { occupancy, revenue: rev, bookings, bySource, byRoomType, dailyTrend, upcomingArrivals } = revenue;

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.10)" }}>
            <BarChart3 className="w-5 h-5" style={{ color: "#3B82F6" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1A3C5E" }}>Revenue Dashboard</h1>
            <p className="text-xs" style={{ color: "#64748B" }}>Key performance indicators for the last 30 days</p>
          </div>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs border rounded-lg px-3 py-1.5"
          style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard icon={Bed} label="Occupancy" value={`${occupancy.percentage}%`} subtext={`${occupancy.occupied}/${occupancy.total} rooms`} color="#3B82F6" />
        <KPICard icon={DollarSign} label="Total Revenue" value={formatCurrency(rev.total)} color="#10B981" />
        <KPICard icon={TrendingUp} label="ADR" value={formatCurrency(rev.adr)} subtext="Avg Daily Rate" color="#8B5CF6" />
        <KPICard icon={DollarSign} label="RevPAR" value={formatCurrency(rev.revpar)} subtext="Per Available Room" color="#F59E0B" />
        <KPICard icon={Users} label="Active Stays" value={String(bookings.activeStays)} color="#EC4899" />
        <KPICard icon={AlertTriangle} label="Cancellation Rate" value={`${bookings.cancellationRate}%`} subtext={`${bookings.cancellations} cancelled`} color="#EF4444" trend={bookings.cancellationRate > 15 ? "down" : "up"} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <Card>
          <CardHeader title="Revenue Trend" subtitle="Daily revenue (last 14 days)" />
          {dailyTrend.length > 0 ? (
            <MiniBarChart data={dailyTrend} labelKey="date" valueKey="revenue" color="#3B82F6" />
          ) : (
            <p className="text-xs text-center py-8" style={{ color: "#94A3B8" }}>No data available</p>
          )}
        </Card>

        {/* Revenue by Source */}
        <Card>
          <CardHeader title="Revenue by Source" subtitle="Booking channel breakdown" />
          {bySource.length > 0 ? (
            <div className="space-y-2">
              {bySource.map((s: any, i: number) => {
                const totalRev = bySource.reduce((a: number, b: any) => a + Number(b.revenue), 0);
                const pct = totalRev > 0 ? Math.round((Number(s.revenue) / totalRev) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Badge variant={i === 0 ? "teal" : i === 1 ? "navy" : "gray"}>
                      {s.source || "direct"}
                    </Badge>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#3B82F6" }} />
                      </div>
                    </div>
                    <span className="text-xs font-medium" style={{ color: "#1A3C5E" }}>{formatCurrency(Number(s.revenue))}</span>
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: "#94A3B8" }}>No data available</p>
          )}
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Room Type */}
        <Card>
          <CardHeader title="Revenue by Room Type" subtitle="Performance by category" />
          {byRoomType.length > 0 ? (
            <div className="space-y-2">
              {byRoomType.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: "#F1F5F9" }}>
                  <span className="text-xs font-medium" style={{ color: "#1A3C5E" }}>{r.room_type || "Room"}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px]" style={{ color: "#64748B" }}>{r.bookings} bookings</span>
                    <span className="text-xs font-semibold" style={{ color: "#1A3C5E" }}>{formatCurrency(Number(r.revenue))}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: "#94A3B8" }}>No data available</p>
          )}
        </Card>

        {/* Upcoming Arrivals */}
        <Card>
          <CardHeader title="Upcoming Arrivals" subtitle="Next 7 days" />
          {upcomingArrivals.length > 0 ? (
            <div className="space-y-2">
              {upcomingArrivals.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b" style={{ borderColor: "#F1F5F9" }}>
                  <CalendarCheck className="w-4 h-4 shrink-0" style={{ color: "#3B82F6" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "#1A3C5E" }}>{a.guest_name}</p>
                    <p className="text-[10px]" style={{ color: "#94A3B8" }}>
                      {a.unit_label} • {new Date(a.check_in).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Badge variant={a.source === "direct" ? "teal" : "navy"}>{a.source}</Badge>
                  <span className="text-xs font-medium" style={{ color: "#1A3C5E" }}>{formatCurrency(Number(a.total_amount))}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-center py-8" style={{ color: "#94A3B8" }}>No upcoming arrivals</p>
          )}
        </Card>
      </div>
    </div>
  );
}
