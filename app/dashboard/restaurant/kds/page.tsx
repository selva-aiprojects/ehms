"use client";

import { useState, useEffect } from "react";
import { Monitor, ChevronRight, Clock, AlertTriangle, Filter } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { useJourney } from "@/components/providers/JourneyProvider";
import { useKdsTickets, useKdsStations } from "@/lib/hooks";
import { useUpdateKdsTicket } from "@/lib/hooks/mutations";
import { toast } from "react-hot-toast";

const PRIORITY_BADGE: Record<string, { variant: "red" | "amber" | "navy" | "gray"; label: string }> = {
  rush: { variant: "red", label: "RUSH" },
  high: { variant: "amber", label: "HIGH" },
  normal: { variant: "navy", label: "Normal" },
  low: { variant: "gray", label: "Low" },
};

const STATUS_COLS = [
  { key: "new", label: "New", headerBg: "#FEE2E2", headerText: "#991B1B" },
  { key: "in_progress", label: "In Progress", headerBg: "#FEF3C7", headerText: "#92400E" },
  { key: "ready", label: "Ready", headerBg: "#D1FAE5", headerText: "#065F46" },
] as const;

function timeSince(ts: string | null) {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}m ${s}s`;
}

export default function KDSPage() {
  const { selectedPropertyId } = useJourney();
  const [stationFilter, setStationFilter] = useState<string>("all");
  const { stations } = useKdsStations(selectedPropertyId);
  const { tickets } = useKdsTickets(selectedPropertyId, stationFilter === "all" ? undefined : stationFilter);
  const { trigger: updateTicket } = useUpdateKdsTicket();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(iv);
  }, []);

  const nextStatus: Record<string, string> = {
    new: "in_progress",
    in_progress: "ready",
    ready: "served",
  };

  const handleAdvance = async (ticket: any) => {
    const next = nextStatus[ticket.status];
    if (!next) return;
    try {
      await updateTicket(ticket.id, { status: next });
      toast.success(`Ticket moved to ${next.replace(/_/g, " ")}`);
    } catch {
      toast.error("Failed to update ticket");
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#1A3C5E" }}>
            <Monitor className="w-6 h-6 text-[#2BAE8E]" /> Kitchen Display System
          </h1>
          <p className="text-[#64748B] mt-1 text-sm">Live order queue. Click a ticket to advance its status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64748B]" />
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#2BAE8E] focus:outline-none"
          >
            <option value="all">All Stations</option>
            {(stations as any[]).map((s: any) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATUS_COLS.map((col) => {
          const colTickets = (tickets as any[]).filter((t: any) => t.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="rounded-lg px-4 py-2.5 flex items-center justify-between" style={{ background: col.headerBg }}>
                <span className="font-semibold text-sm" style={{ color: col.headerText }}>{col.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: col.headerText, color: col.headerBg }}>{colTickets.length}</span>
              </div>
              {colTickets.length === 0 ? (
                <Card><div className="p-8 text-center text-[#64748B] text-sm">No tickets</div></Card>
              ) : (
                <div className="space-y-3">
                  {colTickets.map((ticket: any) => {
                    const pb = PRIORITY_BADGE[ticket.priority] || PRIORITY_BADGE.normal;
                    return (
                      <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" padding={false}>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1A3C5E] text-lg">{ticket.table_number || "—"}</span>
                              <Badge variant={pb.variant} className="text-[10px]">{pb.label}</Badge>
                            </div>
                            <div className="flex items-center gap-1 text-[#64748B] text-xs">
                              <Clock className="w-3 h-3" />
                              {timeSince(ticket.fired_at)}
                            </div>
                          </div>
                          <div className="text-sm text-[#1A2E44] space-y-0.5">
                            {ticket.items?.map((item: any, idx: number) => (
                              <div key={idx}>{item.quantity}x {item.item_name}</div>
                            ))}
                          </div>
                          {ticket.notes && (
                            <div className="text-xs text-[#D97706] italic bg-[#FFFBEB] rounded px-2 py-1">{ticket.notes}</div>
                          )}
                          <div className="text-[10px] text-[#64748B]">Station: {ticket.station}</div>
                        </div>
                        {nextStatus[ticket.status] && (
                          <button
                            onClick={() => handleAdvance(ticket)}
                            className="w-full border-t border-[#E2E8F0] py-2.5 text-xs font-medium flex items-center justify-center gap-1 hover:bg-[#F5F7FA] transition-colors"
                            style={{ color: "#2BAE8E" }}>
                            Move to {nextStatus[ticket.status].replace(/_/g, " ")}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
