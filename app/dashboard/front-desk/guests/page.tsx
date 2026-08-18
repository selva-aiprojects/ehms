"use client";

import { useState } from "react";
import { Users, Search, Mail, Phone, ChevronRight, Loader2, Star } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { useGuests } from "@/lib/hooks";
import GuestDetailsModal from "../components/GuestDetailsModal";

export default function GuestProfilesPage() {
  const [search, setSearch] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const { guests, isLoading } = useGuests(search);

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-navy)" }}>
            <Users className="w-6 h-6 text-[var(--color-primary)]" /> Guest Profiles
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">Manage guest CRM, view history, and VIP status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search guests..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader title="All Guests" subtitle={`${guests?.length || 0} profiles found`} />
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" /></div>
        ) : !guests || guests.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">No guests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--color-light)] text-[var(--color-text-muted)] uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Guest Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">VIP Status</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {guests.map((g: any) => (
                  <tr key={g.id} className="hover:bg-[color:var(--color-light)]/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[var(--color-navy)]">{g.first_name} {g.last_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">ID: {g.id_number || "Not provided"}</div>
                    </td>
                    <td className="px-4 py-4 space-y-1">
                      {g.email && <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]"><Mail className="w-3.5 h-3.5" /> {g.email}</div>}
                      {g.phone && <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]"><Phone className="w-3.5 h-3.5" /> {g.phone}</div>}
                    </td>
                    <td className="px-4 py-4">
                      {g.total_stays > 3 ? (
                        <Badge variant="amber" className="flex items-center w-fit gap-1"><Star className="w-3 h-3" /> VIP Guest</Badge>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">Standard</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedGuestId(g.id)}
                        className="text-[var(--color-primary)] hover:text-[color:var(--color-primary)]/80 font-medium inline-flex items-center transition-colors"
                      >
                        View <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <GuestDetailsModal
        guestId={selectedGuestId}
        onClose={() => setSelectedGuestId(null)}
      />
    </div>
  );
}
