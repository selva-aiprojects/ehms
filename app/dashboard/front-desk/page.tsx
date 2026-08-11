"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";import { Search, UserPlus, LogIn, LogOut, RefreshCw, AlertCircle, Loader2, Users, Calendar, DoorOpen, BedDouble, Phone, Mail, MapPin, Clock, Star, MessageSquare, Bell, Settings, ClipboardList, ArrowRight, MoreHorizontal, Home, Wifi, Coffee, ChevronRight, BarChart3, Download, Utensils, Trash2, RotateCcw, Send, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useReservations, useGuests, useRoomMatrix, useProperty } from "@/lib/hooks";
import { useJourney } from "@/components/providers/JourneyProvider";
import { useCheckIn, useCheckOut, useCreateReservation, useCreateGuest } from "@/lib/hooks/mutations";
import CheckInModal from "./components/CheckInModal";
import FolioModal from "./components/FolioModal";
import OffersCard from "./components/OffersCard";
import ChannelPartnersCard from "./components/ChannelPartnersCard";
import AiRevenueManagerCard from "./components/AiRevenueManagerCard";
import WalkInModal from "./components/WalkInModal";
import LogRequestModal from "./components/LogRequestModal";
import { useRouter } from "next/navigation";

const ROOM_STATUS_STYLES: Record<string, { bg: string; border: string; dot: string; label: string; text: string; pillBg: string; pillText: string }> = {
  vacant: { bg: "var(--color-success-soft)", border: "var(--color-success)", dot: "var(--color-success)", label: "Available", text: "var(--color-success-dark)", pillBg: "var(--color-success-soft)", pillText: "var(--color-success-dark)" },
  occupied: { bg: "var(--color-info-soft)", border: "var(--color-info)", dot: "var(--color-info)", label: "Occupied", text: "var(--color-info-dark)", pillBg: "var(--color-info-soft)", pillText: "var(--color-info)" },
  dirty: { bg: "var(--color-warning-soft)", border: "var(--color-warning)", dot: "var(--color-warning)", label: "Dirty", text: "var(--color-warning-dark)", pillBg: "var(--color-warning-soft)", pillText: "var(--color-warning-dark)" },
  cleaning: { bg: "var(--color-violet-soft)", border: "var(--color-violet)", dot: "var(--color-violet)", label: "Cleaning", text: "var(--color-violet-dark)", pillBg: "var(--color-violet-soft)", pillText: "var(--color-violet-dark)" },
  maintenance: { bg: "var(--color-danger-soft)", border: "var(--color-danger)", dot: "var(--color-danger)", label: "Maintenance", text: "var(--color-danger-dark)", pillBg: "var(--color-danger-soft)", pillText: "var(--color-danger-dark)" },
  reserved: { bg: "var(--color-light)", border: "var(--color-text-muted)", dot: "var(--color-text-muted)", label: "Reserved", text: "var(--color-text)", pillBg: "var(--color-border)", pillText: "var(--color-text)" },
  inspection: { bg: "var(--color-success-soft)", border: "var(--color-success)", dot: "var(--color-success)", label: "Inspection", text: "var(--color-success-dark)", pillBg: "var(--color-success-soft)", pillText: "var(--color-success-dark)" },
};

function SkeletonRoomCard() {
  return (
    <div className="rounded-xl p-3 animate-pulse" style={{ background: "var(--color-light)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-4 rounded" style={{ background: "var(--color-border)" }} />
        <div className="w-8 h-4 rounded" style={{ background: "var(--color-border)" }} />
      </div>
      <div className="w-16 h-3 rounded mb-2" style={{ background: "var(--color-border)" }} />
      <div className="w-12 h-3 rounded" style={{ background: "var(--color-border)" }} />
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="w-24 h-4 rounded" style={{ background: "var(--color-border)" }} />
      <div className="w-full h-8 rounded" style={{ background: "var(--color-border)" }} />
      <div className="w-full h-8 rounded" style={{ background: "var(--color-border)" }} />
      <div className="w-3/4 h-8 rounded" style={{ background: "var(--color-border)" }} />
    </div>
  );
}

function StatTile({ icon: Icon, label, value, accent, bg }: { icon: LucideIcon; label: string; value: ReactNode; accent: string; bg: string }) {
  return (
    <div className="rounded-xl p-3.5 flex items-center gap-3 transition-transform hover:-translate-y-0.5" style={{ background: bg }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold leading-none" style={{ color: accent }}>{value}</div>
        <div className="text-xs mt-1 truncate" style={{ color: "var(--color-text-muted)" }}>{label}</div>
      </div>
    </div>
  );
}

import { toast } from "react-hot-toast";

export default function FrontDeskPage() {
  const { selectedPropertyId, activeJourney } = useJourney();
  const { property: currentProperty } = useProperty(selectedPropertyId || "");
  const [floor, setFloor] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [applyingAction, setApplyingAction] = useState<string | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [logRequestModalData, setLogRequestModalData] = useState<{ isOpen: boolean, roomId?: string, unitLabel?: string } | null>(null);
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];
  const { reservations, isLoading: loadingRes, isError: resError, mutate: mutateRes } = useReservations({ date: today });
  const { rooms: matrixRooms, isLoading: loadingMatrix, mutate: mutateMatrix } = useRoomMatrix(selectedPropertyId);
  const { guests, isLoading: loadingGuests } = useGuests();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const [checkInModalData, setCheckInModalData] = useState<{ isOpen: boolean, roomId: string, bookingId: string, guestName: string, unitLabel: string } | null>(null);
  const [folioModalData, setFolioModalData] = useState<{ isOpen: boolean, roomId: string, bookingId: string, guestName: string } | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    if (!selectedPropertyId) return;
    setLoadingDashboard(true);
    fetch(`/api/dashboard/front-desk/dashboard?property_id=${selectedPropertyId}`)
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(() => setDashboardData(null))
      .finally(() => setLoadingDashboard(false));
  }, [selectedPropertyId]);

  const rooms = matrixRooms || [];
  const distinctBuildings = Array.from(new Set(rooms.map((r: any) => r.building_code || "A"))).sort() as string[];
  const activeBuilding = selectedBuilding || distinctBuildings[0] || "A";
  const buildingRooms = rooms.filter((r: any) => (r.building_code || "A") === activeBuilding);
  const distinctFloors = Array.from(new Set(buildingRooms.map((r: any) => r.floor_number))).sort((a: any, b: any) => a - b) as number[];
  const activeFloor = distinctFloors.includes(floor) ? floor : (distinctFloors[0] || 1);

  const floorRooms = buildingRooms.filter((r: any) => r.floor_number === activeFloor);

  function computeFlatStatus(parent: any): string {
    if (!parent.children || parent.children.length === 0) return parent.status || 'vacant';
    const occ = parent.occupied_children || 0;
    const dirty = parent.dirty_children || 0;
    const maint = parent.maint_children || 0;
    const total = parent.child_count || parent.children.length;
    if (occ === total) return 'occupied';
    if (occ > 0) return 'occupied';
    if (maint > 0) return 'maintenance';
    if (dirty > 0) return 'dirty';
    return 'vacant';
  }

  const filtered = floorRooms.filter((r: any) => {
    if (statusFilter === "all") return true;
    const st = r.unit_type === 'apartment' && !r.parent_unit_id ? computeFlatStatus(r) : r.status;
    if (statusFilter === "vacant") return st === "vacant";
    if (statusFilter === "occupied") return st === "occupied";
    if (statusFilter === "dirty") return st === "dirty" || st === "cleaning";
    if (statusFilter === "maintenance") return st === "maintenance";
    return true;
  });
  const unitStatus = (r: any) => (r.unit_type === 'apartment' && !r.parent_unit_id ? computeFlatStatus(r) : r.status);
  const statusCounts = {
    all: floorRooms.length,
    vacant: floorRooms.filter((r: any) => unitStatus(r) === "vacant").length,
    occupied: floorRooms.filter((r: any) => unitStatus(r) === "occupied").length,
    dirty: floorRooms.filter((r: any) => { const st = unitStatus(r); return st === "dirty" || st === "cleaning"; }).length,
    maintenance: floorRooms.filter((r: any) => unitStatus(r) === "maintenance").length,
  };
  const selected = rooms.find((r: any) => r.id === selectedRoom);
  const isParentSelected = selected?.unit_type === "apartment" && !selected?.parent_unit_id;

  const arrivalsData = reservations
    ? (reservations as any[])?.filter((b: any) => b.status === "confirmed" || b.status === "pending") || []
    : [];
    
  const inHouseData = rooms.filter((r: any) => r.booking_status === "checked_in" || (r.status === "occupied" && r.booking_id));
  const departuresData = inHouseData.filter((r: any) => {
    if (!r.check_out) return false;
    return r.check_out?.startsWith(today);
  });

  function handleCheckIn(roomId: string, bookingId?: string) {
    if (!bookingId) {
      toast.error("No active booking found for this room.");
      return;
    }
    const rm = rooms.find((r: any) => r.id === roomId);
    setCheckInModalData({
      isOpen: true,
      roomId,
      bookingId,
      guestName: rm?.guest_name || "Guest",
      unitLabel: rm?.unit_label || roomId
    });
  }

  async function processCheckIn(data: any) {
    setApplyingAction(data.roomId);
    try {
      await checkInMutation.trigger(data.bookingId);
      toast.success(`Checked in Room ${data.unitLabel}`);
      mutateRes();
      mutateMatrix();
    } catch {
      toast.error("Check-in failed. Please try again.");
    } finally {
      setApplyingAction(null);
      setCheckInModalData(null);
    }
  }

  async function handleCheckOut(roomId: string, bookingId?: string) {
    setApplyingAction(roomId);
    try {
      const bid = bookingId || `b-${roomId}`;
      await checkOutMutation.trigger(bid);
      toast.success(`Checked out Room ${selected?.unit_label || roomId}`);
      mutateRes();
      mutateMatrix();
    } catch {
      toast.error("Check-out failed. Please try again.");
    } finally {
      setApplyingAction(null);
    }
  }

  function handleWalkIn() {
    setShowWalkInModal(true);
  }

  async function handleUpdateRoomStatus(roomId: string, newStatus: string) {
    setApplyingAction(roomId);
    try {
      const res = await fetch("/api/dashboard/front-desk/room-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_id: roomId, status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update status");
      }
      toast.success(`Room status marked as ${newStatus.toUpperCase()}`);
      mutateMatrix();
    } catch (err: any) {
      toast.error(err.message || "Could not update room status");
    } finally {
      setApplyingAction(null);
    }
  }

  const occupiedCount = rooms.filter((r: any) => {
    if (r.unit_type === 'apartment' && !r.parent_unit_id) return computeFlatStatus(r) === 'occupied';
    return r.status === "occupied";
  }).length;
  const vacantCount = rooms.filter((r: any) => {
    if (r.unit_type === 'apartment' && !r.parent_unit_id) return computeFlatStatus(r) === 'vacant';
    return r.status === "vacant";
  }).length;
  const dirtyCount = rooms.filter((r: any) => {
    if (r.unit_type === 'apartment' && !r.parent_unit_id) { const s = computeFlatStatus(r); return s === 'dirty' || s === 'cleaning'; }
    return r.status === "dirty" || r.status === "cleaning";
  }).length;
  const maintCount = rooms.filter((r: any) => {
    if (r.unit_type === 'apartment' && !r.parent_unit_id) return computeFlatStatus(r) === 'maintenance';
    return r.status === "maintenance";
  }).length;

  const isLoadingDisplay = loadingMatrix && !matrixRooms;

  if (isLoadingDisplay) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--color-text-muted)] text-sm font-medium">Loading Front Desk Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>Front Desk Command Center</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{currentProperty?.name || (activeJourney === "apartments" ? "Viswa Service Apartments" : "Oceanview Hotel")} · {new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          {loadingRes && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "var(--color-light)", color: "var(--color-text-muted)" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={handleWalkIn}>
            <UserPlus className="w-3.5 h-3.5" /> Walk-in Booking
          </Button>
        </div>
      </div>

      {resError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(var(--color-danger-rgb),0.08)", color: "var(--color-danger)", border: "1px solid rgba(var(--color-danger-rgb),0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Could not load live data. Displaying mock data.
          <button onClick={() => mutateRes()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={BedDouble} label="Occupied Rooms" value={occupiedCount} accent="var(--color-info)" bg="var(--color-info-soft)" />
        <StatTile icon={DoorOpen} label="Vacant Rooms" value={vacantCount} accent="var(--color-success)" bg="var(--color-success-soft)" />
        <StatTile icon={RefreshCw} label="Dirty / Cleaning" value={dirtyCount} accent="var(--color-warning)" bg="var(--color-warning-soft)" />
        <StatTile icon={Settings} label="Maintenance" value={maintCount} accent="var(--color-danger)" bg="var(--color-danger-soft)" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 flex flex-col">
          <CardHeader title="Room Matrix" subtitle={`${buildingRooms.length} rooms in building`} action={
            <div className="flex flex-wrap items-center gap-2">
              {distinctBuildings.length > 1 && (
                <div className="flex gap-1 border-r pr-2" style={{ borderColor: "var(--color-border)" }}>
                  {distinctBuildings.map((b) => (
                    <button key={b} onClick={() => { setSelectedBuilding(b); setSelectedRoom(null); }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                      style={{ background: activeBuilding === b ? "var(--color-primary)" : "var(--color-light)", color: activeBuilding === b ? "var(--color-white)" : "var(--color-navy)" }}
                    >Tower {b}</button>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                {(distinctFloors.length > 0 ? distinctFloors : [1, 2, 3]).map((f) => (
                  <button key={f} onClick={() => { setFloor(f); setSelectedRoom(null); }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                    style={{ background: activeFloor === f ? "var(--color-navy)" : "var(--color-light)", color: activeFloor === f ? "var(--color-white)" : "var(--color-text-muted)" }}
                  >Floor {f}</button>
                ))}
              </div>
            </div>
          } />
          
          <div className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-muted)" }}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider mr-1.5 flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                Status Filter:
              </span>
              {[
                { id: "all", label: `All (${statusCounts.all})`, bg: statusFilter === "all" ? "var(--color-navy)" : "var(--color-light)", color: statusFilter === "all" ? "var(--color-white)" : "var(--color-text)", border: statusFilter === "all" ? "var(--color-navy)" : "var(--color-border)" },
                { id: "vacant", label: `Available (${statusCounts.vacant})`, bg: statusFilter === "vacant" ? "var(--color-success)" : "var(--color-success-soft)", color: statusFilter === "vacant" ? "var(--color-white)" : "var(--color-success-dark)", border: "var(--color-success)" },
                { id: "occupied", label: `Occupied (${statusCounts.occupied})`, bg: statusFilter === "occupied" ? "var(--color-info)" : "var(--color-info-soft)", color: statusFilter === "occupied" ? "var(--color-white)" : "var(--color-info-dark)", border: "var(--color-info)" },
                { id: "dirty", label: `Dirty/Cleaning (${statusCounts.dirty})`, bg: statusFilter === "dirty" ? "var(--color-warning)" : "var(--color-warning-soft)", color: statusFilter === "dirty" ? "var(--color-white)" : "var(--color-warning-dark)", border: "var(--color-warning)" },
                { id: "maintenance", label: `Maint. (${statusCounts.maintenance})`, bg: statusFilter === "maintenance" ? "var(--color-danger)" : "var(--color-danger-soft)", color: statusFilter === "maintenance" ? "var(--color-white)" : "var(--color-danger-dark)", border: "var(--color-danger)" },
              ].map((f) => (
                <button key={f.id} onClick={() => { setStatusFilter(f.id); setSelectedRoom(null); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                  style={{ background: f.bg, color: f.color, border: `1px solid ${f.border}` }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-4 flex-1">
            {loadingRes
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRoomCard key={i} />)
              : filtered.map((room: any) => {
                  const isParent = room.unit_type === 'apartment' && !room.parent_unit_id;
                  const flatStatus = isParent ? computeFlatStatus(room) : null;
                  const s = ROOM_STATUS_STYLES[flatStatus || room.status] || ROOM_STATUS_STYLES.vacant;
                  const isSelected = selectedRoom === room.id;
                  const childCount = room.child_count || (room.children?.length || 0);
                  const isAc = room.attributes?.ac;

                  if (isParent) {
                    return (
                      <button key={room.id} onClick={() => setSelectedRoom(isSelected ? null : room.id)}
                        className="rounded-xl p-3.5 text-left transition-all border-2 flex flex-col justify-between h-full shadow-2xs relative overflow-hidden group hover:shadow-md"
                        style={{
                          background: s.bg,
                          borderColor: isSelected ? "var(--color-navy)" : s.border,
                          boxShadow: isSelected ? "0 0 0 3px rgba(var(--color-navy-rgb),0.25)" : "none"
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: s.text }} />
                              <span className="font-extrabold text-base tracking-tight truncate" style={{ color: s.text }}>{room.unit_label}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0" style={{ background: "rgba(var(--color-primary-dark-rgb),0.18)", color: "var(--color-success-dark)" }}>
                                {room.layout_type || 'Apartment'}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs flex-shrink-0" style={{ background: s.pillBg, color: s.pillText }}>
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                              {s.label}
                            </span>
                          </div>
                          <div className="text-xs font-semibold mb-3 truncate" style={{ color: "var(--color-text)" }}>
                            {childCount} room{childCount !== 1 ? 's' : ''} · {room.occupied_children || 0} occupied
                          </div>
                        </div>
                        <div className="pt-2.5 border-t flex items-center justify-between mt-auto" style={{ borderColor: "var(--color-border)" }}>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>Total / Night</span>
                            <span className="text-xs font-bold" style={{ color: s.text }}>₹{room.base_rate}</span>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-1 rounded-md" style={{ background: s.pillBg, color: s.pillText, border: `1px solid ${s.border}` }}>
                            {room.occupied_children || 0}/{childCount} Occupied
                          </span>
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button key={room.id} onClick={() => setSelectedRoom(isSelected ? null : room.id)}
                      className="rounded-xl p-3.5 text-left transition-all border-2 flex flex-col justify-between h-full shadow-2xs relative overflow-hidden group hover:shadow-md"
                      style={{ 
                        background: s.bg, 
                        borderColor: isSelected ? "var(--color-navy)" : s.border,
                        boxShadow: isSelected ? "0 0 0 3px rgba(var(--color-navy-rgb),0.25)" : "none"
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-extrabold text-base tracking-tight truncate" style={{ color: s.text }}>{room.unit_label}</span>
                            {isAc !== undefined && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0" style={{ background: isAc ? "rgba(var(--color-success-rgb),0.18)" : "rgba(var(--color-text-muted-rgb),0.15)", color: isAc ? "var(--color-success-dark)" : "var(--color-text)" }}>
                                {isAc ? "AC" : "Non-AC"}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs flex-shrink-0" style={{ background: s.pillBg, color: s.pillText }}>
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                            {s.label}
                          </span>
                        </div>
                        <div className="text-xs font-semibold mb-3 truncate" style={{ color: "var(--color-text)" }}>{room.layout_type || room.unit_type}</div>
                      </div>
                      <div className="pt-2.5 border-t flex items-center justify-between mt-auto" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>Nightly Rate</span>
                          <span className="text-xs font-bold" style={{ color: s.text }}>₹{room.base_rate}</span>
                        </div>
                        {room.guest_name ? (
                          <div className="text-right min-w-0 max-w-[110px]">
                            <div className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>Occupant</div>
                            <div className="text-xs font-bold truncate" style={{ color: s.text }}>{room.guest_name}</div>
                          </div>
                        ) : room.status === "vacant" ? (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-md transition-all" style={{ background: "var(--color-success-soft)", color: "var(--color-success-dark)", border: "1px solid var(--color-success)" }}>
                            + Book
                          </span>
                        ) : room.status === "dirty" || room.status === "cleaning" ? (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-md" style={{ background: "var(--color-warning-soft)", color: "var(--color-warning-dark)", border: "1px solid var(--color-warning)" }}>
                            Dirty
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
          </div>
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 text-xs" style={{ background: "var(--color-surface-muted)", borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            {Object.entries(ROOM_STATUS_STYLES).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 font-semibold" style={{ color: v.text }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.dot }} /> {v.label}
              </span>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col overflow-hidden" style={{ maxHeight: "min(50vh, 560px)" }}>
          {selected ? (
            <div className="flex flex-col flex-1 min-h-0">
              <CardHeader title={`Room ${selected.unit_label}`} subtitle={selected.building_name ? `${selected.building_name} · Floor ${selected.floor_number}` : `Floor ${selected.floor_number}`} />
              <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0">
                <div className="flex items-center justify-between">
                  <Badge variant={selected.vip ? "amber" : "gray"}>
                    {(ROOM_STATUS_STYLES[isParentSelected ? computeFlatStatus(selected) : selected.status] || ROOM_STATUS_STYLES.vacant).label}
                  </Badge>
                  <span className="font-bold text-sm" style={{ color: "var(--color-navy)" }}>₹{selected.base_rate}/night{isParentSelected ? " total" : ""}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="teal">{selected.layout_type || selected.unit_type}</Badge>
                  {selected.attributes?.ac !== undefined && (
                    <Badge variant={selected.attributes.ac ? "teal" : "gray"}>
                      {selected.attributes.ac ? "❄️ AC Room" : "💨 Non-AC Room"}
                    </Badge>
                  )}
                  {selected.attributes?.bed_type && (
                    <Badge variant="gray">🛏️ {selected.attributes.bed_type} Bed</Badge>
                  )}
                </div>
                {selected.vip && (
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--color-warning)" }}>
                    <Star className="w-3 h-3 fill-current" /> VIP Guest
                  </div>
                )}
                {selected.guest_name && (
                  <div className="p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                    <div className="font-medium text-sm" style={{ color: "var(--color-text)" }}>{selected.guest_name}</div>
                    <div className="flex items-center gap-2 text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                      <Calendar className="w-3 h-3" />
                      <span>{selected.check_in || "—"} → {selected.check_out || "—"}</span>
                    </div>
                  </div>
                )}
                {selected.status === "occupied" && selected.booking_id && (
                  <div className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ background: "rgba(var(--color-primary-dark-rgb),0.08)", color: "var(--color-primary)" }}>
                    <DoorOpen className="w-3 h-3" /> Currently checked in
                  </div>
                )}
                {isParentSelected && (selected.children?.length > 0) && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Rooms in this apartment</div>
                    <div className="grid grid-cols-2 gap-2">
                      {selected.children.map((child: any) => {
                        const cs = ROOM_STATUS_STYLES[child.status] || ROOM_STATUS_STYLES.vacant;
                        return (
                          <button key={child.id} onClick={() => setSelectedRoom(child.id)}
                            className="px-2.5 py-2 rounded-lg text-left border transition-all hover:shadow-md flex flex-col gap-1"
                            style={{ background: cs.bg, borderColor: cs.border }}
                          >
                            <span className="text-xs font-bold truncate" style={{ color: cs.text }}>{child.unit_label}</span>
                            <span className="text-[10px] font-semibold flex items-center gap-1" style={{ color: cs.text }}>
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cs.dot }} /> {cs.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {!isParentSelected && (
                <div className="space-y-2">
                  <Button
                    variant="primary" size="sm" className="w-full"
                    disabled={applyingAction === selected.id || selected.status === "occupied"}
                    onClick={() => handleCheckIn(selected.id, selected.booking_id)}
                  >
                    {applyingAction === selected.id ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing</>
                    ) : (
                      <><LogIn className="w-3.5 h-3.5" /> Check In</>
                    )}
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
                    <BedDouble className="w-3.5 h-3.5" /> Assign Room
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      if (!selected.booking_id) {
                        toast.error("No active booking for this room to view folio.");
                        return;
                      }
                      setFolioModalData({ isOpen: true, roomId: selected.id, bookingId: selected.booking_id, guestName: selected.guest_name || "Guest" });
                    }}
                  >
                    <Search className="w-3.5 h-3.5" /> View Folio
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setLogRequestModalData({ isOpen: true, roomId: selected.id, unitLabel: selected.unit_label })}>
                    <AlertCircle className="w-3.5 h-3.5" /> Log Request
                  </Button>
                  {(selected.status === "occupied") && (
                    <Button
                      variant="outline" size="sm" className="w-full"
                      style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                      disabled={applyingAction === selected.id}
                      onClick={() => handleCheckOut(selected.id, selected.booking_id)}
                    >
                      {applyingAction === selected.id ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing</>
                      ) : (
                        <><LogOut className="w-3.5 h-3.5" /> Check Out</>
                      )}
                    </Button>
                  )}
                  {selected.status !== "vacant" && selected.status !== "occupied" && (
                    <Button
                      variant="outline" size="sm" className="w-full font-bold"
                      style={{ background: "var(--color-success-soft)", color: "var(--color-success-dark)", borderColor: "var(--color-success)" }}
                      disabled={applyingAction === selected.id}
                      onClick={() => handleUpdateRoomStatus(selected.id, "vacant")}
                    >
                      {applyingAction === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>✨ Mark Available (Cleaned)</>}
                    </Button>
                  )}
                  {selected.status === "vacant" && (
                    <Button
                      variant="outline" size="sm" className="w-full font-bold"
                      style={{ background: "var(--color-warning-soft)", color: "var(--color-warning-dark)", borderColor: "var(--color-warning)" }}
                      disabled={applyingAction === selected.id}
                      onClick={() => handleUpdateRoomStatus(selected.id, "dirty")}
                    >
                      {applyingAction === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>🧹 Mark Dirty (Needs Clean)</>}
                    </Button>
                  )}
                </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Search className="w-5 h-5 mb-3" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Select a Room</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Click on any room card to view details</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AiRevenueManagerCard propertyId={selectedPropertyId} />
        <ChannelPartnersCard propertyId={selectedPropertyId} />
        <OffersCard propertyId={selectedPropertyId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Arrivals Today" subtitle={loadingRes ? "Loading..." : `${arrivalsData.length} expected`} />
          {loadingRes ? (
            <SkeletonPanel />
          ) : arrivalsData.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No arrivals expected today</p>
            </div>
          ) : (
            arrivalsData.slice(0, 6).map((b: any, i: number) => (
              <div key={`arrival-${b.id || i}`} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < Math.min(arrivalsData.length, 6) - 1 ? "1px solid var(--color-border)" : "none" }}>
                <span style={{ color: "var(--color-text)" }}>
                  {b.guest_name || "Unknown"} ({b.unit_label || "—"})
                </span>
                <Badge variant="amber">Arriving</Badge>
              </div>
            ))
          )}
        </Card>
        <Card>
          <CardHeader title="In-House" subtitle={loadingRes ? "Loading..." : `${inHouseData.length} guests`} />
          {loadingRes ? (
            <SkeletonPanel />
          ) : inHouseData.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No guests in-house</p>
            </div>
          ) : (
            inHouseData.slice(0, 6).map((b: any, i: number) => (
              <div key={`inhouse-${b.id || i}`} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < Math.min(inHouseData.length, 6) - 1 ? "1px solid var(--color-border)" : "none" }}>
                <span style={{ color: "var(--color-text)" }}>
                  {b.guest_name || "Unknown"} ({b.unit_label || "—"})
                </span>
                <Badge variant="teal">In House</Badge>
              </div>
            ))
          )}
        </Card>
        <Card>
          <CardHeader title="Departures Today" subtitle={loadingRes ? "Loading..." : `${departuresData.length} due`} />
          {loadingRes ? (
            <SkeletonPanel />
          ) : departuresData.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No departures today</p>
            </div>
          ) : (
            departuresData.slice(0, 4).map((b: any, i: number) => (
              <div key={`departure-${b.id || i}`} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < Math.min(departuresData.length, 4) - 1 ? "1px solid var(--color-border)" : "none" }}>
                <span style={{ color: "var(--color-text)" }}>
                  {b.guest_name || "Unknown"} ({b.unit_label || "—"})
                </span>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => handleCheckOut(b.id, b.booking_id)}
                  disabled={applyingAction === b.id}
                >
                  {applyingAction === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Check Out"}
                </Button>
              </div>
            ))
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Quick Actions" subtitle="Common front desk tasks" />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleWalkIn} className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(var(--color-primary-dark-rgb),0.1)", color: "var(--color-navy)", border: "1px solid rgba(var(--color-primary-dark-rgb),0.2)" }}>
              <UserPlus className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
              New Guest
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(var(--color-navy-rgb),0.08)", color: "var(--color-navy)", border: "1px solid rgba(var(--color-navy-rgb),0.15)" }}>
              <Phone className="w-5 h-5" style={{ color: "var(--color-navy)" }} />
              Call Guest
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(var(--color-warning-rgb),0.1)", color: "var(--color-navy)", border: "1px solid rgba(var(--color-warning-rgb),0.2)" }}>
              <Bell className="w-5 h-5" style={{ color: "var(--color-warning)" }} />
              Wake-up Call
            </button>
            <button onClick={() => router.push("/dashboard/housekeeping")} className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(var(--color-primary-rgb),0.08)", color: "var(--color-navy)", border: "1px solid rgba(var(--color-primary-rgb),0.15)" }}>
              <ClipboardList className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
              Housekeeping
            </button>
            <button onClick={() => setLogRequestModalData({ isOpen: true })} className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(var(--color-danger-rgb),0.08)", color: "var(--color-navy)", border: "1px solid rgba(var(--color-danger-rgb),0.15)" }}>
              <Trash2 className="w-5 h-5" style={{ color: "var(--color-danger)" }} />
              Report Issue
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(var(--color-text-muted-rgb),0.1)", color: "var(--color-navy)", border: "1px solid rgba(var(--color-text-muted-rgb),0.15)" }}>
              <Download className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
              Export Report
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Guest Messaging" subtitle={`${dashboardData?.recentRequests?.filter((r: any) => r.status !== 'resolved').length || 0} open requests`} action={<button onClick={() => router.push("/dashboard/front-desk")} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--color-light)", color: "var(--color-navy)" }}><Settings className="w-3 h-3" /></button>} />
          <div className="space-y-3">
            {loadingDashboard ? (
              <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" /></div>
            ) : dashboardData?.recentRequests?.filter((r: any) => r.status !== 'resolved').length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className="w-5 h-5 mx-auto mb-2 text-[var(--color-text-muted)]" />
                <p className="text-sm text-[var(--color-text-muted)]">No open requests</p>
              </div>
            ) : (
              dashboardData?.recentRequests?.filter((r: any) => r.status !== 'resolved').slice(0, 3).map((req: any) => {
                const initials = req.unit_label ? req.unit_label.slice(0, 2) : "GD";
                const typeColors: Record<string, { bg: string; color: string }> = {
                  room_service: { bg: "rgba(var(--color-primary-dark-rgb),0.15)", color: "var(--color-primary)" },
                  housekeeping: { bg: "rgba(var(--color-warning-rgb),0.15)", color: "var(--color-warning)" },
                  maintenance: { bg: "rgba(var(--color-danger-rgb),0.1)", color: "var(--color-danger)" },
                  complaint: { bg: "rgba(var(--color-navy-rgb),0.1)", color: "var(--color-navy)" },
                };
                const tc = typeColors[req.request_type] || { bg: "rgba(var(--color-text-muted-rgb),0.1)", color: "var(--color-text-muted)" };
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(req.created_at).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 60) return `${mins} min ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return `${Math.floor(hrs / 24)}d ago`;
                })();
                return (
                  <div key={req.id} className="p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: tc.bg, color: tc.color }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>Room {req.unit_label || "?"} · {req.request_type.replace("_", " ")}</div>
                        <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{req.description}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={req.status === 'pending' ? { background: "var(--color-warning-soft)", color: "var(--color-warning-dark)" } : { background: "var(--color-info-soft)", color: "var(--color-info-dark)" }}>
                          {req.status}
                        </span>
                        <span className="text-[10px] block mt-0.5" style={{ color: "var(--color-text-muted)" }}>{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type a quick message..."
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--color-light)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                  readOnly
                />
              </div>
              <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--color-navy)", color: "var(--color-on-dark)" }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Today's Activity Feed" subtitle="Real-time front desk log" action={
          <button onClick={() => {
            setLoadingDashboard(true);
            if (selectedPropertyId) {
              fetch(`/api/dashboard/front-desk/dashboard?property_id=${selectedPropertyId}`)
                .then(res => res.json())
                .then(data => setDashboardData(data))
                .finally(() => setLoadingDashboard(false));
            }
          }} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--color-light)", color: "var(--color-text-muted)" }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        } />
        <div className="space-y-0">
          {loadingDashboard ? (
            <SkeletonPanel />
          ) : (() => {
            const activities: Array<{ icon: any; iconBg: string; iconColor: string; title: string; desc: string; time: string }> = [];
            
            // Recent check-ins
            dashboardData?.recentBookings?.filter((b: any) => b.status === 'checked_in' && b.checked_in_at?.startsWith(new Date().toISOString().split('T')[0])).forEach((b: any) => {
              activities.push({ icon: LogIn, iconBg: "rgba(var(--color-primary-dark-rgb),0.12)", iconColor: "var(--color-primary)", title: "Check-In Completed", desc: `${b.guest_name || 'Guest'} checked into Room ${b.unit_label || '?'}`, time: new Date(b.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
            });
            
            // Recent check-outs
            dashboardData?.recentBookings?.filter((b: any) => b.status === 'checked_out' && b.checked_out_at?.startsWith(new Date().toISOString().split('T')[0])).forEach((b: any) => {
              activities.push({ icon: LogOut, iconBg: "rgba(var(--color-danger-rgb),0.1)", iconColor: "var(--color-danger)", title: "Check-Out Processed", desc: `${b.guest_name || 'Guest'} checked out of Room ${b.unit_label || '?'}`, time: new Date(b.checked_out_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
            });
            
            // Guest requests
            dashboardData?.recentRequests?.slice(0, 3).forEach((r: any) => {
              const icon = r.request_type === 'complaint' ? AlertCircle : Bell;
              activities.push({ icon, iconBg: "rgba(var(--color-warning-rgb),0.12)", iconColor: "var(--color-warning)", title: "Guest Request Logged", desc: `Room ${r.unit_label || '?'}: ${r.description}`, time: new Date(r.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
            });
            
            // Housekeeping
            dashboardData?.recentHK?.slice(0, 2).forEach((h: any) => {
              activities.push({ icon: RotateCcw, iconBg: "rgba(var(--color-primary-rgb),0.1)", iconColor: "var(--color-primary)", title: "Housekeeping Update", desc: `Room ${h.unit_label || '?'}: ${h.task_type} — ${h.status}`, time: new Date(h.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
            });
            
            // Maintenance
            dashboardData?.recentMaint?.slice(0, 2).forEach((m: any) => {
              activities.push({ icon: Settings, iconBg: "rgba(var(--color-text-muted-rgb),0.1)", iconColor: "var(--color-text-muted)", title: "Maintenance Ticket", desc: `${m.title} (Room ${m.unit_label || '?'})`, time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
            });
            
            activities.sort((a, b) => b.time.localeCompare(a.time));
            const displayed = activities.slice(0, 6);
            
            if (displayed.length === 0) {
              return (
                <div className="text-center py-6">
                  <Clock className="w-5 h-5 mx-auto mb-2 text-[var(--color-text-muted)]" />
                  <p className="text-sm text-[var(--color-text-muted)]">No activity today</p>
                </div>
              );
            }
            
            return displayed.map((act, i) => {
              const IconComp = act.icon;
              return (
                <div key={i} className="flex items-start gap-3 py-3" style={{ borderBottom: i < displayed.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: act.iconBg }}>
                    <IconComp className="w-3.5 h-3.5" style={{ color: act.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{act.title}</span>
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{act.time}</span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>{act.desc}</p>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </Card>

      <Card>
        <CardHeader title="Detailed Room Metrics" subtitle="Occupancy and revenue breakdown" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(var(--color-primary-dark-rgb),0.08)" }}>
              <div className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>
                {dashboardData?.occupancy?.total_rooms ? Math.round((dashboardData.occupancy.occupied / dashboardData.occupancy.total_rooms) * 100) : 0}%
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Occupancy Rate</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(var(--color-navy-rgb),0.06)" }}>
              <div className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>₹{((dashboardData?.revenue?.revenue || 0) / 1000).toFixed(0)}K</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Today's Revenue</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(var(--color-warning-rgb),0.08)" }}>
              <div className="text-lg font-bold" style={{ color: "var(--color-warning)" }}>
                ₹{dashboardData?.revenue?.bookings_today ? ((dashboardData.revenue.revenue / dashboardData.revenue.bookings_today) / 1000).toFixed(1) + 'K' : '0'}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Avg. Daily Rate</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(var(--color-text-muted-rgb),0.08)" }}>
              <div className="text-lg font-bold" style={{ color: "var(--color-text-muted)" }}>{dashboardData?.revenue?.bookings_today || 0}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Bookings Today</div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: "var(--color-navy)" }}>Room Status Breakdown</span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{dashboardData?.occupancy?.total_rooms || 0} total rooms</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Occupied', count: dashboardData?.occupancy?.occupied || 0, total: dashboardData?.occupancy?.total_rooms || 1, color: 'var(--color-info)' },
                { label: 'Vacant (Available)', count: dashboardData?.occupancy?.vacant || 0, total: dashboardData?.occupancy?.total_rooms || 1, color: 'var(--color-success)' },
                { label: 'Dirty / Cleaning', count: dashboardData?.occupancy?.dirty || 0, total: dashboardData?.occupancy?.total_rooms || 1, color: 'var(--color-warning)' },
                { label: 'Maintenance', count: dashboardData?.occupancy?.maint || 0, total: dashboardData?.occupancy?.total_rooms || 1, color: 'var(--color-danger)' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: "var(--color-text)" }}>{s.label}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>{s.count}/{s.total} rooms</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: "var(--color-light)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${(s.count / s.total) * 100}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--color-text)" }}>Guest Requests Today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>{dashboardData?.amenityRequests?.total || 0}</span>
                <span className="text-xs" style={{ color: "var(--color-warning)" }}>{dashboardData?.amenityRequests?.pending || 0} pending</span>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--color-text)" }}>F&B Orders Today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>{dashboardData?.fbOrders?.total || 0}</span>
                <span className="text-xs" style={{ color: "var(--color-primary)" }}>{dashboardData?.fbOrders?.in_progress || 0} in progress</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {checkInModalData && (
        <CheckInModal
          isOpen={true}
          onClose={() => setCheckInModalData(null)}
          bookingId={checkInModalData.bookingId}
          roomId={checkInModalData.roomId}
          guestName={checkInModalData.guestName}
          unitLabel={checkInModalData.unitLabel}
          onConfirm={processCheckIn}
        />
      )}

      {showWalkInModal && (
        <WalkInModal
          isOpen={showWalkInModal}
          onClose={() => setShowWalkInModal(false)}
          propertyId={selectedPropertyId}
          onSuccess={() => {
            toast.success("Walk-In created and checked in successfully!");
            mutateMatrix();
            mutateRes();
          }}
        />
      )}
      
      <FolioModal
        isOpen={folioModalData?.isOpen || false}
        onClose={() => setFolioModalData(null)}
        bookingId={folioModalData?.bookingId || null}
        guestName={folioModalData?.guestName || ""}
        onCheckout={(bId) => handleCheckOut(folioModalData?.roomId || "", bId)}
      />

      <LogRequestModal
        isOpen={logRequestModalData?.isOpen || false}
        onClose={() => setLogRequestModalData(null)}
        roomId={logRequestModalData?.roomId}
        unitLabel={logRequestModalData?.unitLabel}
      />
    </div>
  );
}
