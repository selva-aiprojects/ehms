"use client";

import { useState } from "react";
import { ClipboardList, Search, Clock, Calendar as CalendarIcon, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { useReservations } from "@/lib/hooks";

export default function CheckInsPage() {
  const [filter, setFilter] = useState("all"); // 'all', 'checked_in', 'pending'
  const { reservations, isLoading } = useReservations(filter !== "all" ? { status: filter } : {});

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#1A3C5E" }}>
            <ClipboardList className="w-6 h-6 text-[#2BAE8E]" /> Check-Ins & Arrivals
          </h1>
          <p className="text-[#64748B] mt-1 text-sm">Log of historical check-ins and upcoming arrivals.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE8E]/20"
            style={{ borderColor: "#E2E8F0" }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Bookings</option>
            <option value="checked_in">Currently Checked In</option>
            <option value="pending">Upcoming Arrivals</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader title="Arrivals Log" subtitle={`${reservations?.length || 0} records`} />
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#64748B]" /></div>
        ) : !reservations || reservations.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F5F7FA] text-[#64748B] uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Guest</th>
                  <th className="px-4 py-3">Unit / Dates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {reservations.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[#F5F7FA]/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#1A3C5E]">{r.guest?.first_name} {r.guest?.last_name}</div>
                      <div className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1">
                        Ref: <span className="font-mono">{r.id.split('-')[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[#1A2E44]">Unit {r.unit?.unit_label || "TBD"}</div>
                      <div className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
                        <CalendarIcon className="w-3 h-3" /> {new Date(r.check_in).toLocaleDateString()} - {new Date(r.check_out).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={r.status === 'checked_in' ? 'teal' : r.status === 'pending' ? 'amber' : 'gray'} className="capitalize">
                        {r.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-[#2BAE8E] hover:text-[#2BAE8E]/80 font-medium inline-flex items-center">
                        Details <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
