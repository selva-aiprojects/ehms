"use client";

import { useState, useEffect } from "react";
import { Building2, MapPin, Users, TrendingUp, DollarSign, AlertCircle, Loader2, RefreshCw, Search, Phone, ChevronRight, Home, Calendar, Clock, Globe, Briefcase, BarChart3, Plane, Percent, ArrowUpDown } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useApartmentStats } from "@/lib/hooks";
import { useGlobalSettings } from "@/components/providers/SettingsProvider";
import { useJourney } from "@/components/providers/JourneyProvider";

function SkeletonCard() {
  return (
    <div className="rounded-xl p-4 animate-pulse" style={{ background: "var(--color-white)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between">
        <div><div className="w-40 h-5 rounded mb-2" style={{ background: "var(--color-border)" }} /><div className="w-24 h-3 rounded" style={{ background: "var(--color-border)" }} /></div>
        <div className="text-right"><div className="w-12 h-5 rounded mb-1" style={{ background: "var(--color-border)" }} /><div className="w-8 h-3 rounded" style={{ background: "var(--color-border)" }} /></div>
      </div>
    </div>
  );
}

export default function ApartmentsPage() {
  const { selectedPropertyId } = useJourney();
  const [search, setSearch] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { stats, isLoading, isError, mutate } = useApartmentStats(selectedPropertyId);
  const { settings } = useGlobalSettings();

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

  const isLoadingDisplay = isLoading && !stats;

  const filtered = properties.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase()) ||
    p.manager?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoadingDisplay) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--color-text-muted)] text-sm font-medium">Loading Apartments Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: settings.primary_color }}>Service Apartments</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Extended-stay furnished units</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "var(--color-light)", color: "var(--color-text-muted)" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={() => setActionFeedback({ type: "success", message: "Add property form opened" })}>
            <Home className="w-3.5 h-3.5" /> Add Property
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(var(--color-danger-rgb),0.08)", color: "var(--color-danger)", border: "1px solid rgba(var(--color-danger-rgb),0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Could not load live data. Please try again.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {actionFeedback && (
        <div
          className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.1)" : "rgba(var(--color-danger-rgb),0.08)",
            color: actionFeedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.2)" : "rgba(var(--color-danger-rgb),0.2)"}`,
          }}
        >
          {actionFeedback.type === "success" ? <RefreshCw className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-navy)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{summary.totalProperties}</div>
            <Building2 className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Properties</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-primary)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{summary.totalUnits}</div>
            <Home className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Units</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-primary)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{summary.totalOccupied}</div>
            <Users className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Occupied Units</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--color-warning)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{summary.avgOccupancy}%</div>
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs" style={{ color: "rgba(0,0,0,0.6)" }}>Avg Occupancy</div>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search apartments..."
          className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none border"
          style={{ borderColor: "var(--color-border)", background: "var(--color-white)" }}
        />
      </div>

      {isLoading && !stats ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>No properties found</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Try adjusting your search</p>
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
                      <h3 className="font-semibold" style={{ color: "var(--color-navy)" }}>{p.name}</h3>
                      <Badge variant="amber">{p.vertical_type?.replace("_", " ") || "Service Apt"}</Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <MapPin className="w-3 h-3" /> {p.address || "Address N/A"}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <span className="flex items-center gap-1"><Home className="w-3 h-3" /> {p.total_units || "—"} units</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Manager: {p.manager || "—"}</span>
                      {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right min-w-[60px]">
                      <div className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>{p.occupancy_pct || 0}%</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Occupancy</div>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <div className="text-sm font-semibold" style={{ color: settings.primary_color }}>{settings.currency_symbol}{adr.toLocaleString()}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Est. ADR</div>
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
            <h4 className="font-medium mb-3" style={{ color: "var(--color-navy)" }}>Occupancy Trend</h4>
            <div className="flex items-end gap-2 h-24">
              {[72, 75, 78, 74, 80, 79, 82, 81, 83, 79, 81, 82].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t" style={{ height: `${val * 1.2}px`, background: val >= 80 ? "var(--color-primary)" : val >= 75 ? "var(--color-warning)" : "var(--color-text-muted)", minHeight: 4 }} />
                  <span className="text-[8px]" style={{ color: "var(--color-text-muted)" }}>{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 content-start">
            {[
              { label: "Avg Length of Stay", value: "4.2 nights", color: settings.primary_color },
              { label: "Avg Daily Rate", value: `${settings.currency_symbol}5,400`, color: settings.secondary_color },
              { label: "RevPAR", value: `${settings.currency_symbol}4,280`, color: settings.secondary_color },
              { label: "Total Revenue MTD", value: `${settings.currency_symbol}24.8L`, color: settings.primary_color },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg text-center" style={{ background: "var(--color-light)" }}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
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
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: g.status === "active" ? "rgba(var(--color-primary-dark-rgb),0.15)" : "rgba(var(--color-warning-rgb),0.15)" }}>
                    <Users className="w-4 h-4" style={{ color: g.status === "active" ? "var(--color-primary)" : "var(--color-warning)" }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{g.guest}</div>
                    <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      Unit {g.unit || "TBD"} · {g.company} · Since {g.check_in_date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: g.nights >= 30 ? "var(--color-warning)" : "var(--color-primary)" }}>{g.nights}</div>
                  <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>nights</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            <span><Clock className="w-3 h-3 inline mr-1" /> Avg stay: <strong style={{ color: "var(--color-text)" }}>{extendedStays.length > 0 ? Math.round(extendedStays.reduce((s: any, g: any) => s + g.nights, 0) / extendedStays.length) : 0} nights</strong></span>
            <Button variant="outline" size="sm"><Users className="w-3.5 h-3.5" /> View All</Button>
          </div>
        </Card>
        
        <Card>
          <CardHeader title="Unit Turnaround Time" subtitle="Avg days between checkout & check-in" />
          <div className="space-y-4">
            {[
              { unit: "Studio A (101-104)", avg: 1.2, trend: "down", color: "var(--color-primary)" },
              { unit: "One-Bedroom (201-210)", avg: 1.8, trend: "stable", color: "var(--color-warning)" },
              { unit: "Two-Bedroom (301-306)", avg: 2.1, trend: "up", color: "var(--color-danger)" },
              { unit: "Penthouse (401-404)", avg: 3.5, trend: "stable", color: "var(--color-warning)" },
            ].map((t) => {
              const maxDays = 5;
              const pct = (t.avg / maxDays) * 100;
              return (
                <div key={t.unit} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--color-text)" }}>{t.unit}</span>
                      <span className="font-medium" style={{ color: t.color }}>{t.avg} days</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.color }} />
                    </div>
                    <div className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: "var(--color-text-faint)" }}>
                      {t.trend === "down" && <ArrowUpDown className="w-3 h-3" style={{ color: "var(--color-primary)" }} />}
                      {t.trend === "up" && <ArrowUpDown className="w-3 h-3" style={{ color: "var(--color-danger)" }} />}
                      {t.trend === "stable" && <Clock className="w-3 h-3" style={{ color: "var(--color-warning)" }} />}
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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(var(--color-navy-rgb),0.06)", color: "var(--color-navy)" }}>
                  {n.flag}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--color-text)" }}>{n.country}</span>
                    <span className="font-medium" style={{ color: "var(--color-primary)" }}>{n.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${n.pct}%`, background: "var(--color-primary)" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 text-xs flex items-center gap-1" style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            <Globe className="w-3 h-3" />
            <span>{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} · {nationalityMix.length} countries</span>
          </div>
        </Card>
        
        <Card>
          <CardHeader title="Corporate vs Leisure Split" subtitle="Booking purpose breakdown" />
          <div className="flex items-center justify-center py-6">
            <div className="relative w-32 h-32">
              <div className="w-32 h-32 rounded-full" style={{ background: "var(--color-border)" }} />
              <div className="absolute inset-0 w-32 h-32 rounded-full" style={{ background: `conic-gradient(var(--color-navy) 0% ${splitData.corporate}%, var(--color-primary) ${splitData.corporate}% ${splitData.corporate + splitData.leisure}%, var(--color-warning) ${splitData.corporate + splitData.leisure}% 100%)` }} />
              <div className="absolute inset-4 rounded-full flex items-center justify-center text-center" style={{ background: "var(--color-white)" }}>
                <div><div className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>100%</div><div className="text-[8px]" style={{ color: "var(--color-text-muted)" }}>Total</div></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg" style={{ background: "var(--color-light)" }}>
              <div className="font-semibold" style={{ color: "var(--color-navy)" }}>{splitData.corporate}%</div>
              <div style={{ color: "var(--color-text-muted)" }}>Corporate</div>
              <div className="text-[10px]" style={{ color: "var(--color-text-faint)" }}><Briefcase className="w-3 h-3 inline" /> Business</div>
            </div>
            <div className="p-2 rounded-lg" style={{ background: "var(--color-light)" }}>
              <div className="font-semibold" style={{ color: "var(--color-primary)" }}>{splitData.leisure}%</div>
              <div style={{ color: "var(--color-text-muted)" }}>Leisure</div>
              <div className="text-[10px]" style={{ color: "var(--color-text-faint)" }}><Plane className="w-3 h-3 inline" /> Tourism</div>
            </div>
            <div className="p-2 rounded-lg" style={{ background: "var(--color-light)" }}>
              <div className="font-semibold" style={{ color: "var(--color-warning)" }}>{splitData.other}%</div>
              <div style={{ color: "var(--color-text-muted)" }}>Other</div>
              <div className="text-[10px]" style={{ color: "var(--color-text-faint)" }}><Percent className="w-3 h-3 inline" /> Relocation</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <CardHeader title="Monthly Performance Metrics" subtitle="Key indicators" />
          <div className="space-y-4">
            {[
              { label: "Avg Daily Rate", value: `${settings.currency_symbol}5,400`, change: "+3.2%", positive: true, icon: DollarSign },
              { label: "RevPAR", value: `${settings.currency_symbol}4,280`, change: "+5.1%", positive: true, icon: TrendingUp },
              { label: "Avg Length of Stay", value: "4.2 nights", change: "-0.3", positive: false, icon: Clock },
              { label: "Occupancy Rate", value: `${summary.avgOccupancy}%`, change: "+2.1%", positive: true, icon: BarChart3 },
              { label: "Total Revenue MTD", value: `${settings.currency_symbol}24.8L`, change: "+8.7%", positive: true, icon: DollarSign },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-navy-rgb),0.06)" }}>
                      <Icon className="w-4 h-4" style={{ color: "var(--color-navy)" }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{m.value}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.label}</div>
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
            <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.priority === "urgent" ? "var(--color-danger)" : m.priority === "high" ? "var(--color-warning)" : m.priority === "medium" ? "var(--color-primary)" : "var(--color-text-muted)" }} />
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{m.issue}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{m.property} · Unit {m.unit || "TBD"}</div>
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
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "var(--color-light)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--color-navy)" }}>{c.guest.charAt(0)}</div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: "var(--color-text)" }}>{c.guest}</div>
                    <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Unit {c.unit || "TBD"} · {c.company} · {c.nights} nights</div>
                  </div>
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--color-warning)" }}>{c.date}</span>
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
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "var(--color-light)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--color-primary)" }}>{a.guest.charAt(0)}</div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: "var(--color-text)" }}>{a.guest}</div>
                    <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Unit {a.unit || "TBD"} · {a.company} · {a.nights} nights</div>
                  </div>
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>{a.date}</span>
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
            <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-navy-rgb),0.06)" }}>
                  <Users className="w-4 h-4" style={{ color: "var(--color-navy)" }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{r.request}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Unit {r.unit || "TBD"}</div>
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
