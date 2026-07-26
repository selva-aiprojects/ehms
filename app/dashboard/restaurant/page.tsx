"use client";

import { useState, useEffect } from "react";
import {
  UtensilsCrossed, Plus, Clock, Users as UsersIcon, XCircle,
  Grid3X3, CheckCircle, AlertTriangle, Settings2,
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useJourney } from "@/components/providers/JourneyProvider";
import {
  useRestaurantTables, useTableLayout, useTableReservations,
  useFnBOrders, useFnBMenu, useSplitBills,
} from "@/lib/hooks";
import {
  useUpdateTableStatus, useCreateTableReservation,
} from "@/lib/hooks/mutations";
import { toast } from "react-hot-toast";

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  available:      { bg: "#ECFDF5", border: "#2BAE8E", text: "#065F46", dot: "bg-[#2BAE8E]" },
  occupied:       { bg: "#FEF2F2", border: "#E53E3E", text: "#991B1B", dot: "bg-[#E53E3E]" },
  reserved:       { bg: "#FFFBEB", border: "#D97706", text: "#92400E", dot: "bg-[#D97706]" },
  cleaning:       { bg: "#F5F7FA", border: "#94A3B8", text: "#475569", dot: "bg-[#94A3B8]" },
  out_of_service: { bg: "#F3F4F6", border: "#6B7280", text: "#374151", dot: "bg-[#6B7280]" },
};

function elapsed(since: string | null) {
  if (!since) return "";
  const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RestaurantPOSPage() {
  const { selectedPropertyId } = useJourney();
  const [activeTab, setActiveTab] = useState<"floor" | "orders" | "reservations">("floor");
  const { tables, mutate: mutateTables } = useRestaurantTables(selectedPropertyId);
  const { layout } = useTableLayout(selectedPropertyId);
  const { reservations, mutate: mutateReservations } = useTableReservations(selectedPropertyId);
  const { orders = [] } = useFnBOrders();
  const { trigger: updateTable } = useUpdateTableStatus();
  const { trigger: createReservation } = useCreateTableReservation();
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showResModal, setShowResModal] = useState(false);
  const [elapsedMap, setElapsedMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const iv = setInterval(() => {
      const map: Record<string, string> = {};
      tables.forEach((t: any) => { if (t.occupied_at) map[t.id] = elapsed(t.occupied_at); });
      setElapsedMap(map);
    }, 1000);
    return () => clearInterval(iv);
  }, [tables]);

  const restaurantOrders = orders.filter((o: any) => !["delivered", "cancelled"].includes(o.status));

  const handleStatusChange = async (tableId: string, newStatus: string) => {
    try {
      await updateTable(tableId, { status: newStatus });
      await mutateTables();
      setShowTableModal(false);
      toast.success(`Table updated to ${newStatus}`);
    } catch { toast.error("Failed to update table"); }
  };

  const [resForm, setResForm] = useState({
    guest_name: "", guest_phone: "", party_size: 2, table_id: "",
    reservation_time: "", duration_mins: 120, notes: "",
  });

  const handleCreateReservation = async () => {
    if (!resForm.table_id || !resForm.reservation_time) return toast.error("Select a table and time");
    try {
      await createReservation({
        property_id: selectedPropertyId, table_id: resForm.table_id,
        guest_name: resForm.guest_name, guest_phone: resForm.guest_phone,
        party_size: resForm.party_size, reservation_time: resForm.reservation_time,
        duration_mins: resForm.duration_mins, notes: resForm.notes,
      });
      await mutateReservations();
      await mutateTables();
      setShowResModal(false);
      setResForm({ guest_name: "", guest_phone: "", party_size: 2, table_id: "", reservation_time: "", duration_mins: 120, notes: "" });
      toast.success("Reservation created");
    } catch { toast.error("Failed to create reservation"); }
  };

  const tabs = [
    { key: "floor", label: "Floor Plan", icon: Grid3X3 },
    { key: "orders", label: "Orders", icon: UtensilsCrossed },
    { key: "reservations", label: "Reservations", icon: Clock },
  ] as const;

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#1A3C5E" }}>
            <UtensilsCrossed className="w-6 h-6 text-[#2BAE8E]" /> Restaurant POS
          </h1>
          <p className="text-[#64748B] mt-1 text-sm">Manage tables, orders, and reservations.</p>
        </div>
        {activeTab === "reservations" && (
          <Button className="bg-[#2BAE8E] hover:bg-[#239B7E] text-white" onClick={() => setShowResModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Reservation
          </Button>
        )}
      </div>

      <div className="flex gap-1 bg-[#F5F7FA] rounded-lg p-1 border border-[#E2E8F0] w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key ? "#fff" : "transparent",
              color: activeTab === tab.key ? "#1A3C5E" : "#64748B",
              boxShadow: activeTab === tab.key ? "0 1px 3px rgba(26,60,94,0.1)" : "none",
            }}>
            <tab.icon className="w-4 h-4" /> {tab.label}
            {tab.key === "orders" && (
              <span className="ml-1 bg-[#E53E3E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{restaurantOrders.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "floor" && (
        <div className="space-y-6">
          {(layout as any[]).map((section: any) => (
            <Card key={section.id || "unassigned"}>
              <CardHeader title={section.name} subtitle={`${section.tables.length} table${section.tables.length !== 1 ? "s" : ""}`} />
              <div className="flex flex-wrap gap-4">
                {section.tables.map((table: any) => {
                  const sc = STATUS_COLORS[table.status] || STATUS_COLORS.available;
                  return (
                    <button key={table.id} onClick={() => { setSelectedTable(table); setShowTableModal(true); }}
                      className="relative flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all hover:shadow-md cursor-pointer"
                      style={{
                        background: sc.bg, borderColor: sc.border,
                        minWidth: table.shape === "rectangle" ? 160 : 100,
                        minHeight: table.shape === "round" ? 100 : 80,
                        borderRadius: table.shape === "round" ? "50%" : "12px",
                      }}>
                      <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${sc.dot}`} />
                      <span className="text-lg font-bold" style={{ color: sc.text }}>{table.table_number}</span>
                      <span className="text-xs flex items-center gap-1 mt-1" style={{ color: sc.text }}>
                        <UsersIcon className="w-3 h-3" /> {table.capacity}
                      </span>
                      {table.status === "occupied" && elapsedMap[table.id] && (
                        <span className="text-[10px] mt-1 font-mono text-[#E53E3E]">{elapsedMap[table.id]}</span>
                      )}
                      <span className="text-[10px] capitalize mt-0.5" style={{ color: sc.text }}>{table.status.replace(/_/g, " ")}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
          {(!layout || (layout as any[]).length === 0) && (
            <Card><div className="p-12 text-center text-[#64748B]">
              <Grid3X3 className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              No floor plan data. Tables will appear once seeded.
            </div></Card>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <Card>
          <CardHeader title="Active Orders" subtitle={`${restaurantOrders.length} active`} />
          {restaurantOrders.length === 0 ? (
            <div className="p-12 text-center text-[#64748B]">
              <UtensilsCrossed className="w-8 h-8 mx-auto mb-3 text-gray-300" />No active orders.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {restaurantOrders.map((order: any) => (
                <div key={order.id} className="p-4 hover:bg-[#F5F7FA] transition-colors flex flex-col md:flex-row justify-between md:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-[#1A3C5E]">Room {order.unit_label || "—"}</span>
                      <Badge variant={order.status === "pending" ? "amber" : order.status === "preparing" ? "navy" : "teal"} className="capitalize">{order.status}</Badge>
                    </div>
                    <div className="text-sm text-[#1A2E44]">
                      {order.items?.map((i: any) => `${i.quantity}x ${i.item_name}`).join(", ") || "—"}
                    </div>
                    <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#1A3C5E]">₹{Number(order.total_amount).toLocaleString("en-IN")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "reservations" && (
        <Card>
          <CardHeader title="Table Reservations" subtitle={`${reservations.length} total`} />
          {reservations.length === 0 ? (
            <div className="p-12 text-center text-[#64748B]">
              <Clock className="w-8 h-8 mx-auto mb-3 text-gray-300" />No reservations.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {reservations.map((res: any) => (
                <div key={res.id} className="p-4 hover:bg-[#F5F7FA] transition-colors flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1A3C5E]">{res.guest_name || "Walk-in"}</span>
                      <Badge variant={res.status === "confirmed" ? "teal" : res.status === "seated" ? "navy" : res.status === "cancelled" ? "red" : "amber"} className="capitalize">{res.status}</Badge>
                    </div>
                    <div className="text-sm text-[#64748B] mt-0.5">
                      Table {res.table_number || "—"} · {res.party_size} guests · {new Date(res.reservation_time).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {res.notes && <div className="text-xs text-[#64748B] mt-1 italic">{res.notes}</div>}
                  </div>
                  <div className="text-xs text-[#64748B]">{res.duration_mins}m</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showTableModal && selectedTable && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowTableModal(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A3C5E]">Table {selectedTable.table_number}</h2>
              <button onClick={() => setShowTableModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#F5F7FA] rounded-lg p-3"><span className="text-[#64748B] text-xs">Status</span><div className="font-semibold capitalize text-[#1A3C5E]">{selectedTable.status.replace(/_/g, " ")}</div></div>
                <div className="bg-[#F5F7FA] rounded-lg p-3"><span className="text-[#64748B] text-xs">Capacity</span><div className="font-semibold text-[#1A3C5E]">{selectedTable.capacity} seats</div></div>
                <div className="bg-[#F5F7FA] rounded-lg p-3"><span className="text-[#64748B] text-xs">Section</span><div className="font-semibold text-[#1A3C5E]">{selectedTable.section_name || "—"}</div></div>
                <div className="bg-[#F5F7FA] rounded-lg p-3"><span className="text-[#64748B] text-xs">Shape</span><div className="font-semibold capitalize text-[#1A3C5E]">{selectedTable.shape}</div></div>
              </div>
              {selectedTable.occupied_at && (
                <div className="bg-[#FEF2F2] rounded-lg p-3 text-sm text-[#991B1B]">Occupied for {elapsed(selectedTable.occupied_at)}</div>
              )}
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#1A3C5E]">Change Status</p>
                {["available", "occupied", "reserved", "cleaning", "out_of_service"].map((s) => (
                  <button key={s} onClick={() => handleStatusChange(selectedTable.id, s)} disabled={selectedTable.status === s}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium border transition-all disabled:opacity-40"
                    style={{ background: STATUS_COLORS[s].bg, borderColor: STATUS_COLORS[s].border, color: STATUS_COLORS[s].text }}>
                    {s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                    {selectedTable.status === s && " (current)"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {showResModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowResModal(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A3C5E]">New Reservation</h2>
              <button onClick={() => setShowResModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Guest Name</label>
                <input type="text" value={resForm.guest_name} onChange={(e) => setResForm({ ...resForm, guest_name: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] focus:outline-none" placeholder="Guest name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Phone</label>
                <input type="text" value={resForm.guest_phone} onChange={(e) => setResForm({ ...resForm, guest_phone: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] focus:outline-none" placeholder="Phone number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Party Size</label>
                  <input type="number" min={1} value={resForm.party_size} onChange={(e) => setResForm({ ...resForm, party_size: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Duration (min)</label>
                  <input type="number" min={15} step={15} value={resForm.duration_mins} onChange={(e) => setResForm({ ...resForm, duration_mins: Number(e.target.value) })}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Table</label>
                <select value={resForm.table_id} onChange={(e) => setResForm({ ...resForm, table_id: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] focus:outline-none">
                  <option value="">Select table</option>
                  {tables.filter((t: any) => t.status === "available").map((t: any) => (
                    <option key={t.id} value={t.id}>{t.table_number} ({t.capacity} seats)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Date & Time</label>
                <input type="datetime-local" value={resForm.reservation_time} onChange={(e) => setResForm({ ...resForm, reservation_time: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Notes</label>
                <textarea value={resForm.notes} onChange={(e) => setResForm({ ...resForm, notes: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] focus:outline-none"
                  rows={2} placeholder="Special requests..." />
              </div>
            </div>
            <div className="p-4 border-t bg-[#F5F7FA]">
              <button onClick={handleCreateReservation}
                className="w-full bg-[#1A3C5E] hover:bg-[#132d47] text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={!resForm.table_id || !resForm.reservation_time}>
                Create Reservation
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
