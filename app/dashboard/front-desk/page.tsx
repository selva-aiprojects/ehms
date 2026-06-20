"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus, LogIn, LogOut, RefreshCw, AlertCircle, Loader2, Users, Calendar, DoorOpen, BedDouble, Phone, Mail, MapPin, Clock, Star, MessageSquare, Bell, Settings, ClipboardList, ArrowRight, MoreHorizontal, Home, Wifi, Coffee, ChevronRight, BarChart3, Download, Utensils, Trash2, RotateCcw, Send } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useReservations, useGuests, useRoomMatrix } from "@/lib/hooks";
import { useCheckIn, useCheckOut, useCreateReservation, useCreateGuest } from "@/lib/hooks/mutations";
import CheckInModal from "./components/CheckInModal";
import FolioModal from "./components/FolioModal";
import OffersCard from "./components/OffersCard";
import ChannelPartnersCard from "./components/ChannelPartnersCard";
import WalkInModal from "./components/WalkInModal";

const ROOM_STATUS_STYLES: Record<string, { bg: string; dot: string; label: string }> = {
  vacant: { bg: "rgba(42,157,143,0.1)", dot: "#2BAE8E", label: "Vacant" },
  occupied: { bg: "rgba(14,36,61,0.08)", dot: "#1A3C5E", label: "Occupied" },
  dirty: { bg: "rgba(255,193,7,0.15)", dot: "#F5A623", label: "Dirty" },
  cleaning: { bg: "rgba(42,157,143,0.15)", dot: "#2BAE8E", label: "Cleaning" },
  maintenance: { bg: "rgba(220,53,69,0.1)", dot: "#E53E3E", label: "Maint." },
  reserved: { bg: "rgba(107,122,141,0.12)", dot: "#64748B", label: "Reserved" },
  inspection: { bg: "rgba(42,157,143,0.08)", dot: "#4DB88A", label: "Inspection" },
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
  const [floor, setFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [applyingAction, setApplyingAction] = useState<string | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const { reservations, isLoading: loadingRes, isError: resError, mutate: mutateRes } = useReservations({ date: today });
  const { rooms: matrixRooms, isLoading: loadingMatrix, mutate: mutateMatrix } = useRoomMatrix();
  const { guests, isLoading: loadingGuests } = useGuests();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [checkInModalData, setCheckInModalData] = useState<{ isOpen: boolean, roomId: string, bookingId: string, guestName: string, unitLabel: string } | null>(null);
  const [folioModalData, setFolioModalData] = useState<{ isOpen: boolean, bookingId: string, guestName: string } | null>(null);

  const rooms = matrixRooms || [];
  const filtered = rooms.filter((r: any) => r.floor_number === floor);
  const selected = rooms.find((r: any) => r.id === selectedRoom);

  const arrivalsData = reservations
    ? (reservations as any[])?.filter((b: any) => b.status === "confirmed" || b.status === "pending") || []
    : [];
    
  const inHouseData = rooms.filter((r: any) => r.booking_status === "checked_in");
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
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Oceanview Hotel · {new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
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
          <CardHeader title="Room Matrix" subtitle="Click to select" action={
            <div className="flex gap-1">
              {[1, 2, 3].map((f) => (
                <button key={f} onClick={() => { setFloor(f); setSelectedRoom(null); }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                  style={{ background: floor === f ? "#1A3C5E" : "#F5F7FA", color: floor === f ? "#FFFFFF" : "#64748B" }}
                >Floor {f}</button>
              ))}
            </div>
          } />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {loadingRes
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonRoomCard key={i} />)
              : filtered.map((room) => {
                  const s = ROOM_STATUS_STYLES[room.status] || ROOM_STATUS_STYLES.vacant;
                  const isSelected = selectedRoom === room.id;
                  return (
                    <button key={room.id} onClick={() => setSelectedRoom(isSelected ? null : room.id)}
                      className="rounded-xl p-3 text-left transition-all border-2"
                      style={{ background: s.bg, borderColor: isSelected ? "#2BAE8E" : "transparent" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm" style={{ color: "#1A3C5E" }}>{room.unit_label}</span>
                        {room.vip && <Badge variant="amber">VIP</Badge>}
                      </div>
                      <div className="text-xs font-medium mb-2" style={{ color: "#1A2E44" }}>{room.unit_type}</div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
                        <span className="text-xs" style={{ color: "#64748B" }}>{s.label}</span>
                      </div>
                      {room.guest_name && <div className="text-xs font-medium truncate" style={{ color: "#1A2E44" }}>{room.guest_name}</div>}
                    </button>
                  );
                })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            {Object.entries(ROOM_STATUS_STYLES).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: v.dot }} /> {v.label}</span>
            ))}
          </div>
        </Card>

        <Card>
          {selected ? (
            <div>
              <CardHeader title={`Room ${selected.unit_label}`} subtitle={selected.unit_type} />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={selected.vip ? "amber" : "gray"}>
                    {(ROOM_STATUS_STYLES[selected.status] || ROOM_STATUS_STYLES.vacant).label}
                  </Badge>
                  <span className="font-semibold text-sm" style={{ color: "#1A3C5E" }}>{selected.rate || "—"}/night</span>
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
                      setFolioModalData({ isOpen: true, bookingId: selected.booking_id, guestName: selected.guest_name || "Guest" });
                    }}
                  >
                    <Search className="w-3.5 h-3.5" /> View Folio
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
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
        
        <ChannelPartnersCard />
        <OffersCard />
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
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(42,157,143,0.1)", color: "#1A3C5E", border: "1px solid rgba(42,157,143,0.2)" }}>
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
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(43,174,142,0.08)", color: "#1A3C5E", border: "1px solid rgba(43,174,142,0.15)" }}>
              <ClipboardList className="w-5 h-5" style={{ color: "#2BAE8E" }} />
              Housekeeping
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: "rgba(229,62,62,0.08)", color: "#1A3C5E", border: "1px solid rgba(229,62,62,0.15)" }}>
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
          <CardHeader title="Guest Messaging" subtitle="Send quick notifications" action={<button className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "#F5F7FA", color: "#1A3C5E" }}><Settings className="w-3 h-3" /></button>} />
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(42,157,143,0.15)", color: "#2BAE8E" }}>RK</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#1A2E44" }}>Rajesh Kumar · Room 101</div>
                  <div className="text-xs truncate" style={{ color: "#64748B" }}>Requesting extra towels</div>
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: "#64748B" }}>2 min ago</span>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(245,166,35,0.15)", color: "#D4850A" }}>AS</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#1A2E44" }}>Amit Sharma · Room 203</div>
                  <div className="text-xs truncate" style={{ color: "#64748B" }}>Late checkout request</div>
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: "#64748B" }}>15 min ago</span>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(26,60,94,0.1)", color: "#1A3C5E" }}>SJ</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#1A2E44" }}>Sarah Johnson · Room 201</div>
                  <div className="text-xs truncate" style={{ color: "#64748B" }}>Needs restaurant recommendation</div>
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: "#64748B" }}>1 hour ago</span>
              </div>
            </div>
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
          <button className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        } />
        <div className="space-y-0">
          <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(42,157,143,0.12)" }}>
              <LogIn className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>Check-In Completed</span>
                <span className="text-xs" style={{ color: "#64748B" }}>08:45 AM</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Emily Chen checked into Suite 304 (3-night stay)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(229,62,62,0.1)" }}>
              <LogOut className="w-3.5 h-3.5" style={{ color: "#E53E3E" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>Check-Out Processed</span>
                <span className="text-xs" style={{ color: "#64748B" }}>09:30 AM</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Michael Torres checked out of Deluxe King 102 (Folio settled)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,166,35,0.12)" }}>
              <Bell className="w-3.5 h-3.5" style={{ color: "#F5A623" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>Guest Request Logged</span>
                <span className="text-xs" style={{ color: "#64748B" }}>10:15 AM</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Room 203 (Amit Sharma) requested late checkout until 3 PM</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(43,174,142,0.1)" }}>
              <RotateCcw className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>Room Status Updated</span>
                <span className="text-xs" style={{ color: "#64748B" }}>11:00 AM</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Room 102 marked as Cleaning (housekeeping dispatched)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(100,116,139,0.1)" }}>
              <Users className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>Walk-in Booking</span>
                <span className="text-xs" style={{ color: "#64748B" }}>11:45 AM</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>New walk-in reservation for Deluxe Twin 202 (2-night stay)</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Detailed Room Metrics" subtitle="Occupancy and revenue breakdown" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(42,157,143,0.08)" }}>
              <div className="text-lg font-bold" style={{ color: "#2BAE8E" }}>67%</div>
              <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Occupancy Rate</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(26,60,94,0.06)" }}>
              <div className="text-lg font-bold" style={{ color: "#1A3C5E" }}>₹1,08,000</div>
              <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Today's Revenue</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(245,166,35,0.08)" }}>
              <div className="text-lg font-bold" style={{ color: "#F5A623" }}>₹12,857</div>
              <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Avg. Daily Rate</div>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: "rgba(100,116,139,0.08)" }}>
              <div className="text-lg font-bold" style={{ color: "#64748B" }}>6</div>
              <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>Check-outs Today</div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: "#1A3C5E" }}>Room Type Breakdown</span>
              <span className="text-xs" style={{ color: "#64748B" }}>Status by category</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: "#1A2E44" }}>Deluxe King</span>
                  <span style={{ color: "#64748B" }}>1/3 occupied</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "#F5F7FA" }}>
                  <div className="h-2 rounded-full" style={{ width: "33%", background: "#2BAE8E" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: "#1A2E44" }}>Deluxe Twin</span>
                  <span style={{ color: "#64748B" }}>1/3 occupied</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "#F5F7FA" }}>
                  <div className="h-2 rounded-full" style={{ width: "33%", background: "#2BAE8E" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: "#1A2E44" }}>Suite</span>
                  <span style={{ color: "#64748B" }}>2/3 occupied</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "#F5F7FA" }}>
                  <div className="h-2 rounded-full" style={{ width: "66%", background: "#2BAE8E" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: "#1A2E44" }}>Executive Suite</span>
                  <span style={{ color: "#64748B" }}>1/1 occupied</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "#F5F7FA" }}>
                  <div className="h-2 rounded-full" style={{ width: "100%", background: "#2BAE8E" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: "#1A2E44" }}>Penthouse</span>
                  <span style={{ color: "#64748B" }}>0/1 occupied</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "#F5F7FA" }}>
                  <div className="h-2 rounded-full" style={{ width: "0%", background: "#2BAE8E" }} />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
                <span className="text-xs font-medium" style={{ color: "#1A2E44" }}>Amenity Requests Today</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: "#1A3C5E" }}>7</span>
                <span className="text-xs" style={{ color: "#2BAE8E" }}>4 pending</span>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
                <span className="text-xs font-medium" style={{ color: "#1A2E44" }}>Room Service Orders</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: "#1A3C5E" }}>12</span>
                <span className="text-xs" style={{ color: "#F5A623" }}>3 in progress</span>
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
    </div>
  );
}
