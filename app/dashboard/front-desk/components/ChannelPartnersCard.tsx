"use client";

import { useEffect, useState } from "react";
import { Globe, Loader2, CheckCircle2, Clock, XCircle, RefreshCw, Radio, X, DoorOpen, PlusCircle } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useProperties, useRoomMatrix } from "@/lib/hooks";
import { toast } from "react-hot-toast";

interface ChannelPartnersCardProps {
  propertyId?: string;
}

export default function ChannelPartnersCard({ propertyId: propPropertyId }: ChannelPartnersCardProps) {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const { properties } = useProperties("hotel");
  const activePropertyId = propPropertyId || properties?.[0]?.id;
  const { rooms, mutate: mutateRooms } = useRoomMatrix(activePropertyId);
  const vacantRooms = (rooms || []).filter((r: any) => r.status === "vacant");

  // Simulator state
  const [simForm, setSimForm] = useState({
    channel_name: "Booking.com",
    unit_id: "",
    guest_name: "Alexander Smith",
    check_in: new Date().toISOString().split("T")[0],
    check_out: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    total_amount: "14500"
  });
  const [simulating, setSimulating] = useState(false);

  const fetchChannels = async () => {
    try {
      const url = activePropertyId
        ? `/api/dashboard/front-desk/channels?property_id=${activePropertyId}`
        : "/api/dashboard/front-desk/channels";
      const res = await fetch(url);
      const data = await res.json();
      if (data.data) setChannels(data.data);
    } catch (e) {
      console.error("Failed to fetch channels", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [activePropertyId]);

  // Handle Outbound Push Broadcast
  const handleBroadcastSync = async () => {
    if (!activePropertyId) {
      toast.error("Please select an active property first");
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch("/api/dashboard/front-desk/channels/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "push_availability",
          property_id: activePropertyId
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Broadcast failed");
      toast.success(json.message || "OTA channels synchronized!");
      fetchChannels();
    } catch (err: any) {
      toast.error(err?.message || "Error syncing channels");
    } finally {
      setSyncing(false);
    }
  };

  // Handle Inbound Webhook Booking Simulation
  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePropertyId || !simForm.unit_id) {
      toast.error("Please select a valid vacant room and property");
      return;
    }
    setSimulating(true);
    try {
      const res = await fetch("/api/dashboard/front-desk/channels/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "webhook_booking",
          property_id: activePropertyId,
          ...simForm
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Simulation rejected");
      
      toast.success(`Webhook booking processed! Smart Key PIN: ${json.pin_code}`);
      setShowSimulator(false);
      fetchChannels();
      if (mutateRooms) mutateRooms();
    } catch (err: any) {
      toast.error(err?.message || "Simulation error");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
        <div>
          <h3 className="text-sm font-semibold text-[#1A3C5E] flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-[#2BAE8E]" /> Channel Manager & OTAs
          </h3>
          <p className="text-[11px] text-[#64748B]">2-Way Real-time availability & rate bridge</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSimulator(true)}
            className="text-xs h-7 px-2 border-[#2BAE8E] text-[#2BAE8E] hover:bg-[#ECFDF5]"
          >
            <Radio className="w-3 h-3 mr-1" /> Webhook Simulator
          </Button>
          <Button
            size="sm"
            onClick={handleBroadcastSync}
            disabled={syncing}
            className="text-xs h-7 px-2.5 bg-[#1A3C5E] hover:bg-[#132A42] text-white"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Broadcasting..." : "Sync All"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
      ) : channels.length === 0 ? (
        <div className="text-center py-8">
          <Globe className="w-6 h-6 mx-auto mb-2 text-[#64748B]" />
          <p className="text-sm text-[#64748B]">No active OTA channels found.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#E2E8F0] overflow-y-auto max-h-[300px]">
          {channels.map(channel => (
            <div key={channel.id} className="flex items-center justify-between p-3 text-sm hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1A3C5E]/5 flex items-center justify-center font-bold text-xs text-[#1A3C5E]">
                  {channel.channel_name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-xs text-[#1A2E44]">{channel.channel_name}</p>
                  <p className="text-[11px] text-[#64748B] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    {channel.last_sync_time ? new Date(channel.last_sync_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Never synced"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {channel.last_sync_status === 200 || channel.last_sync_status === 201 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2BAE8E] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Live Sync (5s)
                  </span>
                ) : channel.last_sync_status ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E53E3E] bg-[#FEE2E2] px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" /> Sync Error
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] bg-gray-100 px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                )}
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-[10px] font-bold text-[#1A3C5E] bg-[#1A3C5E]/10 px-1.5 py-0.5 rounded">
                    {channel.new_bookings_24h || 0} arrivals today
                  </span>
                  {channel.commission_rate > 0 && (
                    <span className="text-[10px] text-gray-500">{channel.commission_rate}% fee</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Webhook Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-semibold text-[#1A3C5E] flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-[#2BAE8E]" /> Simulate Inbound OTA Webhook
                </h3>
                <p className="text-[11px] text-[#64748B]">Simulate a direct external OTA booking arrival</p>
              </div>
              <button onClick={() => setShowSimulator(false)} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-4 h-4 text-gray-500" /></button>
            </div>

            <form onSubmit={handleSimulateWebhook} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#1A2E44] mb-1">Select OTA Channel Source</label>
                <select
                  value={simForm.channel_name}
                  onChange={e => setSimForm({ ...simForm, channel_name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#2BAE8E]"
                >
                  <option value="Booking.com">Booking.com</option>
                  <option value="MakeMyTrip / GoIbibo">MakeMyTrip / GoIbibo</option>
                  <option value="Airbnb">Airbnb</option>
                  <option value="Expedia">Expedia</option>
                  <option value="Agoda">Agoda</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#1A2E44] mb-1">Target Vacant Unit / Room</label>
                <select
                  required
                  value={simForm.unit_id}
                  onChange={e => setSimForm({ ...simForm, unit_id: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#2BAE8E]"
                >
                  <option value="" disabled>Select Vacant Room ({vacantRooms.length} available)...</option>
                  {vacantRooms.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      Unit {r.unit_label} — {r.layout_type || r.unit_type} (₹{r.base_rate}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#1A2E44] mb-1">Guest Full Name</label>
                <input
                  required
                  type="text"
                  value={simForm.guest_name}
                  onChange={e => setSimForm({ ...simForm, guest_name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#2BAE8E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1A2E44] mb-1">Check-In Date</label>
                  <input
                    required
                    type="date"
                    value={simForm.check_in}
                    onChange={e => setSimForm({ ...simForm, check_in: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#2BAE8E]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#1A2E44] mb-1">Check-Out Date</label>
                  <input
                    required
                    type="date"
                    value={simForm.check_out}
                    onChange={e => setSimForm({ ...simForm, check_out: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#2BAE8E]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1A2E44] mb-1">Total OTA Charge (₹)</label>
                <input
                  required
                  type="number"
                  value={simForm.total_amount}
                  onChange={e => setSimForm({ ...simForm, total_amount: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-[#2BAE8E]"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowSimulator(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={simulating} className="bg-[#2BAE8E] hover:bg-[#239B7E] text-white">
                  {simulating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5 mr-1.5" />}
                  Trigger Inbound Webhook
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
