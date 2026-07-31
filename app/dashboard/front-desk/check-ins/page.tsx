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
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-navy)" }}>
            <ClipboardList className="w-6 h-6 text-[var(--color-primary)]" /> Check-Ins & Arrivals
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">Log of historical check-ins and upcoming arrivals.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
            style={{ borderColor: "var(--color-border)" }}
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
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" /></div>
        ) : !reservations || reservations.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--color-light)] text-[var(--color-text-muted)] uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Guest</th>
                  <th className="px-4 py-3">Unit / Dates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {reservations.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[color:var(--color-light)]/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[var(--color-navy)]">{r.guest?.first_name} {r.guest?.last_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                        Ref: <span className="font-mono">{r.id.split('-')[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[var(--color-text)]">Unit {r.unit?.unit_label || "TBD"}</div>
                      <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                        <CalendarIcon className="w-3 h-3" /> {new Date(r.check_in).toLocaleDateString()} - {new Date(r.check_out).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={r.status === 'checked_in' ? 'teal' : r.status === 'pending' ? 'amber' : 'gray'} className="capitalize">
                        {r.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-[var(--color-primary)] hover:text-[color:var(--color-primary)]/80 font-medium inline-flex items-center">
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
