"use client";

import { useState } from "react";
import { Wallet, Search, CreditCard, ChevronRight, Loader2, Download, AlertCircle } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import FolioModal from "../components/FolioModal";
import { useCheckOut } from "@/lib/hooks/mutations";
import { useJourney } from "@/components/providers/JourneyProvider";
import { useFrontDeskBilling } from "@/lib/hooks";

export default function BillingFolioPage() {
  const { selectedPropertyId } = useJourney();
  const [search, setSearch] = useState("");
  const { billing, isLoading, mutate } = useFrontDeskBilling(selectedPropertyId || undefined);
  const folios = billing || [];
  
  const [folioModalData, setFolioModalData] = useState<{ isOpen: boolean; bookingId: string; guestName: string } | null>(null);
  const checkOutMutation = useCheckOut();

  const handleCheckOut = async (bookingId: string) => {
    try {
      await checkOutMutation.trigger(bookingId);
      mutate();
    } catch (err) {
      console.error(err);
      alert("Check-out failed.");
    }
  };

  const filtered = folios.filter((f: any) => 
    f.unit_label.toLowerCase().includes(search.toLowerCase()) || 
    (f.first_name + " " + f.last_name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#1A3C5E" }}>
            <Wallet className="w-6 h-6 text-[#2BAE8E]" /> Billing & Folio
          </h1>
          <p className="text-[#64748B] mt-1 text-sm">Manage active guest folios, process payments, and bulk checkout.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Unit or Guest..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#2BAE8E]/20"
              style={{ borderColor: "#E2E8F0" }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-[#1A3C5E] to-[#2BAE8E] text-white">
          <div className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium opacity-90">Total Outstanding</span>
              <div className="p-2 bg-white/20 rounded-lg"><CreditCard className="w-5 h-5 text-white" /></div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                ${folios.reduce((acc: number, f: any) => acc + Number(f.balance_due), 0).toFixed(2)}
              </div>
              <p className="text-sm opacity-80 mt-1">Across {folios.filter((f: any) => Number(f.balance_due) > 0).length} folios</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Active Folios" subtitle={`${filtered.length} folios`} />
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#64748B]" /></div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]">No active folios found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F5F7FA] text-[#64748B] uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Unit / Guest</th>
                  <th className="px-4 py-3">Total Charges</th>
                  <th className="px-4 py-3">Balance Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filtered.map((f: any) => {
                  const bal = Number(f.balance_due);
                  return (
                    <tr key={f.booking_id} className="hover:bg-[#F5F7FA]/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-[#1A3C5E]">Unit {f.unit_label}</div>
                        <div className="text-xs text-[#64748B] mt-0.5">{f.first_name} {f.last_name}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-[#1A2E44]">${Number(f.room_charges) + Number(f.invoice_total)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className={`font-semibold ${bal > 0 ? "text-red-500" : "text-[#2BAE8E]"}`}>
                          ${bal.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={bal > 0 ? "amber" : "teal"}>
                          {bal > 0 ? "Pending Payment" : "Settled"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          onClick={() => setFolioModalData({ isOpen: true, bookingId: f.booking_id, guestName: `${f.first_name} ${f.last_name}` })}
                          className="text-[#2BAE8E] hover:text-[#2BAE8E]/80 font-medium inline-flex items-center"
                        >
                          Open Folio <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <FolioModal
        isOpen={folioModalData?.isOpen || false}
        onClose={() => setFolioModalData(null)}
        bookingId={folioModalData?.bookingId || null}
        guestName={folioModalData?.guestName || ""}
        onCheckout={handleCheckOut}
      />
    </div>
  );
}
