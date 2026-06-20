"use client";

import { useState, useEffect } from "react";
import { Hotel, Star, MapPin, Users, TrendingUp, DollarSign, AlertCircle, Loader2, RefreshCw, Search, Building2, Phone, Mail, ChevronRight, Calendar, Briefcase, Sun, Snowflake, CloudRain, BarChart3, ThumbsUp, Globe, Coffee, Wifi, Waves, Dumbbell, Utensils, Car, MessageSquare, UserCheck, DoorOpen } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useHotelStats } from "@/lib/hooks";

const MOCK_PROPERTIES = [
  { id: "p1", name: "Oceanview Grand Hotel", vertical_type: "hotel", total_units: 120, occupancy_pct: 84, address: "12 Marina Beach Rd, Chennai", phone: "+91-44-1001-0001", email: "oceanview@ehms.demo", star_rating: 5, manager: "Rajesh Mehta" },
  { id: "p2", name: "Seaside Boutique Hotel", vertical_type: "hotel", total_units: 45, occupancy_pct: 78, address: "45 East Coast Rd, Chennai", phone: "+91-44-1001-0005", email: "seaside@ehms.demo", star_rating: 3, manager: "Anita Desai" },
];

function SkeletonCard() {
  return (
    <div className="rounded-xl p-4 animate-pulse" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
      <div className="flex items-center justify-between">
        <div><div className="w-40 h-5 rounded mb-2" style={{ background: "#E2E8F0" }} /><div className="w-24 h-3 rounded" style={{ background: "#E2E8F0" }} /></div>
        <div className="text-right"><div className="w-12 h-5 rounded mb-1" style={{ background: "#E2E8F0" }} /><div className="w-8 h-3 rounded" style={{ background: "#E2E8F0" }} /></div>
      </div>
    </div>
  );
}

export default function HotelsPage() {
  const [search, setSearch] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { stats, isLoading, isError, mutate } = useHotelStats();

  const displayProperties = (stats?.properties && stats.properties.length > 0) ? stats.properties : MOCK_PROPERTIES;
  const isLoadingDisplay = isLoading && !stats;

  const filtered = displayProperties.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase()) ||
    p.manager?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const avgOccupancy = stats?.summary?.avgOccupancy ?? (filtered.length > 0
    ? Math.round(filtered.reduce((s: number, p: any) => s + (p.occupancy_pct || 0), 0) / filtered.length)
    : 0);

  const totalRooms = stats?.summary?.totalUnits ?? filtered.reduce((s: number, p: any) => s + (p.total_units || 0), 0);
  const totalOccupied = stats?.summary?.totalOccupied ?? filtered.reduce((s: number, p: any) => s + Math.round(((p.total_units || 0) * (p.occupancy_pct || 0)) / 100), 0);

  const starRow = (n: number) => {
    return Array.from({ length: n }).map((_, i) => (
      <Star key={i} className="w-3 h-3 fill-current" style={{ color: "#F5A623" }} />
    ));
  };

  if (isLoadingDisplay) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2BAE8E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#64748B] text-sm font-medium">Loading Hotel Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Hotels & Resorts</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Star-rated property operations</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={() => setActionFeedback({ type: "success", message: "Add property form opened" })}>
            <Building2 className="w-3.5 h-3.5" /> Add Property
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Could not load live property data. Displaying mock data.
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
          {actionFeedback.type === "success" ? <RefreshCw className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{filtered.length}</div>
            <Hotel className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Properties</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{totalRooms}</div>
            <DoorOpen className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Rooms</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{totalOccupied}</div>
            <Users className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Occupied Rooms</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#F5A623" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>{avgOccupancy}%</div>
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs" style={{ color: "rgba(0,0,0,0.6)" }}>Avg Occupancy</div>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#64748B" }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search hotels..."
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none border"
          style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
        />
      </div>

      {isLoadingDisplay ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Hotel className="w-8 h-8 mx-auto mb-3" style={{ color: "#64748B" }} />
          <p className="text-sm font-medium" style={{ color: "#1A2E44" }}>No properties found</p>
          <p className="text-xs mt-1" style={{ color: "#64748B" }}>Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p: any) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold" style={{ color: "#1A3C5E" }}>{p.name}</h3>
                    <Badge variant="teal">{p.vertical_type?.replace("_", " ") || "Hotel"}</Badge>
                    {p.star_rating && (
                      <div className="flex items-center gap-0.5">
                        {starRow(p.star_rating)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "#64748B" }}>
                    <MapPin className="w-3 h-3" /> {p.address || "Address N/A"}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "#64748B" }}>
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {p.total_units || "—"} rooms</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Manager: {p.manager || "—"}</span>
                    {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right min-w-[60px]">
                    <div className="text-sm font-semibold" style={{ color: "#2BAE8E" }}>{p.occupancy_pct || 0}%</div>
                    <div className="text-xs" style={{ color: "#64748B" }}>Occupancy</div>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <div className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>₹{((p.total_units || 0) * 4200).toLocaleString()}</div>
                    <div className="text-xs" style={{ color: "#64748B" }}>Est. Revenue</div>
                  </div>
                  <Button variant="outline" size="sm">
                    View <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader title="Performance Summary" subtitle="All hotel properties" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-1.5" style={{ color: "#1A3C5E" }}>
              <Hotel className="w-4 h-4" /> By Star Rating
            </h4>
            {[5, 4, 3].map((star) => {
              const props = filtered.filter((p: any) => p.star_rating === star);
              return (
                <div key={star} className="flex items-center justify-between py-1.5">
                  <span className="flex items-center gap-1" style={{ color: "#64748B" }}>
                    {starRow(star)} <span className="ml-1">({props.length})</span>
                  </span>
                  <span className="font-medium" style={{ color: "#1A2E44" }}>
                    {props.length > 0
                      ? `${Math.round(props.reduce((s: number, p: any) => s + (p.occupancy_pct || 0), 0) / props.length)}%`
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-1.5" style={{ color: "#1A3C5E" }}>
              <TrendingUp className="w-4 h-4" /> Top Performers
            </h4>
            {[...filtered].sort((a: any, b: any) => (b.occupancy_pct || 0) - (a.occupancy_pct || 0)).slice(0, 3).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center justify-between py-1.5">
                <span style={{ color: "#64748B" }}>
                  <span className="font-medium mr-1" style={{ color: i === 0 ? "#F5A623" : "#1A2E44" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </span>
                  {p.name}
                </span>
                <span className="font-medium" style={{ color: "#2BAE8E" }}>{p.occupancy_pct}%</span>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-1.5" style={{ color: "#1A3C5E" }}>
              <DollarSign className="w-4 h-4" /> Revenue Estimate
            </h4>
            {filtered.slice(0, 3).map((p: any) => {
              const estRev = (p.total_units || 0) * 4200 * (p.occupancy_pct || 0) / 100;
              return (
                <div key={p.id} className="flex items-center justify-between py-1.5">
                  <span style={{ color: "#64748B" }}>{p.name}</span>
                  <span className="font-medium" style={{ color: "#1A2E44" }}>₹{Math.round(estRev).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Amenities Overview" subtitle="Across all hotel properties" />
          <div className="space-y-3 text-sm">
            {[
              { name: "Swimming Pool", properties: 4, icon: Waves, pct: 80, color: "#2BAE8E" },
              { name: "Gym / Fitness Center", properties: 5, icon: Dumbbell, pct: 100, color: "#1A3C5E" },
              { name: "Restaurant", properties: 4, icon: Utensils, pct: 80, color: "#F5A623" },
              { name: "WiFi", properties: 5, icon: Wifi, pct: 100, color: "#2BAE8E" },
              { name: "Parking", properties: 3, icon: Car, pct: 60, color: "#64748B" },
              { name: "Coffee Shop", properties: 2, icon: Coffee, pct: 40, color: "#6B4226" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(14,36,61,0.06)" }}>
                    <Icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span style={{ color: "#1A2E44" }}>{a.name}</span>
                      <span style={{ color: "#64748B" }}>{a.properties}/{a.pct/20} properties</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                      <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: a.pct >= 80 ? "#2BAE8E" : a.pct >= 60 ? "#F5A623" : "#E53E3E" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Upcoming Group Bookings" subtitle="Confirmed group & corporate reservations" />
          <div className="space-y-3">
            {stats?.upcomingGroups && stats.upcomingGroups.length > 0 ? (
              stats.upcomingGroups.map((g: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: g.status === "confirmed" ? "rgba(42,157,143,0.15)" : "rgba(245,166,35,0.15)" }}>
                      <Briefcase className="w-4 h-4" style={{ color: g.status === "confirmed" ? "#2BAE8E" : "#F5A623" }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{g.group}</div>
                      <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: "#64748B" }}>
                        <Calendar className="w-3 h-3" /> {g.checkIn} — {g.checkOut}
                        <span>·</span>
                        <Users className="w-3 h-3" /> {g.rooms} pax
                        <span>·</span>
                        <UserCheck className="w-3 h-3" /> {g.contact}
                      </div>
                    </div>
                  </div>
                  <Badge variant={g.status === "confirmed" || g.status === "checked_in" ? "teal" : "amber"}>{g.status.replace("_", " ")}</Badge>
                </div>
              ))
            ) : (
               <div className="text-center py-8 text-sm" style={{ color: "#64748B" }}>No upcoming group bookings found.</div>
            )}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3">
            <Calendar className="w-3.5 h-3.5" /> Manage Group Bookings
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Seasonal Comparison" subtitle="Occupancy by season" />
          <div className="space-y-4">
            {stats?.seasonalData && stats.seasonalData.length > 0 ? (
              stats.seasonalData.map((s: any) => {
                let Icon = s.season.includes("Summer") ? Sun : s.season.includes("Winter") ? Snowflake : s.season.includes("Monsoon") ? CloudRain : Sun;
                let color = s.season.includes("Winter") ? "#2BAE8E" : s.season.includes("Summer") ? "#F5A623" : s.season.includes("Monsoon") ? "#1A3C5E" : "#64748B";
                return (
                  <div key={s.season} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(14,36,61,0.06)" }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "#1A2E44" }}>{s.season}</span>
                        <span style={{ color, fontWeight: 600 }}>{s.occ}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                        <div className="h-full rounded-full" style={{ width: `${s.occ}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
               <div className="text-center py-8 text-sm" style={{ color: "#64748B" }}>No seasonal data found.</div>
            )}
          </div>
          <div className="mt-4 pt-3 text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            <BarChart3 className="w-3 h-3 inline mr-1" />
            Winter quarter shows highest demand across all properties
          </div>
        </Card>
        <Card>
          <CardHeader title="Guest Satisfaction" subtitle="Average ratings this month" />
          <div className="space-y-3">
            {stats?.guestSatisfaction && stats.guestSatisfaction.length > 0 ? (
              stats.guestSatisfaction.map((s: any) => {
                const pct = Math.round((s.rating / 5) * 100);
                return (
                  <div key={s.category} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "#1A2E44" }}>{s.category}</span>
                        <span style={{ color: s.color, fontWeight: 600 }}>{s.rating}/5</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-sm" style={{ color: "#64748B" }}>No ratings data found.</div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs" style={{ color: "#64748B" }}>
            <ThumbsUp className="w-3 h-3" style={{ color: "#2BAE8E" }} />
            Overall satisfaction score: <span className="font-medium" style={{ color: "#1A2E44" }}>4.33 / 5</span>
          </div>
        </Card>
        <Card>
          <CardHeader title="Channel Performance" subtitle="Booking source breakdown" />
          <div className="space-y-3">
            {stats?.channelData && stats.channelData.length > 0 ? (
              stats.channelData.map((c: any, index: number) => {
                const colors = ["#2BAE8E", "#F5A623", "#1A3C5E", "#64748B", "#E53E3E"];
                const color = colors[index % colors.length];
                return (
                  <div key={c.channel} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "#1A2E44", textTransform: "capitalize" }}>{c.channel}</span>
                        <span className="font-medium" style={{ color }}>{c.pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                        <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: color }} />
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>₹{(c.amount / 100000).toFixed(1)}L revenue</div>
                    </div>
                  </div>
                );
              })
            ) : (
               <div className="text-center py-8 text-sm" style={{ color: "#64748B" }}>No channel data found.</div>
            )}
          </div>
          <div className="mt-4 pt-3 text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            <Globe className="w-3 h-3 inline mr-1" />
            Performance based on live booking sources
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Today's Arrivals" subtitle={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
          <div className="space-y-2">
            {stats?.todaysArrivals && stats.todaysArrivals.length > 0 ? (
              stats.todaysArrivals.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: a.status === "checked_in" ? "#2BAE8E" : "#1A3C5E" }}>
                      {a.guest.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-medium" style={{ color: "#1A2E44" }}>{a.guest}</div>
                      <div className="text-[10px]" style={{ color: "#64748B" }}>{a.room || 'Unassigned'} · {a.source}</div>
                    </div>
                  </div>
                  <Badge variant={a.status === "checked_in" ? "teal" : a.status === "confirmed" ? "amber" : "gray"}>{a.status.replace("_", " ")}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm" style={{ color: "#64748B" }}>No arrivals expected today.</div>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Today's Departures" subtitle="Check-outs" />
          <div className="space-y-2">
            {stats?.todaysDepartures && stats.todaysDepartures.length > 0 ? (
              stats.todaysDepartures.map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: d.status === "completed" ? "#2BAE8E" : "#F5A623" }}>
                      {d.guest.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-medium" style={{ color: "#1A2E44" }}>{d.guest}</div>
                      <div className="text-[10px]" style={{ color: "#64748B" }}>{d.room || 'Unassigned'} · {d.folio}</div>
                    </div>
                  </div>
                  <Badge variant={d.status === "completed" ? "teal" : "amber"}>{d.status}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm" style={{ color: "#64748B" }}>No departures expected today.</div>
            )}
          </div>
          <div className="mt-3 pt-3 flex justify-between text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            <span>Total check-outs: <strong style={{ color: "#1A2E44" }}>{stats?.todaysDepartures?.length || 0}</strong></span>
            <Button variant="outline" size="sm"><DollarSign className="w-3 h-3" /> Settlement</Button>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Housekeeping Status" subtitle="Today's room cleaning progress" />
        <div className="space-y-3">
          {stats?.housekeepingData && stats.housekeepingData.length > 0 ? (
            stats.housekeepingData.map((h: any) => (
              <div key={h.area} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#1A2E44" }}>{h.area}</span>
                    <span style={{ color: h.status === "completed" ? "#2BAE8E" : "#F5A623" }}>{h.done}/{h.total}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                    <div className="h-full rounded-full" style={{ width: `${h.total > 0 ? (h.done / h.total) * 100 : 0}%`, background: h.status === "completed" ? "#2BAE8E" : "#F5A623" }} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-sm" style={{ color: "#64748B" }}>No housekeeping tasks pending.</div>
          )}
        </div>
        <div className="mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
          <span><RefreshCw className="w-3 h-3 inline mr-1" /> Overall progress: {stats?.overallHkProgress || 0}%</span>
          <Badge variant="teal">{stats?.overallHkProgress === 100 ? "Completed" : "On track"}</Badge>
        </div>
      </Card>
    </div>
  );
}
