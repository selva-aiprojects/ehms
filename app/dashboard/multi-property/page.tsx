"use client";

import { useState, useEffect } from "react";
import { Building2, Loader2, TrendingUp, TrendingDown, Users, DollarSign, BarChart3, ArrowUpRight } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useJourney } from "@/components/providers/JourneyProvider";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function MultiPropertyPage() {
  const { selectedPropertyId } = useJourney();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/multi-property?days=${days}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3B82F6" }} />
      </div>
    );
  }

  const summary = data?.summary || {};
  const properties = data?.properties || [];
  const trend = data?.trend || [];

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.10)" }}>
            <Building2 className="w-5 h-5" style={{ color: "#8B5CF6" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1A3C5E" }}>Multi-Property Dashboard</h1>
            <p className="text-xs" style={{ color: "#64748B" }}>Group overview and cross-property analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="text-xs border rounded-lg px-2 py-1.5" style={{ borderColor: "#E2E8F0" }}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <Button onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>Properties</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: "#8B5CF6" }}>{summary.propertyCount || 0}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>Total Rooms</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: "#1A3C5E" }}>{summary.totalRooms || 0}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>Avg Occupancy</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: summary.avgOccupancy > 70 ? "#10B981" : summary.avgOccupancy > 40 ? "#F59E0B" : "#EF4444" }}>
            {summary.avgOccupancy || 0}%
          </p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>Total Revenue</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: "#10B981" }}>{formatCurrency(summary.totalRevenue || 0)}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>Check-ins / Out</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: "#3B82F6" }}>
            {summary.totalCheckins || 0} / {summary.totalCheckouts || 0}
          </p>
        </Card>
      </div>

      {/* Property Cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A3C5E" }}>Property Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p: any) => {
            const occ = Number(p.occupancy) || 0;
            return (
              <Card key={p.property_id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold" style={{ color: "#1A3C5E" }}>{p.property_name}</h4>
                  <Badge variant={occ > 70 ? "teal" : occ > 40 ? "amber" : "red"}>
                    {occ.toFixed(0)}% occ
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px]" style={{ color: "#94A3B8" }}>Rooms</p>
                    <p className="text-sm font-bold" style={{ color: "#1A3C5E" }}>{p.occupied}/{p.total_rooms}</p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: "#94A3B8" }}>Revenue</p>
                    <p className="text-sm font-bold" style={{ color: "#10B981" }}>{formatCurrency(Number(p.revenue))}</p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: "#94A3B8" }}>ADR</p>
                    <p className="text-sm font-bold" style={{ color: "#1A3C5E" }}>{formatCurrency(Number(p.adr))}</p>
                  </div>
                  <div>
                    <p className="text-[10px]" style={{ color: "#94A3B8" }}>RevPAR</p>
                    <p className="text-sm font-bold" style={{ color: "#1A3C5E" }}>{formatCurrency(Number(p.revpar))}</p>
                  </div>
                </div>

                {/* Mini occupancy bar */}
                <div className="mt-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                    <div className="h-full rounded-full" style={{ width: `${occ}%`, background: occ > 70 ? "#10B981" : occ > 40 ? "#F59E0B" : "#EF4444" }} />
                  </div>
                </div>
              </Card>
            );
          })}
          {properties.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <Building2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#CBD5E1" }} />
              <p className="text-sm" style={{ color: "#94A3B8" }}>No properties found. Assign properties to a group to see cross-property analytics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      {trend.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A3C5E" }}>Revenue Trend ({days} days)</h3>
          <div className="h-48 flex items-end gap-px">
            {/* Group by date */}
            {(() => {
              const byDate: Record<string, any[]> = {};
              trend.forEach((t: any) => {
                const d = t.snapshot_date?.split("T")[0];
                if (!byDate[d]) byDate[d] = [];
                byDate[d].push(t);
              });
              const dates = Object.keys(byDate).sort();
              const maxRevenue = Math.max(...dates.map(d => byDate[d].reduce((s: number, r: any) => s + Number(r.revenue), 0)), 1);
              return dates.map(d => {
                const dayRevenue = byDate[d].reduce((s: number, r: any) => s + Number(r.revenue), 0);
                const h = (dayRevenue / maxRevenue) * 180;
                return (
                  <div key={d} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t" style={{ height: `${h}px`, background: "linear-gradient(180deg, #8B5CF6, #3B82F6)" }} />
                    <span className="text-[8px]" style={{ color: "#94A3B8" }}>{d.slice(5)}</span>
                  </div>
                );
              });
            })()}
          </div>
        </Card>
      )}
    </div>
  );
}
