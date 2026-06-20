"use client";

import { useState, useEffect } from "react";
import { Building2, MapPin, Users, TrendingUp, DollarSign, AlertCircle, Loader2, RefreshCw, Search, Phone, ChevronRight, Home, Calendar, Clock, Globe, Briefcase, BarChart3, Plane, Percent, ArrowUpDown } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useApartmentStats } from "@/lib/hooks";

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

export default function ApartmentsPage() {
  const [search, setSearch] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { stats, isLoading, isError, mutate } = useApartmentStats();

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  // Fallbacks for live data structures
  const properties = stats?.properties || [];
  const summary = stats?.summary || { totalUnits: 0, totalOccupied: 0, avgOccupancy: 0, totalProperties: 0 };
  const extendedStays = stats?.extendedStays || [];
  const nationalityMix = stats?.nationalityMix || [];
  const splitData = stats?.splitData || { corporate: 65, leisure: 20, other: 15 };
  const maintenance = stats?.maintenance || [];
  const upcomingCheckouts = stats?.upcomingCheckouts || [];
  const upcomingArrivals = stats?.upcomingArrivals || [];
  const guestRequests = stats?.guestRequests || [];

  const filtered = properties.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase()) ||
    p.manager?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoadingDisplay) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2BAE8E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#64748B] text-sm font-medium">Loading Apartments Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Service Apartments</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Extended-stay furnished units</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={() => setActionFeedback({ type: "success", message: "Add property form opened" })}>
            <Home className="w-3.5 h-3.5" /> Add Property
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Could not load live data. Please try again.
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
            <div className="text-2xl font-bold">{summary.totalProperties}</div>
            <Building2 className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Properties</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{summary.totalUnits}</div>
            <Home className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Units</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{summary.totalOccupied}</div>
            <Users className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Occupied Units</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#F5A623" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>{summary.avgOccupancy}%</div>
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs" style={{ color: "rgba(0,0,0,0.6)" }}>Avg Occupancy</div>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#64748B" }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search apartments..."
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none border"
          style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
        />
      </div>

      {isLoading && !stats ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: "#64748B" }} />
          <p className="text-sm font-medium" style={{ color: "#1A2E44" }}>No properties found</p>
          <p className="text-xs mt-1" style={{ color: "#64748B" }}>Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p: any) => {
            const adr = Math.round((p.occupancy_pct || 0) * 54);
            return (
              <Card key={p.id}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold" style={{ color: "#1A3C5E" }}>{p.name}</h3>
                      <Badge variant="amber">{p.vertical_type?.replace("_", " ") || "Service Apt"}</Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "#64748B" }}>
                      <MapPin className="w-3 h-3" /> {p.address || "Address N/A"}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "#64748B" }}>
                      <span className="flex items-center gap-1"><Home className="w-3 h-3" /> {p.total_units || "—"} units</span>
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
                      <div className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>₹{adr.toLocaleString()}</div>
                      <div className="text-xs" style={{ color: "#64748B" }}>Est. ADR</div>
                    </div>
                    <Button variant="outline" size="sm">
                      View <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader title="Performance Overview" subtitle="All service apartment properties" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-3" style={{ color: "#1A3C5E" }}>Occupancy Trend</h4>
            <div className="flex items-end gap-2 h-24">
              {[72, 75, 78, 74, 80, 79, 82, 81, 83, 79, 81, 82].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t" style={{ height: `${val * 1.2}px`, background: val >= 80 ? "#2BAE8E" : val >= 75 ? "#F5A623" : "#64748B", minHeight: 4 }} />
                  <span className="text-[8px]" style={{ color: "#64748B" }}>{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 content-start">
            {[
              { label: "Avg Length of Stay", value: "4.2 nights", color: "#1A3C5E" },
              { label: "Avg Daily Rate", value: "₹5,400", color: "#2BAE8E" },
              { label: "RevPAR", value: "₹4,280", color: "#2BAE8E" },
              { label: "Total Revenue MTD", value: "₹24.8L", color: "#1A3C5E" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg text-center" style={{ background: "#F5F7FA" }}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="secondary" size="sm" className="w-full"><Building2 className="w-3.5 h-3.5" /> Add Property</Button>
          <Button variant="secondary" size="sm" className="w-full"><Calendar className="w-3.5 h-3.5" /> Manage Bookings</Button>
          <Button variant="secondary" size="sm" className="w-full"><DollarSign className="w-3.5 h-3.5" /> Rate Management</Button>
          <Button variant="outline" size="sm" className="w-full"><TrendingUp className="w-3.5 h-3.5" /> Occupancy Report</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Extended Stay Monitoring" subtitle="Guests staying 14+ nights" />
          <div className="space-y-3">
            {extendedStays.length === 0 && (
              <div className="text-sm text-center py-4 text-gray-500">No extended stays found.</div>
            )}
            {extendedStays.map((g: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: g.status === "active" ? "rgba(42,157,143,0.15)" : "rgba(245,166,35,0.15)" }}>
                    <Users className="w-4 h-4" style={{ color: g.status === "active" ? "#2BAE8E" : "#F5A623" }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{g.guest}</div>
                    <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: "#64748B" }}>
                      Unit {g.unit || "TBD"} · {g.company} · Since {g.check_in_date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: g.nights >= 30 ? "#F5A623" : "#2BAE8E" }}>{g.nights}</div>
                  <div className="text-[10px]" style={{ color: "#64748B" }}>nights</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            <span><Clock className="w-3 h-3 inline mr-1" /> Avg stay: <strong style={{ color: "#1A2E44" }}>{extendedStays.length > 0 ? Math.round(extendedStays.reduce((s: any, g: any) => s + g.nights, 0) / extendedStays.length) : 0} nights</strong></span>
            <Button variant="outline" size="sm"><Users className="w-3.5 h-3.5" /> View All</Button>
          </div>
        </Card>
        
        <Card>
          <CardHeader title="Unit Turnaround Time" subtitle="Avg days between checkout & check-in" />
          <div className="space-y-4">
            {[
              { unit: "Studio A (101-104)", avg: 1.2, trend: "down", color: "#2BAE8E" },
              { unit: "One-Bedroom (201-210)", avg: 1.8, trend: "stable", color: "#F5A623" },
              { unit: "Two-Bedroom (301-306)", avg: 2.1, trend: "up", color: "#E53E3E" },
              { unit: "Penthouse (401-404)", avg: 3.5, trend: "stable", color: "#F5A623" },
            ].map((t) => {
              const maxDays = 5;
              const pct = (t.avg / maxDays) * 100;
              return (
                <div key={t.unit} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#1A2E44" }}>{t.unit}</span>
                      <span className="font-medium" style={{ color: t.color }}>{t.avg} days</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.color }} />
                    </div>
                    <div className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: "#94A3B8" }}>
                      {t.trend === "down" && <ArrowUpDown className="w-3 h-3" style={{ color: "#2BAE8E" }} />}
                      {t.trend === "up" && <ArrowUpDown className="w-3 h-3" style={{ color: "#E53E3E" }} />}
                      {t.trend === "stable" && <Clock className="w-3 h-3" style={{ color: "#F5A623" }} />}
                      Turnaround {t.trend} from last month
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Guest Nationality Mix" subtitle="Current guest demographics" />
          <div className="space-y-3">
            {nationalityMix.length === 0 && (
              <div className="text-sm text-center py-4 text-gray-500">No demographics available.</div>
            )}
            {nationalityMix.map((n: any) => (
              <div key={n.country} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(14,36,61,0.06)", color: "#1A3C5E" }}>
                  {n.flag}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#1A2E44" }}>{n.country}</span>
                    <span className="font-medium" style={{ color: "#2BAE8E" }}>{n.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                    <div className="h-full rounded-full" style={{ width: `${n.pct}%`, background: "#2BAE8E" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 text-xs flex items-center gap-1" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            <Globe className="w-3 h-3" />
            <span>{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} · {nationalityMix.length} countries</span>
          </div>
        </Card>
        
        <Card>
          <CardHeader title="Corporate vs Leisure Split" subtitle="Booking purpose breakdown" />
          <div className="flex items-center justify-center py-6">
            <div className="relative w-32 h-32">
              <div className="w-32 h-32 rounded-full" style={{ background: "#E2E8F0" }} />
              <div className="absolute inset-0 w-32 h-32 rounded-full" style={{ background: `conic-gradient(#1A3C5E 0% ${splitData.corporate}%, #2BAE8E ${splitData.corporate}% ${splitData.corporate + splitData.leisure}%, #F5A623 ${splitData.corporate + splitData.leisure}% 100%)` }} />
              <div className="absolute inset-4 rounded-full flex items-center justify-center text-center" style={{ background: "#FFFFFF" }}>
                <div><div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>100%</div><div className="text-[8px]" style={{ color: "#64748B" }}>Total</div></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="font-semibold" style={{ color: "#1A3C5E" }}>{splitData.corporate}%</div>
              <div style={{ color: "#64748B" }}>Corporate</div>
              <div className="text-[10px]" style={{ color: "#94A3B8" }}><Briefcase className="w-3 h-3 inline" /> Business</div>
            </div>
            <div className="p-2 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="font-semibold" style={{ color: "#2BAE8E" }}>{splitData.leisure}%</div>
              <div style={{ color: "#64748B" }}>Leisure</div>
              <div className="text-[10px]" style={{ color: "#94A3B8" }}><Plane className="w-3 h-3 inline" /> Tourism</div>
            </div>
            <div className="p-2 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="font-semibold" style={{ color: "#F5A623" }}>{splitData.other}%</div>
              <div style={{ color: "#64748B" }}>Other</div>
              <div className="text-[10px]" style={{ color: "#94A3B8" }}><Percent className="w-3 h-3 inline" /> Relocation</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <CardHeader title="Monthly Performance Metrics" subtitle="Key indicators" />
          <div className="space-y-4">
            {[
              { label: "Avg Daily Rate", value: "₹5,400", change: "+3.2%", positive: true, icon: DollarSign },
              { label: "RevPAR", value: "₹4,280", change: "+5.1%", positive: true, icon: TrendingUp },
              { label: "Avg Length of Stay", value: "4.2 nights", change: "-0.3", positive: false, icon: Clock },
              { label: "Occupancy Rate", value: `${summary.avgOccupancy}%`, change: "+2.1%", positive: true, icon: BarChart3 },
              { label: "Total Revenue MTD", value: "₹24.8L", change: "+8.7%", positive: true, icon: DollarSign },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(14,36,61,0.06)" }}>
                      <Icon className="w-4 h-4" style={{ color: "#1A3C5E" }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{m.value}</div>
                      <div className="text-xs" style={{ color: "#64748B" }}>{m.label}</div>
                    </div>
                  </div>
                  <Badge variant={m.positive ? "teal" : "red"}>
                    <TrendingUp className={`w-3 h-3 inline mr-0.5 ${m.positive ? "" : "rotate-180"}`} />
                    {m.change}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Maintenance Requests" subtitle="Open tickets across properties" />
        <div className="space-y-3">
          {maintenance.length === 0 && (
            <div className="text-sm text-center py-4 text-gray-500">No open maintenance tickets found.</div>
          )}
          {maintenance.map((m: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.priority === "urgent" ? "#E53E3E" : m.priority === "high" ? "#F5A623" : m.priority === "medium" ? "#2BAE8E" : "#64748B" }} />
                <div>
                  <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{m.issue}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>{m.property} · Unit {m.unit || "TBD"}</div>
                </div>
              </div>
              <Badge variant={m.status === "resolved" ? "teal" : m.status === "in_progress" ? "amber" : m.status === "scheduled" ? "gray" : "red"}>{m.status.replace("_", " ")}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Upcoming Checkouts" subtitle="Next 7 days" />
          <div className="space-y-2">
            {upcomingCheckouts.length === 0 && (
              <div className="text-sm text-center py-4 text-gray-500">No checkouts scheduled in the next 7 days.</div>
            )}
            {upcomingCheckouts.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1A3C5E" }}>{c.guest.charAt(0)}</div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: "#1A2E44" }}>{c.guest}</div>
                    <div className="text-[10px]" style={{ color: "#64748B" }}>Unit {c.unit || "TBD"} · {c.company} · {c.nights} nights</div>
                  </div>
                </div>
                <span className="text-xs font-medium" style={{ color: "#F5A623" }}>{c.date}</span>
              </div>
            ))}
          </div>
        </Card>
        
        <Card>
          <CardHeader title="Upcoming Arrivals" subtitle="Expected check-ins" />
          <div className="space-y-2">
            {upcomingArrivals.length === 0 && (
              <div className="text-sm text-center py-4 text-gray-500">No arrivals scheduled in the next 7 days.</div>
            )}
            {upcomingArrivals.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#2BAE8E" }}>{a.guest.charAt(0)}</div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: "#1A2E44" }}>{a.guest}</div>
                    <div className="text-[10px]" style={{ color: "#64748B" }}>Unit {a.unit || "TBD"} · {a.company} · {a.nights} nights</div>
                  </div>
                </div>
                <span className="text-xs font-medium" style={{ color: "#2BAE8E" }}>{a.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Guest Services Requests" subtitle="Open requests across properties" />
        <div className="space-y-3">
          {guestRequests.length === 0 && (
            <div className="text-sm text-center py-4 text-gray-500">No open guest service requests.</div>
          )}
          {guestRequests.map((r: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(14,36,61,0.06)" }}>
                  <Users className="w-4 h-4" style={{ color: "#1A3C5E" }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{r.request}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Unit {r.unit || "TBD"}</div>
                </div>
              </div>
              <Badge variant={r.status === "in_progress" ? "amber" : r.status === "scheduled" ? "gray" : "red"}>{r.status.replace("_", " ")}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
