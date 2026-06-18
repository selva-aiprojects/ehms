"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

const rooms = [
  { id: "101", type: "Deluxe King", floor: 1, status: "occupied", guest: "Rajesh Kumar", checkin: "18 Jun", checkout: "22 Jun", rate: "₹8,000", vip: true },
  { id: "102", type: "Deluxe Twin", floor: 1, status: "dirty", guest: "", checkin: "", checkout: "", rate: "₹7,500", vip: false },
  { id: "103", type: "Suite", floor: 1, status: "vacant", guest: "", checkin: "", checkout: "", rate: "₹15,000", vip: false },
  { id: "104", type: "Deluxe King", floor: 1, status: "maintenance", guest: "", checkin: "", checkout: "", rate: "₹8,000", vip: false },
  { id: "201", type: "Executive Suite", floor: 2, status: "occupied", guest: "Sarah Johnson", checkin: "17 Jun", checkout: "20 Jun", rate: "₹18,000", vip: false },
  { id: "202", type: "Deluxe King", floor: 2, status: "vacant", guest: "", checkin: "", checkout: "", rate: "₹8,000", vip: false },
  { id: "203", type: "Deluxe Twin", floor: 2, status: "reserved", guest: "Amit Sharma", checkin: "19 Jun", checkout: "21 Jun", rate: "₹7,500", vip: true },
  { id: "204", type: "Suite", floor: 2, status: "occupied", guest: "Priya Patel", checkin: "15 Jun", checkout: "20 Jun", rate: "₹15,000", vip: false },
  { id: "301", type: "Penthouse", floor: 3, status: "vacant", guest: "", checkin: "", checkout: "", rate: "₹25,000", vip: false },
  { id: "302", type: "Deluxe King", floor: 3, status: "cleaning", guest: "", checkin: "", checkout: "", rate: "₹8,000", vip: false },
  { id: "303", type: "Deluxe Twin", floor: 3, status: "occupied", guest: "Vikram Singh", checkin: "16 Jun", checkout: "19 Jun", rate: "₹7,500", vip: true },
  { id: "304", type: "Suite", floor: 3, status: "occupied", guest: "Emily Chen", checkin: "14 Jun", checkout: "21 Jun", rate: "₹15,000", vip: false },
];

const statusStyles: Record<string, { bg: string; dot: string; label: string }> = {
  vacant: { bg: "rgba(42,157,143,0.1)", dot: "#2BAE8E", label: "Vacant" },
  occupied: { bg: "rgba(14,36,61,0.08)", dot: "#1A3C5E", label: "Occupied" },
  dirty: { bg: "rgba(255,193,7,0.15)", dot: "#F5A623", label: "Dirty" },
  cleaning: { bg: "rgba(42,157,143,0.15)", dot: "#2BAE8E", label: "Cleaning" },
  maintenance: { bg: "rgba(220,53,69,0.1)", dot: "#E53E3E", label: "Maint." },
  reserved: { bg: "rgba(107,122,141,0.12)", dot: "#64748B", label: "Reserved" },
};

export default function FrontDeskPage() {
  const [floor, setFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const filtered = rooms.filter((r) => r.floor === floor);
  const selected = rooms.find((r) => r.id === selectedRoom);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Front Desk Command Center</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Oceanview Hotel · 18 Jun 2026</p>
        </div>
        <Button variant="secondary" size="sm"><UserPlus className="w-3.5 h-3.5" /> Walk-in Booking</Button>
      </div>

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
            {filtered.map((room) => {
              const s = statusStyles[room.status];
              const isSelected = selectedRoom === room.id;
              return (
                <button key={room.id} onClick={() => setSelectedRoom(isSelected ? null : room.id)}
                  className="rounded-xl p-3 text-left transition-all border-2"
                  style={{ background: s.bg, borderColor: isSelected ? "#2BAE8E" : "transparent" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm" style={{ color: "#1A3C5E" }}>{room.id}</span>
                    {room.vip && <Badge variant="amber">VIP</Badge>}
                  </div>
                  <div className="text-xs font-medium mb-2" style={{ color: "#1A2E44" }}>{room.type}</div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
                    <span className="text-xs" style={{ color: "#64748B" }}>{s.label}</span>
                  </div>
                  {room.guest && <div className="text-xs font-medium truncate" style={{ color: "#1A2E44" }}>{room.guest}</div>}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 text-xs" style={{ borderTop: "1px solid #E2E8F0", color: "#64748B" }}>
            {Object.entries(statusStyles).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: v.dot }} /> {v.label}</span>
            ))}
          </div>
        </Card>

        <Card>
          {selected ? (
            <div>
              <CardHeader title={`Room ${selected.id}`} subtitle={selected.type} />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={selected.vip ? "amber" : "gray"}>{statusStyles[selected.status].label}</Badge>
                  <span className="font-semibold text-sm" style={{ color: "#1A3C5E" }}>{selected.rate}/night</span>
                </div>
                {selected.guest && (
                  <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <div className="font-medium text-sm mb-2" style={{ color: "#1A2E44" }}>{selected.guest}</div>
                    <div className="flex items-center gap-2 text-xs mb-1" style={{ color: "#64748B" }}>
                      <span>{selected.checkin} → {selected.checkout}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Button variant="primary" size="sm" className="w-full">Check In</Button>
                  <Button variant="secondary" size="sm" className="w-full">Assign Room</Button>
                  <Button variant="outline" size="sm" className="w-full">View Folio</Button>
                  {selected.status === "occupied" && (
                    <Button variant="outline" size="sm" className="w-full" style={{ color: "#E53E3E", borderColor: "#E53E3E" }}>Check Out</Button>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Arrivals Today" subtitle="5 expected" />
          {["Rajesh Kumar (1204)", "Amit Sharma (203)", "Neha Gupta (Walk-in)"].map((n, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < 2 ? "1px solid #E2E8F0" : "none" }}>
              <span style={{ color: "#1A2E44" }}>{n}</span><Badge variant="amber">Arriving</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <CardHeader title="In-House" subtitle="8 guests" />
          {["Sarah Johnson (201)", "Priya Patel (204)", "Vikram Singh (303)", "Emily Chen (304)"].map((n, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < 3 ? "1px solid #E2E8F0" : "none" }}>
              <span style={{ color: "#1A2E44" }}>{n}</span><Badge variant="teal">In House</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <CardHeader title="Departures Today" subtitle="3 due" />
          {["Vikram Singh (303)", "Emily Chen (304)"].map((n, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < 1 ? "1px solid #E2E8F0" : "none" }}>
              <span style={{ color: "#1A2E44" }}>{n}</span>
              <Button variant="ghost" size="sm">Check Out</Button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
