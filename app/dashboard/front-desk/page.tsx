"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus, LogIn, LogOut, RefreshCw, AlertCircle, Loader2, Users, Calendar, DoorOpen, BedDouble, Phone, Mail, MapPin, Clock, Star, MessageSquare, Bell, Settings, ClipboardList, ArrowRight, MoreHorizontal, Home, Wifi, Coffee, ChevronRight, BarChart3, Download, Utensils, Trash2, RotateCcw, Send } from "lucide-react";
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
import WalkInModal from "./components/WalkInModal";
import LogRequestModal from "./components/LogRequestModal";
import { useRouter } from "next/navigation";

const ROOM_STATUS_STYLES: Record<string, { bg: string; border: string; dot: string; label: string; text: string; pillBg: string; pillText: string }> = {
  vacant: { bg: "#ECFDF5", border: "#10B981", dot: "#10B981", label: "Available", text: "#065F46", pillBg: "#D1FAE5", pillText: "#047857" },
  occupied: { bg: "#EFF6FF", border: "#3B82F6", dot: "#3B82F6", label: "Occupied", text: "#1E40AF", pillBg: "#DBEAFE", pillText: "#1D4ED8" },
  dirty: { bg: "#FFFBEB", border: "#F59E0B", dot: "#F59E0B", label: "Dirty", text: "#92400E", pillBg: "#FEF3C7", pillText: "#B45309" },
  cleaning: { bg: "#F5F3FF", border: "#8B5CF6", dot: "#8B5CF6", label: "Cleaning", text: "#5B21B6", pillBg: "#EDE9FE", pillText: "#6D28D9" },
  maintenance: { bg: "#FEF2F2", border: "#EF4444", dot: "#EF4444", label: "Maintenance", text: "#991B1B", pillBg: "#FEE2E2", pillText: "#B91C1C" },
  reserved: { bg: "#F8FAFC", border: "#64748B", dot: "#64748B", label: "Reserved", text: "#334155", pillBg: "#E2E8F0", pillText: "#475569" },
  inspection: { bg: "#F0FDF4", border: "#22C55E", dot: "#22C55E", label: "Inspection", text: "#15803D", pillBg: "#DCFCE7", pillText: "#166534" },
};

function SkeletonRoomCard() {
  return (
    <div className="rounded-xl p-3 animate-pulse" style={{ background: "#F5F7FA" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-4 rounded" style={{ background: "#E2E8F0" }} />
        <div className="w-8 h-4 rounded" style={{ background: "#E2E8F0" }} />
      </div>
      <div className="w-16 h-3 rounded mb-2" style={{ background: "#E2E8F0" }} />
      <div className="w-12 h-3 rounded" style={{ background: "#E2E8F0" }} />
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="w-24 h-4 rounded" style={{ background: "#E2E8F0" }} />
      <div className="w-full h-8 rounded" style={{ background: "#E2E8F0" }} />
      <div className="w-full h-8 rounded" style={{ background: "#E2E8F0" }} />
      <div className="w-3/4 h-8 rounded" style={{ background: "#E2E8F0" }} />
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

  useEffect(() => {
    if (!selectedPropertyId) return;
    setLoadingDashboard(true);
    fetch(`/api/dashboard/front-desk/dashboard?property_id=${selectedPropertyId}`)
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(() => setDashboardData(null))
      .finally(() => setLoadingDashboard(false));
  }, [selectedPropertyId]);

  const [checkInModalData, setCheckInModalData] = useState<{ isOpen: boolean, roomId: string, bookingId: string, guestName: string, unitLabel: string } | null>(null);
  const [folioModalData, setFolioModalData] = useState<{ isOpen: boolean, roomId: string, bookingId: string, guestName: string } | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const rooms = matrixRooms || [];
  const distinctBuildings = Array.from(new Set(rooms.map((r: any) => r.building_code || "A"))).sort() as string[];
  const activeBuilding = selectedBuilding || distinctBuildings[0] || "A";
  const buildingRooms = rooms.filter((r: any) => (r.building_code || "A") === activeBuilding);
  const distinctFloors = Array.from(new Set(buildingRooms.map((r: any) => r.floor_number))).sort((a: any, b: any) => a - b) as number[];
  const activeFloor = distinctFloors.includes(floor) ? floor : (distinctFloors[0] || 1);
  const filtered = buildingRooms.filter((r: any) => {
    if (r.floor_number !== activeFloor) return false;
    if (statusFilter === "all") return true;
    if (statusFilter === "vacant") return r.status === "vacant";
    if (statusFilter === "occupied") return r.status === "occupied";
    if (statusFilter === "dirty") return r.status === "dirty" || r.status === "cleaning";
    if (statusFilter === "maintenance") return r.status === "maintenance";
    return true;
  });
  const selected = rooms.find((r: any) => r.id === selectedRoom);

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

  const isLoadingDisplay = loadingMatrix && !matrixRooms;

  if (isLoadingDisplay) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2BAE8E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#64748B] text-sm font-medium">Loading Front Desk Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Front Desk Command Center</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>{currentProperty?.name || (activeJourney === "apartments" ? "Viswa Service Apartments" : "Oceanview Hotel")} · {new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          {loadingRes && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={handleWalkIn}>
            <UserPlus className="w-3.5 h-3.5" /> Walk-in Booking
          </Button>
        </div>
      </div>

      {resError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Could not load live data. Displaying mock data.
          <button onClick={() => mutateRes()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader title="Room Matrix" subtitle={`${buildingRooms.length} rooms in building`} action={
            <div className="flex flex-wrap items-center gap-2">
              {distinctBuildings.length > 1 && (
                <div className="flex gap-1 border-r pr-2" style={{ borderColor: "#E2E8F0" }}>
                  {distinctBuildings.map((b) => (
                    <button key={b} onClick={() => { setSelectedBuilding(b); setSelectedRoom(null); }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all"
                      style={{ background: activeBuilding === b ? "#2BAE8E" : "#F5F7FA", color: activeBuilding === b ? "#FFFFFF" : "#1A3C5E" }}
                    >Tower {b}</button>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                {(distinctFloors.length > 0 ? distinctFloors : [1, 2, 3]).map((f) => (
                  <button key={f} onClick={() => { setFloor(f); setSelectedRoom(null); }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                    style={{ background: activeFloor === f ? "#1A3C5E" : "#F5F7FA", color: activeFloor === f ? "#FFFFFF" : "#64748B" }}
                  >Floor {f}</button>
                ))}
              </div>
            </div>
          } />
          
          <div className="px-4 py-2.5 bg-slate-50 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider mr-1.5 flex items-center gap-1" style={{ color: "#64748B" }}>
                Status Filter:
              </span>
              {[
                { id: "all", label: `All (${buildingRooms.filter((r: any) => r.floor_number === activeFloor).length})`, bg: statusFilter === "all" ? "#1A3C5E" : "#FFFFFF", color: statusFilter === "all" ? "#FFFFFF" : "#475569", border: statusFilter === "all" ? "#1A3C5E" : "#CBD5E1" },
                { id: "vacant", label: `🟢 Available (${buildingRooms.filter((r: any) => r.floor_number === activeFloor && r.status === "vacant").length})`, bg: statusFilter === "vacant" ? "#10B981" : "#ECFDF5", color: statusFilter === "vacant" ? "#FFFFFF" : "#065F46", border: "#6EE7B7" },
                { id: "occupied", label: `🔵 Occupied (${buildingRooms.filter((r: any) => r.floor_number === activeFloor && r.status === "occupied").length})`, bg: statusFilter === "occupied" ? "#3B82F6" : "#EFF6FF", color: statusFilter === "occupied" ? "#FFFFFF" : "#1E40AF", border: "#93C5FD" },
                { id: "dirty", label: `🟡 Dirty/Cleaning (${buildingRooms.filter((r: any) => r.floor_number === activeFloor && (r.status === "dirty" || r.status === "cleaning")).length})`, bg: statusFilter === "dirty" ? "#F59E0B" : "#FFFBEB", color: statusFilter === "dirty" ? "#FFFFFF" : "#92400E", border: "#FCD34D" },
                { id: "maintenance", label: `🔴 Maint. (${buildingRooms.filter((r: any) => r.floor_number === activeFloor && r.status === "maintenance").length})`, bg: statusFilter === "maintenance" ? "#EF4444" : "#FEF2F2", color: statusFilter === "maintenance" ? "#FFFFFF" : "#991B1B", border: "#FCA5A5" },
              ].map((f) => (
                <button key={f.id} onClick={() => { setStatusFilter(f.id); setSelectedRoom(null); }}
                  className="px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 shadow-2xs hover:scale-[1.02]"
                  style={{ background: f.bg, color: f.color, border: `1.5px solid ${f.border}` }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
            {loadingRes
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRoomCard key={i} />)
              : filtered.map((room: any) => {
                  const s = ROOM_STATUS_STYLES[room.status] || ROOM_STATUS_STYLES.vacant;
                  const isSelected = selectedRoom === room.id;
                  const isAc = room.attributes?.ac;
                  return (
                    <button key={room.id} onClick={() => setSelectedRoom(isSelected ? null : room.id)}
                      className="rounded-xl p-3.5 text-left transition-all border-2 flex flex-col justify-between h-full shadow-2xs relative overflow-hidden group hover:shadow-md"
                      style={{ 
                        background: s.bg, 
                        borderColor: isSelected ? "#1A3C5E" : s.border,
                        boxShadow: isSelected ? "0 0 0 3px rgba(26,60,94,0.25)" : "none"
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-base tracking-tight" style={{ color: s.text }}>{room.unit_label}</span>
                            {isAc !== undefined && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: isAc ? "rgba(16,185,129,0.18)" : "rgba(100,116,139,0.15)", color: isAc ? "#047857" : "#475569" }}>
                                {isAc ? "AC" : "Non-AC"}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs" style={{ background: s.pillBg, color: s.pillText }}>
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                            {s.label}
                          </span>
                        </div>
                        <div className="text-xs font-semibold mb-3 truncate" style={{ color: "#334155" }}>{room.layout_type || room.unit_type}</div>
                      </div>
                      <div className="pt-2.5 border-t flex items-center justify-between mt-auto" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium" style={{ color: "#64748B" }}>Nightly Rate</span>
                          <span className="text-xs font-bold" style={{ color: s.text }}>₹{room.base_rate}</span>
                        </div>
                        {room.guest_name ? (
                          <div className="text-right min-w-0 max-w-[110px]">
                            <div className="text-[10px] font-medium" style={{ color: "#64748B" }}>Occupant</div>
                            <div className="text-xs font-bold truncate" style={{ color: s.text }}>{room.guest_name}</div>
                          </div>
                        ) : room.status === "vacant" ? (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-white/90 text-emerald-700 border border-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
                            + Book
                          </span>
                        ) : room.status === "dirty" || room.status === "cleaning" ? (
                          <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-white/90 text-amber-700 border border-amber-300 shadow-2xs">
                            🧹 Dirty
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
          </div>
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 text-xs bg-slate-50/60" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            {Object.entries(ROOM_STATUS_STYLES).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 font-semibold" style={{ color: v.text }}>
                <span className="w-2.5 h-2.5 rounded-full shadow-2xs" style={{ background: v.dot }} /> {v.label}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          {selected ? (
            <div>
              <CardHeader title={`Room ${selected.unit_label}`} subtitle={selected.building_name ? `${selected.building_name} · Floor ${selected.floor_number}` : `Floor ${selected.floor_number}`} />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={selected.vip ? "amber" : "gray"}>
                    {(ROOM_STATUS_STYLES[selected.status] || ROOM_STATUS_STYLES.vacant).label}
                  </Badge>
                  <span className="font-bold text-sm" style={{ color: "#1A3C5E" }}>₹{selected.base_rate}/night</span>
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
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "#F5A623" }}>
                    <Star className="w-3 h-3 fill-current" /> VIP Guest
                  </div>
                )}
                {selected.guest_name && (
                  <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <div className="font-medium text-sm" style={{ color: "#1A2E44" }}>{selected.guest_name}</div>
                    <div className="flex items-center gap-2 text-xs mt-1" style={{ color: "#64748B" }}>
                      <Calendar className="w-3 h-3" />
                      <span>{selected.check_in || "—"} → {selected.check_out || "—"}</span>
                    </div>
                  </div>
                )}
                {selected.status === "occupied" && selected.booking_id && (
                  <div className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ background: "rgba(42,157,143,0.08)", color: "#2BAE8E" }}>
                    <DoorOpen className="w-3 h-3" /> Currently checked in
                  </div>
                )}
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
                      style={{ color: "#E53E3E", borderColor: "#E53E3E" }}
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
                      style={{ background: "#ECFDF5", color: "#065F46", borderColor: "#10B981" }}
                      disabled={applyingAction === selected.id}
                      onClick={() => handleUpdateRoomStatus(selected.id, "vacant")}
                    >
                      {applyingAction === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>✨ Mark Available (Cleaned)</>}
                    </Button>
                  )}
                  {selected.status === "vacant" && (
                    <Button
                      variant="outline" size="sm" className="w-full font-bold"
                      style={{ background: "#FFFBEB", color: "#92400E", borderColor: "#F59E0B" }}
                      disabled={applyingAction === selected.id}
                      onClick={() => handleUpdateRoomStatus(selected.id, "dirty")}
                    >
                      {applyingAction === selected.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>🧹 Mark Dirty (Needs Clean)</>}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Search className="w-5 h-5 mb-3" style={{ color: "#64748B" }} />
              <p className="text-sm font-medium" style={{ color: "#1A2E44" }}>Select a Room</p>
              <p className="text-xs mt-1" style={{ color: "#64748B" }}>Click on any room card to view details</p>
            </div>
          )}
        </Card>
        
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
              <Calendar className="w-5 h-5 mx-auto mb-2" style={{ color: "#64748B" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No arrivals expected today</p>
            </div>
          ) : (
            arrivalsData.slice(0, 6).map((b: any, i: number) => (
              <div key={`arrival-${b.id || i}`} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < Math.min(arrivalsData.length, 6) - 1 ? "1px solid #E2E8F0" : "none" }}>
                <span style={{ color: "#1A2E44" }}>
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
              <Users className="w-5 h-5 mx-auto mb-2" style={{ color: "#64748B" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No guests in-house</p>
            </div>
          ) : (
            inHouseData.slice(0, 6).map((b: any, i: number) => (
              <div key={`inhouse-${b.id || i}`} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < Math.min(inHouseData.length, 6) - 1 ? "1px solid #E2E8F0" : "none" }}>
                <span style={{ color: "#1A2E44" }}>
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
              <Clock className="w-5 h-5 mx-auto mb-2" style={{ color: "#64748B" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No departures today</p>
            </div>
          ) : (
            departuresData.slice(0, 4).map((b: any, i: number) => (
              <div key={`departure-${b.id || i}`} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < Math.min(departuresData.length, 4) - 1 ? "1px solid #E2E8F0" : "none" }}>
                <span style={{ color: "#1A2E44" }}>
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

      <Card>
        <CardHeader title="Today's Overview" subtitle="Quick stats at a glance" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 rounded-lg text-center" style={{ background: "#F5F7FA" }}>
            <div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{rooms.filter(r => r.status === "occupied").length}</div>
            <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Occupied Rooms</div>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: "#F5F7FA" }}>
            <div className="text-lg font-bold" style={{ color: "#2BAE8E" }}>{rooms.filter(r => r.status === "vacant").length}</div>
            <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Vacant Rooms</div>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: "#F5F7FA" }}>
            <div className="text-lg font-bold" style={{ color: "#F5A623" }}>{rooms.filter(r => r.status === "dirty" || r.status === "cleaning").length}</div>
            <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Dirty / Cleaning</div>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: "#F5F7FA" }}>
            <div className="text-lg font-bold" style={{ color: "#E53E3E" }}>{rooms.filter(r => r.status === "maintenance").length}</div>
            <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Maintenance</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Quick Actions" subtitle="Common front desk tasks" />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleWalkIn} className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(42,157,143,0.1)", color: "#1A3C5E", border: "1px solid rgba(42,157,143,0.2)" }}>
              <UserPlus className="w-5 h-5" style={{ color: "#2BAE8E" }} />
              New Guest
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(26,60,94,0.08)", color: "#1A3C5E", border: "1px solid rgba(26,60,94,0.15)" }}>
              <Phone className="w-5 h-5" style={{ color: "#1A3C5E" }} />
              Call Guest
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(245,166,35,0.1)", color: "#1A3C5E", border: "1px solid rgba(245,166,35,0.2)" }}>
              <Bell className="w-5 h-5" style={{ color: "#F5A623" }} />
              Wake-up Call
            </button>
            <button onClick={() => router.push("/dashboard/housekeeping")} className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(43,174,142,0.08)", color: "#1A3C5E", border: "1px solid rgba(43,174,142,0.15)" }}>
              <ClipboardList className="w-5 h-5" style={{ color: "#2BAE8E" }} />
              Housekeeping
            </button>
            <button onClick={() => setLogRequestModalData({ isOpen: true })} className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(229,62,62,0.08)", color: "#1A3C5E", border: "1px solid rgba(229,62,62,0.15)" }}>
              <Trash2 className="w-5 h-5" style={{ color: "#E53E3E" }} />
              Report Issue
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(100,116,139,0.1)", color: "#1A3C5E", border: "1px solid rgba(100,116,139,0.15)" }}>
              <Download className="w-5 h-5" style={{ color: "#64748B" }} />
              Export Report
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Guest Messaging" subtitle={`${dashboardData?.recentRequests?.filter((r: any) => r.status !== 'resolved').length || 0} open requests`} action={<button onClick={() => router.push("/dashboard/front-desk")} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "#F5F7FA", color: "#1A3C5E" }}><Settings className="w-3 h-3" /></button>} />
          <div className="space-y-3">
            {loadingDashboard ? (
              <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
            ) : dashboardData?.recentRequests?.filter((r: any) => r.status !== 'resolved').length === 0 ? (
              <div className="text-center py-6">
                <MessageSquare className="w-5 h-5 mx-auto mb-2 text-[#64748B]" />
                <p className="text-sm text-[#64748B]">No open requests</p>
              </div>
            ) : (
              dashboardData?.recentRequests?.filter((r: any) => r.status !== 'resolved').slice(0, 3).map((req: any) => {
                const initials = req.unit_label ? req.unit_label.slice(0, 2) : "GD";
                const typeColors: Record<string, { bg: string; color: string }> = {
                  room_service: { bg: "rgba(42,157,143,0.15)", color: "#2BAE8E" },
                  housekeeping: { bg: "rgba(245,166,35,0.15)", color: "#D4850A" },
                  maintenance: { bg: "rgba(229,62,62,0.1)", color: "#E53E3E" },
                  complaint: { bg: "rgba(26,60,94,0.1)", color: "#1A3C5E" },
                };
                const tc = typeColors[req.request_type] || { bg: "rgba(100,116,139,0.1)", color: "#64748B" };
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(req.created_at).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 60) return `${mins} min ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return `${Math.floor(hrs / 24)}d ago`;
                })();
                return (
                  <div key={req.id} className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: tc.bg, color: tc.color }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "#1A2E44" }}>Room {req.unit_label || "?"} · {req.request_type.replace("_", " ")}</div>
                        <div className="text-xs truncate" style={{ color: "#64748B" }}>{req.description}</div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {req.status}
                        </span>
                        <span className="text-[10px] block mt-0.5" style={{ color: "#64748B" }}>{timeAgo}</span>
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
                  style={{ background: "#F5F7FA", color: "#1A2E44", border: "1px solid #E2E8F0" }}
                  readOnly
                />
              </div>
              <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#1A3C5E", color: "#FFFFFF" }}>
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
          }} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>
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
              activities.push({ icon: LogIn, iconBg: "rgba(42,157,143,0.12)", iconColor: "#2BAE8E", title: "Check-In Completed", desc: `${b.guest_name || 'Guest'} checked into Room ${b.unit_label || '?'}`, time: new Date(b.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
            });
            
            // Recent check-outs
            dashboardData?.recentBookings?.filter((b: any) => b.status === 'checked_out' && b.checked_out_at?.startsWith(new Date().toISOString().split('T')[0])).forEach((b: any) => {
              activities.push({ icon: LogOut, iconBg: "rgba(229,62,62,0.1)", iconColor: "#E53E3E", title: "Check-Out Processed", desc: `${b.guest_name || 'Guest'} checked out of Room ${b.unit_label || '?'}`, time: new Date(b.checked_out_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
            });
            
            // Guest requests
            dashboardData?.recentRequests?.slice(0, 3).forEach((r: any) => {
              const icon = r.request_type === 'complaint' ? AlertCircle : Bell;
              activities.push({ icon, iconBg: "rgba(245,166,35,0.12)", iconColor: "#F5A623", title: "Guest Request Logged", desc: `Room ${r.unit_label || '?'}: ${r.description}`, time: new Date(r.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
            });
            
            // Housekeeping
            dashboardData?.recentHK?.slice(0, 2).forEach((h: any) => {
              activities.push({ icon: RotateCcw, iconBg: "rgba(43,174,142,0.1)", iconColor: "#2BAE8E", title: "Housekeeping Update", desc: `Room ${h.unit_label || '?'}: ${h.task_type} — ${h.status}`, time: new Date(h.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
            });
            
            // Maintenance
            dashboardData?.recentMaint?.slice(0, 2).forEach((m: any) => {
              activities.push({ icon: Settings, iconBg: "rgba(100,116,139,0.1)", iconColor: "#64748B", title: "Maintenance Ticket", desc: `${m.title} (Room ${m.unit_label || '?'})`, time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
            });
            
            activities.sort((a, b) => b.time.localeCompare(a.time));
            const displayed = activities.slice(0, 6);
            
            if (displayed.length === 0) {
              return (
                <div className="text-center py-6">
                  <Clock className="w-5 h-5 mx-auto mb-2 text-[#64748B]" />
                  <p className="text-sm text-[#64748B]">No activity today</p>
                </div>
              );
            }
            
            return displayed.map((act, i) => {
              const IconComp = act.icon;
              return (
                <div key={i} className="flex items-start gap-3 py-3" style={{ borderBottom: i < displayed.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: act.iconBg }}>
                    <IconComp className="w-3.5 h-3.5" style={{ color: act.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>{act.title}</span>
                      <span className="text-xs" style={{ color: "#64748B" }}>{act.time}</span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#64748B" }}>{act.desc}</p>
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
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(42,157,143,0.08)" }}>
              <div className="text-lg font-bold" style={{ color: "#2BAE8E" }}>
                {dashboardData?.occupancy?.total_rooms ? Math.round((dashboardData.occupancy.occupied / dashboardData.occupancy.total_rooms) * 100) : 0}%
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Occupancy Rate</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(26,60,94,0.06)" }}>
              <div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>₹{((dashboardData?.revenue?.revenue || 0) / 1000).toFixed(0)}K</div>
              <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Today's Revenue</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(245,166,35,0.08)" }}>
              <div className="text-lg font-bold" style={{ color: "#F5A623" }}>
                ₹{dashboardData?.revenue?.bookings_today ? ((dashboardData.revenue.revenue / dashboardData.revenue.bookings_today) / 1000).toFixed(1) + 'K' : '0'}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Avg. Daily Rate</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(100,116,139,0.08)" }}>
              <div className="text-lg font-bold" style={{ color: "#64748B" }}>{dashboardData?.revenue?.bookings_today || 0}</div>
              <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Bookings Today</div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: "#1A3C5E" }}>Room Status Breakdown</span>
              <span className="text-xs" style={{ color: "#64748B" }}>{dashboardData?.occupancy?.total_rooms || 0} total rooms</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Occupied', count: dashboardData?.occupancy?.occupied || 0, total: dashboardData?.occupancy?.total_rooms || 1, color: '#3B82F6' },
                { label: 'Vacant (Available)', count: dashboardData?.occupancy?.vacant || 0, total: dashboardData?.occupancy?.total_rooms || 1, color: '#10B981' },
                { label: 'Dirty / Cleaning', count: dashboardData?.occupancy?.dirty || 0, total: dashboardData?.occupancy?.total_rooms || 1, color: '#F59E0B' },
                { label: 'Maintenance', count: dashboardData?.occupancy?.maint || 0, total: dashboardData?.occupancy?.total_rooms || 1, color: '#EF4444' },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: "#1A2E44" }}>{s.label}</span>
                    <span style={{ color: "#64748B" }}>{s.count}/{s.total} rooms</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: "#F5F7FA" }}>
                    <div className="h-2 rounded-full" style={{ width: `${(s.count / s.total) * 100}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
                <span className="text-xs font-medium" style={{ color: "#1A2E44" }}>Guest Requests Today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{dashboardData?.amenityRequests?.total || 0}</span>
                <span className="text-xs" style={{ color: "#F5A623" }}>{dashboardData?.amenityRequests?.pending || 0} pending</span>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
                <span className="text-xs font-medium" style={{ color: "#1A2E44" }}>F&B Orders Today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{dashboardData?.fbOrders?.total || 0}</span>
                <span className="text-xs" style={{ color: "#2BAE8E" }}>{dashboardData?.fbOrders?.in_progress || 0} in progress</span>
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
