"use client";

import { useEffect, useState } from "react";
import { Globe, Loader2, CheckCircle2, Clock } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";

export default function ChannelPartnersCard() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/front-desk/channels")
      .then(res => res.json())
      .then(data => {
        if (data.data) setChannels(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader title="Channel Partners" subtitle="OTA Sync Status" />
      {loading ? (
        <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
      ) : channels.length === 0 ? (
        <div className="text-center py-6">
          <Globe className="w-5 h-5 mx-auto mb-2 text-[#64748B]" />
          <p className="text-sm text-[#64748B]">No active channels.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map(channel => (
            <div key={channel.id} className="flex items-center justify-between p-2 text-sm border-b border-[#E2E8F0] last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1A3C5E]/5 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[#1A3C5E]" />
                </div>
                <div>
                  <p className="font-semibold text-[#1A2E44]">{channel.channel_name}</p>
                  <p className="text-xs text-[#64748B] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    {channel.last_sync_time ? new Date(channel.last_sync_time).toLocaleTimeString() : "Never"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {channel.last_sync_status === 'success' ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-[#2BAE8E]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#E53E3E]">Sync Failed</span>
                )}
                <p className="text-[10px] text-[#64748B] mt-0.5">{channel.new_bookings_24h} new today</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
