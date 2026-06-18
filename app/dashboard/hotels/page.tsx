"use client";

import { useState, useEffect } from "react";
import { Hotel, Star, MapPin, Users, TrendingUp, DollarSign, AlertCircle, Loader2, RefreshCw, Search, Building2, Phone, Mail, ChevronRight, Calendar, Briefcase, Sun, Snowflake, CloudRain, BarChart3, ThumbsUp, Globe, Coffee, Wifi, Waves, Dumbbell, Utensils, Car, MessageSquare, UserCheck } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useProperties } from "@/lib/hooks";

const MOCK_PROPERTIES = [
  { id: "p1", name: "Oceanview Grand Hotel", vertical_type: "hotel", total_units: 120, occupancy_pct: 84, address: "12 Marina Beach Rd, Chennai", phone: "+91-44-1001-0001", email: "oceanview@ehms.demo", star_rating: 5, manager: "Rajesh Mehta" },
  { id: "p2", name: "Seaside Boutique Hotel", vertical_type: "hotel", total_units: 45, occupancy_pct: 78, address: "45 East Coast Rd, Chennai", phone: "+91-44-1001-0005", email: "seaside@ehms.demo", star_rating: 3, manager: "Anita Desai" },
  { id: "p3", name: "Mountain View Resort", vertical_type: "hotel", total_units: 80, occupancy_pct: 72, address: "Hill Station Rd, Ooty", phone: "+91-44-1001-0006", email: "mountain@ehms.demo", star_rating: 5, manager: "Vikram Thapa" },
  { id: "p4", name: "Grand Palace Hotel", vertical_type: "hotel", total_units: 200, occupancy_pct: 91, address: "Cathedral Rd, Chennai", phone: "+91-44-1001-0007", email: "grand@ehms.demo", star_rating: 5, manager: "Arun Nair" },
  { id: "p5", name: "Business Inn", vertical_type: "hotel", total_units: 60, occupancy_pct: 65, address: "OMR Tech Park, Chennai", phone: "+91-44-1001-0008", email: "bizinn@ehms.demo", star_rating: 3, manager: "Suresh K." },
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
  const { properties, isLoading, isError, mutate } = useProperties("hotel");

  const displayProperties = (properties && (properties as any[]).length > 0) ? (properties as any[]) : MOCK_PROPERTIES;
  const isLoadingDisplay = isLoading && !properties;

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

  const avgOccupancy = filtered.length > 0
    ? Math.round(filtered.reduce((s: number, p: any) => s + (p.occupancy_pct || 0), 0) / filtered.length)
    : 0;

  const totalRooms = filtered.reduce((s: number, p: any) => s + (p.total_units || 0), 0);
  const totalOccupied = filtered.reduce((s: number, p: any) => s + Math.round(((p.total_units || 0) * (p.occupancy_pct || 0)) / 100), 0);

  const starRow = (n: number) => {
    return Array.from({ length: n }).map((_, i) => (
      <Star key={i} className="w-3 h-3 fill-current" style={{ color: "#F5A623" }} />
    ));
  };

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
          <CardHeader title="Upcoming Group Bookings" subtitle="Confirmed group reservations" />
          <div className="space-y-3">
            {[
              { group: "GlobalTech Conference", rooms: 45, checkIn: "22 Jun", checkOut: "26 Jun", status: "confirmed", contact: "Sarah T." },
              { group: "Wilson Wedding Block", rooms: 20, checkIn: "28 Jun", checkOut: "30 Jun", status: "confirmed", contact: "Emily W." },
              { group: "Corporate Training", rooms: 30, checkIn: "05 Jul", checkOut: "07 Jul", status: "tentative", contact: "Mark R." },
              { group: "Pharma Summit 2026", rooms: 60, checkIn: "12 Jul", checkOut: "15 Jul", status: "confirmed", contact: "Dr. Nair" },
              { group: "Family Reunion — Gupta", rooms: 15, checkIn: "18 Jul", checkOut: "20 Jul", status: "tentative", contact: "Anil G." },
            ].map((g, i) => (
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
                      <Users className="w-3 h-3" /> {g.rooms} rooms
                      <span>·</span>
                      <UserCheck className="w-3 h-3" /> {g.contact}
                    </div>
                  </div>
                </div>
                <Badge variant={g.status === "confirmed" ? "teal" : "amber"}>{g.status}</Badge>
              </div>
            ))}
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
            {[
              { season: "Summer (Apr-Jun)", occ: 88, color: "#F5A623", icon: Sun },
              { season: "Monsoon (Jul-Sep)", occ: 72, color: "#1A3C5E", icon: CloudRain },
              { season: "Winter (Oct-Dec)", occ: 94, color: "#2BAE8E", icon: Snowflake },
              { season: "Spring (Jan-Mar)", occ: 85, color: "#64748B", icon: Sun },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.season} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(14,36,61,0.06)" }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#1A2E44" }}>{s.season}</span>
                      <span style={{ color: s.color, fontWeight: 600 }}>{s.occ}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                      <div className="h-full rounded-full" style={{ width: `${s.occ}%`, background: s.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            <BarChart3 className="w-3 h-3 inline mr-1" />
            Winter quarter shows highest demand across all properties
          </div>
        </Card>
        <Card>
          <CardHeader title="Guest Satisfaction" subtitle="Average ratings this month" />
          <div className="space-y-3">
            {[
              { category: "Cleanliness", rating: 4.7, color: "#2BAE8E" },
              { category: "Staff Service", rating: 4.5, color: "#2BAE8E" },
              { category: "Room Comfort", rating: 4.3, color: "#F5A623" },
              { category: "Food & Dining", rating: 4.1, color: "#F5A623" },
              { category: "Amenities", rating: 4.4, color: "#2BAE8E" },
              { category: "Value for Money", rating: 4.0, color: "#64748B" },
            ].map((s) => {
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
            })}
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs" style={{ color: "#64748B" }}>
            <ThumbsUp className="w-3 h-3" style={{ color: "#2BAE8E" }} />
            Overall satisfaction score: <span className="font-medium" style={{ color: "#1A2E44" }}>4.33 / 5</span>
          </div>
        </Card>
        <Card>
          <CardHeader title="Channel Performance" subtitle="Booking source breakdown" />
          <div className="space-y-3">
            {[
              { channel: "Direct", pct: 35, amount: 4250000, color: "#2BAE8E" },
              { channel: "OTA (Expedia, Booking)", pct: 28, amount: 3400000, color: "#F5A623" },
              { channel: "Corporate", pct: 22, amount: 2670000, color: "#1A3C5E" },
              { channel: "Travel Agents", pct: 10, amount: 1210000, color: "#64748B" },
              { channel: "Walk-in", pct: 5, amount: 610000, color: "#E53E3E" },
            ].map((c) => (
              <div key={c.channel} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#1A2E44" }}>{c.channel}</span>
                    <span className="font-medium" style={{ color: c.color }}>{c.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>₹{(c.amount / 100000).toFixed(1)}L revenue</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            <Globe className="w-3 h-3 inline mr-1" />
            Direct bookings generate highest margin at 35% share
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Today's Arrivals" subtitle={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
          <div className="space-y-2">
            {[
              { guest: "Mr. & Mrs. Kapoor", room: "Deluxe Suite 501", source: "prepaid", status: "expected" },
              { guest: "David Thompson", room: "Executive King 304", source: "corporate", status: "checked_in" },
              { guest: "Priya Sharma", room: "Standard Twin 210", source: "walk-in", status: "expected" },
              { guest: "Dr. Alok Mehta", room: "Premium Suite 401", source: "prepaid", status: "expected" },
              { guest: "Sarah Chen", room: "Deluxe Double 108", source: "ota", status: "confirmed" },
              { guest: "Robert & Anne", room: "Honeymoon Suite 601", source: "ota", status: "confirmed" },
              { guest: "Vikram Singhania", room: "Premium Suite 404", source: "corporate", status: "expected" },
              { guest: "Emma Watson", room: "Deluxe King 206", source: "ota", status: "confirmed" },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: a.status === "checked_in" ? "#2BAE8E" : "#1A3C5E" }}>
                    {a.guest.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: "#1A2E44" }}>{a.guest}</div>
                    <div className="text-[10px]" style={{ color: "#64748B" }}>{a.room}</div>
                  </div>
                </div>
                <Badge variant={a.status === "checked_in" ? "teal" : a.status === "confirmed" ? "amber" : "gray"}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Today's Departures" subtitle="Check-outs" />
          <div className="space-y-2">
            {[
              { guest: "Rajesh & Anjali", room: "Ocean Suite 201", folio: "₹42,500", status: "pending" },
              { guest: "Michael Brown", room: "Executive King 102", folio: "₹18,200", status: "completed" },
              { guest: "Neha Gupta", room: "Deluxe Queen 308", folio: "₹24,800", status: "completed" },
              { guest: "William & Kate", room: "Presidential Suite 601", folio: "₹1,25,000", status: "pending" },
              { guest: "Akira Tanaka", room: "Standard Twin 109", folio: "₹9,600", status: "completed" },
              { guest: "Sunil & Anita", room: "Executive King 103", folio: "₹21,300", status: "completed" },
              { guest: "Claire Dubois", room: "Deluxe Suite 207", folio: "₹32,100", status: "pending" },
              { guest: "Mark & Lisa", room: "Standard Twin 110", folio: "₹8,400", status: "completed" },
            ].map((d, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: d.status === "completed" ? "#2BAE8E" : "#F5A623" }}>
                    {d.guest.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: "#1A2E44" }}>{d.guest}</div>
                    <div className="text-[10px]" style={{ color: "#64748B" }}>{d.room} · {d.folio}</div>
                  </div>
                </div>
                <Badge variant={d.status === "completed" ? "teal" : "amber"}>{d.status}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex justify-between text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            <span>Total check-outs: <strong style={{ color: "#1A2E44" }}>8</strong></span>
            <Button variant="outline" size="sm"><DollarSign className="w-3 h-3" /> Settlement</Button>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Housekeeping Status" subtitle="Today's room cleaning progress" />
        <div className="space-y-3">
          {[
            { area: "Deluxe Wing (101-120)", done: 16, total: 20, status: "in_progress" },
            { area: "Executive Wing (201-215)", done: 12, total: 15, status: "completed" },
            { area: "Suite Floor (401-410)", done: 6, total: 10, status: "in_progress" },
            { area: "Standard Wing (301-320)", done: 20, total: 20, status: "completed" },
          ].map((h) => (
            <div key={h.area} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#1A2E44" }}>{h.area}</span>
                  <span style={{ color: h.status === "completed" ? "#2BAE8E" : "#F5A623" }}>{h.done}/{h.total}</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                  <div className="h-full rounded-full" style={{ width: `${(h.done / h.total) * 100}%`, background: h.status === "completed" ? "#2BAE8E" : "#F5A623" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
          <span><RefreshCw className="w-3 h-3 inline mr-1" /> Overall progress: 72%</span>
          <Badge variant="teal">On track</Badge>
        </div>
      </Card>
    </div>
  );
}

function DoorOpen({ className, ...props }: { className?: string; [key: string]: any }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>;
}
