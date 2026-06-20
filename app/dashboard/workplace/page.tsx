"use client";

import { useState, useEffect } from "react";
import { Briefcase, Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, Users, Building2, Calendar, Clock, MapPin, UserCheck, DoorOpen, TrendingUp, CreditCard, Search, Coffee, MessageSquare, Star, Printer, Wifi, Tv } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import { useMemberships, useVisitors, useWorkplaceBookings } from "@/lib/hooks";

const MOCK_MEMBERSHIPS = [
  { corporate: "Acme Corp", plan: "Hot Desk Pool", seats: 10, used: 8, status: "active", renews: "01 Jul 2026" },
  { corporate: "TechStart Inc", plan: "Dedicated Seats", seats: 5, used: 5, status: "active", renews: "15 Jul 2026" },
  { corporate: "Design Studio", plan: "Private Cabin", seats: 2, used: 1, status: "active", renews: "20 Jun 2026" },
  { corporate: "LegalWorks", plan: "Virtual Office", seats: 0, used: 0, status: "pending", renews: "—" },
  { corporate: "CloudBase LLC", plan: "Hot Desk Pool", seats: 15, used: 12, status: "active", renews: "10 Aug 2026" },
  { corporate: "GreenTech Solutions", plan: "Dedicated Seats", seats: 3, used: 3, status: "active", renews: "05 Sep 2026" },
];

const FLOOR_PLAN_DESKS = [
  { id: "D-01", status: "available" }, { id: "D-02", status: "booked", m: "Rahul" },
  { id: "D-03", status: "available" }, { id: "D-04", status: "occupied", m: "Sneha" },
  { id: "C-01", status: "available" }, { id: "C-02", status: "booked", m: "Acme" },
  { id: "MR-01", status: "occupied", m: "Design" }, { id: "MR-02", status: "available" },
  { id: "DS-01", status: "occupied", m: "Priya" }, { id: "DS-02", status: "occupied", m: "Arjun" },
  { id: "D-05", status: "available" }, { id: "D-06", status: "booked", m: "Neha" },
  { id: "C-03", status: "available" }, { id: "MR-03", status: "available" },
  { id: "DS-03", status: "available" }, { id: "D-07", status: "occupied", m: "Vikram" },
];

const VISITOR_DATA = [
  { name: "Ankit Jain", host: "Priya S.", time: "10:30 AM", status: "checked_in" },
  { name: "Meera Nair", host: "Arjun N.", time: "2:00 PM", status: "pre_registered" },
  { name: "Rajesh K.", host: "Sneha R.", time: "4:00 PM", status: "pre_registered" },
];

const STATUS_STYLES: Record<string, { bg: string; border: string; label: string }> = {
  available: { bg: "rgba(42,157,143,0.1)", border: "1px solid #E2E8F0", label: "Available" },
  occupied: { bg: "rgba(14,36,61,0.08)", border: "1px solid #1A3C5E", label: "Occupied" },
  booked: { bg: "rgba(255,193,7,0.15)", border: "1px solid #E2E8F0", label: "Booked" },
};

function SkeletonStat() {
  return <div className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}><div className="w-12 h-8 rounded mb-2" style={{ background: "#CBD5E1" }} /><div className="w-16 h-3 rounded" style={{ background: "#CBD5E1" }} /></div>;
}

export default function WorkplacePage() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedDesk, setSelectedDesk] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { memberships, isLoading: loadingMemberships, mutate: mutateMemberships } = useMemberships();
  const { visitors, isLoading: loadingVisitors, mutate: mutateVisitors } = useVisitors();
  const { bookings, isLoading: loadingBookings, mutate: mutateBookings } = useWorkplaceBookings();

  const displayMemberships = (memberships && (memberships as any[]).length > 0) ? (memberships as any[]) : MOCK_MEMBERSHIPS;
  const displayVisitors = (visitors && (visitors as any[]).length > 0) ? (visitors as any[]) : VISITOR_DATA;

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const activeMemberships = displayMemberships.filter((m: any) => m.status === "active");
  const totalSeats = displayMemberships.reduce((s: number, m: any) => s + (m.seat_allocated || m.seats || 0), 0);
  const usedSeats = displayMemberships.reduce((s: number, m: any) => s + (m.seat_used || m.used || 0), 0);
  const utilizationPct = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;
  const availableDesks = FLOOR_PLAN_DESKS.filter((d) => d.status === "available").length;
  const meetingRoomsFree = FLOOR_PLAN_DESKS.filter((d) => d.id.startsWith("MR") && d.status === "available").length;
  const meetingRoomsTotal = FLOOR_PLAN_DESKS.filter((d) => d.id.startsWith("MR")).length;

  const isLoadingDisplay = loadingMemberships && !memberships;

  if (isLoadingDisplay) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2BAE8E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#64748B] text-sm font-medium">Loading Workplace Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Workplace & Managed Offices</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Innovate Coworking · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setActionFeedback({ type: "success", message: "New membership form opened" })}>
            <Briefcase className="w-3.5 h-3.5" /> New Membership
          </Button>
          <button onClick={() => { mutateMemberships(); mutateVisitors(); mutateBookings(); setIsLoading(true); setTimeout(() => setIsLoading(false), 1000); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div
          className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)",
            color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}`,
          }}
        >
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Seat Utilization", value: `${utilizationPct}%`, color: "#2BAE8E", icon: TrendingUp },
          { label: "Active Members", value: usedSeats.toString(), color: "#1A3C5E", icon: Users },
          { label: "Meeting Rooms", value: `${meetingRoomsFree}/${meetingRoomsTotal} Free`, color: "#2BAE8E", icon: DoorOpen },
          { label: "Monthly Revenue", value: "₹8.4L", color: "#F5A623", text: "#1A2E44", icon: CreditCard },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl p-4" style={{ background: s.color }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold" style={{ color: (s as any).text || "#FFF" }}>{s.value}</div>
                <Icon className="w-5 h-5 opacity-60" style={{ color: (s as any).text || "#FFF" }} />
              </div>
              <div className="text-xs" style={{ color: (s as any).text ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)" }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Interactive Floor Plan" subtitle="GF · Hot Desks & Open Area" />
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {FLOOR_PLAN_DESKS.map((s) => {
              const ss = STATUS_STYLES[s.status] || STATUS_STYLES.available;
              const isSelected = selectedDesk === s.id;
              return (
                <button key={s.id} onClick={() => setSelectedDesk(isSelected ? null : s.id)}
                  className="p-2 rounded-lg text-center text-xs cursor-pointer transition-all"
                  style={{
                    background: isSelected ? "rgba(42,157,143,0.2)" : ss.bg,
                    border: isSelected ? "2px solid #2BAE8E" : ss.border,
                  }}
                >
                  <div className="font-semibold" style={{ color: "#1A3C5E" }}>{s.id}</div>
                  <div className="text-[10px] mt-0.5 truncate" style={{ color: "#64748B" }}>
                    {"m" in s ? (s as any).m : "Available"}
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
                    s.status === "available" ? "bg-green-500" : s.status === "occupied" ? "bg-blue-800" : "bg-yellow-500"
                  }`} />
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "#64748B" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#2BAE8E" }} /> Available</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#1A3C5E" }} /> Occupied</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#F5A623" }} /> Booked</span>
            <span className="ml-auto font-medium" style={{ color: "#1A2E44" }}>{availableDesks} desks free</span>
          </div>
          {selectedDesk && (
            <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid #E2E8F0" }}>
              <span className="text-sm" style={{ color: "#1A2E44" }}>
                {selectedDesk} — {(FLOOR_PLAN_DESKS.find(d => d.id === selectedDesk) as any)?.m || "Available"}
              </span>
              <Button variant="primary" size="sm" onClick={() => setActionFeedback({ type: "success", message: `${selectedDesk} booked successfully` })}>
                Book Now
              </Button>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Visitor Management" subtitle="Today" />
          <div className="space-y-3">
            {loadingVisitors ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: "#64748B" }} /><p className="text-sm" style={{ color: "#64748B" }}>Loading visitors...</p></div>
            ) : displayVisitors.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
                <p className="text-sm" style={{ color: "#64748B" }}>No visitors today</p>
              </div>
            ) : (
              displayVisitors.map((v: any, i: number) => (
                <div key={v.id || i} className="flex items-center justify-between p-3 rounded-lg mb-2" style={{ background: "#F5F7FA" }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{v.visitor_name || v.name}</div>
                    <div className="text-xs" style={{ color: "#64748B" }}>
                      <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {v.host?.first_name ? `${v.host.first_name} ${v.host.last_name || ""}` : v.host || "—"} · {v.check_in ? new Date(v.check_in).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : v.time}</span>
                    </div>
                  </div>
                  <Badge variant={v.check_out ? "teal" : "amber"}>{v.check_out ? "checked in" : "pre registered"}</Badge>
                </div>
              ))
            )}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setActionFeedback({ type: "success", message: "Pre-registration form opened" })}>
            <Plus className="w-3.5 h-3.5" /> Pre-register Visitor
          </Button>
        </Card>
      </div>

      <Card>
        <CardHeader title="Corporate Memberships" subtitle={`${activeMemberships.length} active · seat pooling & license billing`} />
        {loadingMemberships ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded animate-pulse" style={{ background: "#F5F7FA" }} />)}</div>
        ) : (
        <Table
          data={displayMemberships}
          keyExtractor={(m: any) => m.id || Math.random()}
          columns={[
            { key: "corporate", header: "Corporate", render: (m: any) => <span className="font-medium text-sm">{m.corporate?.name || m.corporate || "—"}</span> },
            { key: "plan", header: "Plan", render: (m: any) => <Badge variant="gray">{m.plan?.name || m.plan || "—"}</Badge> },
            { key: "seats", header: "Allocated", render: (m: any) => <span className="font-medium">{m.seat_allocated || m.seats || 0}</span> },
            { key: "used", header: "Used", render: (m: any) => {
              const allocated = m.seat_allocated || m.seats || 0;
              const used = m.seat_used || m.used || 0;
              const pct = allocated > 0 ? (used / allocated) * 100 : 0;
              return (
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: used === allocated ? "#2BAE8E" : "#F5A623" }} />
                </div>
                <span className="text-xs" style={{ color: "#64748B" }}>{used}/{allocated}</span>
              </div>
            )}},
            { key: "status", header: "Status", render: (m: any) => <Badge variant={m.status === "active" ? "teal" : "amber"}>{m.status}</Badge> },
            { key: "end_date", header: "Renews", render: (m: any) => <span className="text-xs" style={{ color: "#64748B" }}>{m.end_date ? new Date(m.end_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : m.renews || "—"}</span> },
          ]}
        />
        )}
      </Card>

      <Card>
        <CardHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="secondary" size="sm" className="w-full"><Briefcase className="w-3.5 h-3.5" /> New Membership</Button>
          <Button variant="secondary" size="sm" className="w-full"><Calendar className="w-3.5 h-3.5" /> Book Meeting Room</Button>
          <Button variant="secondary" size="sm" className="w-full"><MapPin className="w-3.5 h-3.5" /> Manage Floor Plan</Button>
          <Button variant="outline" size="sm" className="w-full"><Users className="w-3.5 h-3.5" /> Visitor Report</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Meeting Room Bookings" subtitle="Today's schedule" />
        <div className="space-y-3">
          {loadingBookings ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: "#64748B" }} /><p className="text-sm" style={{ color: "#64748B" }}>Loading...</p></div>
          ) : (bookings && (bookings as any[]).length > 0 ? (bookings as any[]) : [
            { room: "Conference A", time: "09:00 — 10:30", host: "Priya S.", guests: 6, status: "in_progress" },
            { room: "Meeting Room 2", time: "11:00 — 12:00", host: "Arjun N.", guests: 4, status: "upcoming" },
            { room: "Board Room", time: "14:00 — 16:00", host: "Rajesh M.", guests: 12, status: "upcoming" },
            { room: "Conference A", time: "16:30 — 17:30", host: "Sneha R.", guests: 3, status: "available" },
          ]).map((b: any, i: number) => {
            const start = b.start_time ? new Date(b.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
            const end = b.end_time ? new Date(b.end_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
            const timeStr = start && end ? `${start} — ${end}` : b.time;
            const hostName = b.member ? `${b.member.first_name} ${b.member.last_name || ""}` : b.host || "—";
            const roomLabel = b.unit?.unit_label || b.room || b.booking_type || "Room";
            const bStatus = b.status || "available";
            return (
            <div key={b.id || i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bStatus === "in_progress" || bStatus === "checked_in" ? "rgba(42,157,143,0.15)" : "rgba(14,36,61,0.06)" }}>
                  <DoorOpen className="w-4 h-4" style={{ color: bStatus === "in_progress" || bStatus === "checked_in" ? "#2BAE8E" : "#1A3C5E" }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{roomLabel}</div>
                  <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: "#64748B" }}>
                    <Clock className="w-3 h-3" /> {timeStr} <span>·</span>
                    <Users className="w-3 h-3" /> {b.guests || "—"} <span>·</span>
                    <UserCheck className="w-3 h-3" /> {hostName}
                  </div>
                </div>
              </div>
              <Badge variant={bStatus === "in_progress" || bStatus === "checked_in" ? "teal" : bStatus === "upcoming" || bStatus === "confirmed" ? "amber" : "gray"}>
                {bStatus.replace("_", " ")}
              </Badge>
            </div>
          )})}
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid #E2E8F0" }}>
          <Button variant="outline" size="sm" className="flex-1"><Calendar className="w-3.5 h-3.5" /> Book a Room</Button>
          <Button variant="secondary" size="sm" className="flex-1"><Clock className="w-3.5 h-3.5" /> Check Schedule</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Amenity Usage" subtitle="Today's consumption across all areas" />
          <div className="space-y-4">
            {[
              { name: "Coffee", used: 78, total: 120, icon: Coffee, color: "#6B4226" },
              { name: "Printing (pages)", used: 145, total: 300, icon: Printer, color: "#1A3C5E" },
              { name: "WiFi Bandwidth", used: 4.2, total: 10, icon: Wifi, color: "#2BAE8E", unit: "GB" },
              { name: "Meeting Room Hours", used: 6, total: 12, icon: Tv, color: "#F5A623", unit: "hrs" },
              { name: "Coworking Pass Usage", used: 24, total: 40, icon: Users, color: "#1A3C5E" },
            ].map((a) => {
              const Icon = a.icon;
              const pct = Math.round((a.used / a.total) * 100);
              return (
                <div key={a.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(14,36,61,0.06)" }}>
                    <Icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#1A2E44" }}>{a.name}</span>
                      <span style={{ color: "#64748B" }}>{a.used}{a.unit || ""} / {a.total}{a.unit || ""}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? "#F5A623" : pct > 50 ? "#2BAE8E" : "#64748B" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Member Feedback" subtitle="Recent reviews · 4.6 average rating" />
          <div className="space-y-3">
            {[
              { name: "Ankit S.", rating: 5, comment: "Great workspace, fast WiFi and good coffee! The ambiance is perfect for focused work.", time: "2 hrs ago" },
              { name: "Meera K.", rating: 4, comment: "Clean environment but AC could be better near window seats. Otherwise a great place to work.", time: "5 hrs ago" },
              { name: "Rahul V.", rating: 5, comment: "Excellent meeting room facilities with top-notch AV equipment. Will definitely book again!", time: "1 day ago" },
              { name: "Priya M.", rating: 4, comment: "Printing service is very convenient. Would love more color printing options at reasonable rates.", time: "2 days ago" },
              { name: "Vikram S.", rating: 5, comment: "The virtual office plan has been perfect for my remote team. Highly recommended!", time: "3 days ago" },
            ].map((f, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>{f.name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className={`w-3 h-3 ${si < f.rating ? "fill-current" : ""}`} style={{ color: si < f.rating ? "#F5A623" : "#CBD5E1" }} />
                    ))}
                  </div>
                </div>
                <p className="text-xs" style={{ color: "#64748B" }}>{f.comment}</p>
                <span className="text-[10px] mt-1 block" style={{ color: "#94A3B8" }}>{f.time}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3">
            <MessageSquare className="w-3.5 h-3.5" /> View All Reviews
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Daily Revenue Breakdown" subtitle={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
          <div className="space-y-3">
            {[
              { label: "Hot Desk Passes", amount: 18500, pct: 22, color: "#2BAE8E" },
              { label: "Dedicated Seats", amount: 42000, pct: 50, color: "#1A3C5E" },
              { label: "Meeting Rooms", amount: 12800, pct: 15, color: "#F5A623" },
              { label: "Virtual Office", amount: 6400, pct: 8, color: "#64748B" },
              { label: "Amenities & Add-ons", amount: 4300, pct: 5, color: "#E53E3E" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#1A2E44" }}>{r.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                      <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                    <span className="text-sm font-medium min-w-[60px] text-right" style={{ color: "#1A2E44" }}>₹{r.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 flex justify-between" style={{ borderTop: "1px solid #E2E8F0" }}>
            <span className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>Total Today</span>
            <span className="text-sm font-bold" style={{ color: "#1A3C5E" }}>₹{(18500 + 42000 + 12800 + 6400 + 4300).toLocaleString()}</span>
          </div>
        </Card>
        <Card>
          <CardHeader title="Upcoming Events" subtitle="This week at the workspace" />
          <div className="space-y-3">
            {[
              { event: "Networking Mixer", date: "Today", time: "6:00 PM", attendees: 24, type: "social" },
              { event: "Startup Pitch Day", date: "Tomorrow", time: "2:00 PM", attendees: 45, type: "business" },
              { event: "Yoga Session", date: "Wed, 19 Jun", time: "8:00 AM", attendees: 12, type: "wellness" },
              { event: "Tech Talk: AI Trends", date: "Thu, 20 Jun", time: "4:00 PM", attendees: 30, type: "educational" },
              { event: "Friday Happy Hour", date: "Fri, 21 Jun", time: "5:30 PM", attendees: 50, type: "social" },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: e.type === "social" ? "rgba(245,166,35,0.15)" : e.type === "business" ? "rgba(42,157,143,0.15)" : e.type === "wellness" ? "rgba(42,157,143,0.1)" : "rgba(14,36,61,0.08)" }}>
                  <Calendar className="w-4 h-4" style={{ color: e.type === "social" ? "#F5A623" : e.type === "business" ? "#2BAE8E" : "#1A3C5E" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#1A2E44" }}>{e.event}</div>
                  <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: "#64748B" }}>
                    <span>{e.date}</span> <span>·</span>
                    <Clock className="w-3 h-3 inline" /> {e.time} <span>·</span>
                    <Users className="w-3 h-3 inline" /> {e.attendees} attending
                  </div>
                </div>
                <Badge variant={e.type === "social" ? "amber" : e.type === "business" ? "teal" : "gray"}>{e.type}</Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3">
            <Calendar className="w-3.5 h-3.5" /> View Full Calendar
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Members", value: "86", icon: Users, color: "#1A3C5E" },
          { label: "Daily Check-ins", value: "42", icon: UserCheck, color: "#2BAE8E" },
          { label: "Desk Vacancy", value: "8", icon: DoorOpen, color: "#F5A623" },
          { label: "Meeting Usage", value: "68%", icon: Calendar, color: "#1A3C5E" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#F5F7FA" }}>
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
              <div className="text-lg font-bold" style={{ color: "#1A2E44" }}>{s.value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Floor Activity Timeline" subtitle="Recent activity across floors" />
        <div className="space-y-2 text-sm">
          {[
            { time: "09:15 AM", event: "Desk D-04 occupied by Sneha", floor: "GF" },
            { time: "09:30 AM", event: "Meeting Room 1 booked by Acme Corp", floor: "GF" },
            { time: "10:00 AM", event: "New visitor checked in — Ankit Jain", floor: "Lobby" },
            { time: "10:45 AM", event: "Coffee machine refilled (2nd floor)", floor: "1F" },
            { time: "11:20 AM", event: "Printer toner replaced — Station 3", floor: "1F" },
            { time: "12:00 PM", event: "Desk DS-02 occupied by Arjun", floor: "1F" },
            { time: "01:30 PM", event: "WiFi maintenance completed", floor: "All" },
            { time: "02:15 PM", event: "Meeting Room 2 booked by Design Studio", floor: "GF" },
            { time: "03:00 PM", event: "Cleaning crew — Workstation block C", floor: "GF" },
            { time: "04:00 PM", event: "Pre-registered visitor: Meera Nair arrived", floor: "Lobby" },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5">
              <div className="w-14 text-xs shrink-0" style={{ color: "#94A3B8" }}>{a.time}</div>
              <div className="w-8 h-6 rounded text-[10px] font-medium flex items-center justify-center shrink-0" style={{ background: "#F5F7FA", color: "#64748B" }}>{a.floor}</div>
              <div className="text-xs" style={{ color: "#1A2E44" }}>{a.event}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Peak Hours" subtitle="Desk utilization by time of day" />
          <div className="flex items-end gap-1 h-20">
            {[20, 15, 25, 40, 65, 85, 95, 88, 75, 55, 30, 18].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full rounded-t" style={{ height: `${val * 1.2}px`, background: val >= 80 ? "#2BAE8E" : val >= 50 ? "#F5A623" : "#CBD5E1", minHeight: 3 }} />
                <span className="text-[7px]" style={{ color: "#94A3B8" }}>{["6a","8a","10a","12p","2p","4p","6p","8p","10p","12a","2a","4a"][i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Quick Links" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" className="w-full"><Coffee className="w-3.5 h-3.5" /> Order Supplies</Button>
            <Button variant="secondary" size="sm" className="w-full"><Wifi className="w-3.5 h-3.5" /> Network Status</Button>
            <Button variant="secondary" size="sm" className="w-full"><Users className="w-3.5 h-3.5" /> Member Directory</Button>
            <Button variant="outline" size="sm" className="w-full"><MapPin className="w-3.5 h-3.5" /> Floor Guide</Button>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Team Availability" subtitle="Staff on duty today" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "Priya S.", role: "Community Manager", status: "on_duty", shift: "9 AM — 6 PM" },
            { name: "Arjun N.", role: "Front Desk", status: "on_duty", shift: "9 AM — 6 PM" },
            { name: "Sneha R.", role: "Facilities", status: "on_duty", shift: "10 AM — 7 PM" },
            { name: "Vikram T.", role: "Tech Support", status: "on_duty", shift: "9 AM — 6 PM" },
            { name: "Neha K.", role: "Housekeeping", status: "on_break", shift: "8 AM — 4 PM" },
            { name: "Rahul S.", role: "Security", status: "on_duty", shift: "6 AM — 2 PM" },
            { name: "Deepa M.", role: "Cafeteria", status: "on_duty", shift: "8 AM — 5 PM" },
            { name: "Karan J.", role: "Maintenance", status: "on_duty", shift: "10 AM — 7 PM" },
          ].map((t) => (
            <div key={t.name} className="flex items-center gap-2.5 p-2.5 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1A3C5E" }}>
                {t.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: "#1A2E44" }}>{t.name}</div>
                <div className="text-[10px] truncate" style={{ color: "#64748B" }}>{t.role}</div>
                <div className="text-[10px]" style={{ color: "#94A3B8" }}>{t.shift}</div>
              </div>
              <div className={`w-2 h-2 rounded-full ${t.status === "on_duty" ? "bg-green-500" : "bg-yellow-500"}`} />
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3">
          <Users className="w-3.5 h-3.5" /> Full Staff Schedule
        </Button>
      </Card>

      <Card>
        <CardHeader title="Resource Booking Calendar" subtitle="Shared resources availability" />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg text-center" style={{ background: "#F5F7FA" }}>
            <div className="text-lg font-bold" style={{ color: "#2BAE8E" }}>3/4</div>
            <div className="text-xs" style={{ color: "#64748B" }}>Projector Rooms</div>
            <div className="w-full h-1 mt-2 rounded-full" style={{ background: "#E2E8F0" }}>
              <div className="w-3/4 h-full rounded-full" style={{ background: "#2BAE8E" }} />
            </div>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: "#F5F7FA" }}>
            <div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>2/3</div>
            <div className="text-xs" style={{ color: "#64748B" }}>Phone Booths</div>
            <div className="w-full h-1 mt-2 rounded-full" style={{ background: "#E2E8F0" }}>
              <div className="w-2/3 h-full rounded-full" style={{ background: "#1A3C5E" }} />
            </div>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: "#F5F7FA" }}>
            <div className="text-lg font-bold" style={{ color: "#F5A623" }}>1/2</div>
            <div className="text-xs" style={{ color: "#64748B" }}>Parking Spots</div>
            <div className="w-full h-1 mt-2 rounded-full" style={{ background: "#E2E8F0" }}>
              <div className="w-1/2 h-full rounded-full" style={{ background: "#F5A623" }} />
            </div>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: "#F5F7FA" }}>
            <div className="text-lg font-bold" style={{ color: "#2BAE8E" }}>6/8</div>
            <div className="text-xs" style={{ color: "#64748B" }}>Lockers</div>
            <div className="w-full h-1 mt-2 rounded-full" style={{ background: "#E2E8F0" }}>
              <div className="w-3/4 h-full rounded-full" style={{ background: "#2BAE8E" }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
