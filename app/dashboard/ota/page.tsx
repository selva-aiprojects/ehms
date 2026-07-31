"use client";

import { useState } from "react";
import { Globe, Loader2, RefreshCw, Plus, ExternalLink, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useOtaMappings, useOtaSyncLogs, useOtaBookings, useOtaSettlements, useChannelPartners } from "@/lib/hooks";
import { useTriggerOtaSync, useCreateOtaMapping, useProcessOtaBooking } from "@/lib/hooks/mutations";
import { useJourney } from "@/components/providers/JourneyProvider";

const CHANNEL_ICONS: Record<string, string> = {
  BOOKING_COM: "🟦",
  EXPEDIA: "🟨",
  AGODA: "🟪",
  MAKEMYTRIP: "🟥",
  GOIBIBO: "🟧",
  HOTELS_COM: "🟫",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function OtaDashboardPage() {
  const { selectedPropertyId } = useJourney();
  const [tab, setTab] = useState<"overview" | "mappings" | "incoming" | "sync-logs" | "settlements">("overview");
  const [showMappingForm, setShowMappingForm] = useState(false);

  const { mappings, isLoading: loadingMappings } = useOtaMappings(selectedPropertyId || undefined);
  const { logs, isLoading: loadingLogs } = useOtaSyncLogs(selectedPropertyId || undefined);
  const { bookings: otaBookings, isLoading: loadingBookings } = useOtaBookings(selectedPropertyId || undefined);
  const { settlements } = useOtaSettlements(selectedPropertyId || undefined);
  const { channels } = useChannelPartners();

  const { trigger: syncTrigger, isMutating: syncing } = useTriggerOtaSync();
  const { trigger: createMapping, isMutating: creatingMapping } = useCreateOtaMapping();
  const { trigger: processBooking, isMutating: processing } = useProcessOtaBooking();

  const handleSync = async () => {
    if (!selectedPropertyId) return;
    await syncTrigger({ property_id: selectedPropertyId, sync_type: "all" });
  };

  // Stats
  const activeMappings = mappings.length;
  const pendingBookings = otaBookings.filter((b: any) => b.status === "pending").length;
  const totalCommissions = settlements.reduce((sum: number, s: any) => sum + Number(s.commission || 0), 0);
  const recentSyncErrors = logs.filter((l: any) => l.response_status >= 400).length;

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-info-rgb),0.10)" }}>
            <Globe className="w-5 h-5" style={{ color: "var(--color-info)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>OTA Channel Manager</h1>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Manage channel mappings, sync inventory, and track OTA bookings</p>
          </div>
        </div>
        <Button onClick={handleSync} disabled={syncing || !selectedPropertyId}>
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync All Channels
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>Active Mappings</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: "var(--color-info)" }}>{activeMappings}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>Pending Bookings</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: pendingBookings > 0 ? "var(--color-warning)" : "var(--color-success)" }}>{pendingBookings}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>Total Commissions</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: "var(--color-danger)" }}>{formatCurrency(totalCommissions)}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>Sync Errors</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: recentSyncErrors > 0 ? "var(--color-danger)" : "var(--color-success)" }}>{recentSyncErrors}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--color-light)", width: "fit-content" }}>
        {(["overview", "mappings", "incoming", "sync-logs", "settlements"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${tab === t ? "bg-white shadow-sm" : ""}`}
            style={{ color: tab === t ? "var(--color-navy)" : "var(--color-text-muted)" }}
          >
            {t === "sync-logs" ? "Sync Logs" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((ch: any) => {
            const channelMappings = mappings.filter((m: any) => m.channel_code === ch.code);
            const channelBookings = otaBookings.filter((b: any) => b.channel_code === ch.code);
            return (
              <Card key={ch.id}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{CHANNEL_ICONS[ch.code] || "📡"}</span>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--color-navy)" }}>{ch.name}</h3>
                    <p className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>{ch.code}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--color-text-muted)" }}>Mappings</span>
                    <span className="font-medium" style={{ color: "var(--color-navy)" }}>{channelMappings.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--color-text-muted)" }}>Bookings (30d)</span>
                    <span className="font-medium" style={{ color: "var(--color-navy)" }}>{channelBookings.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--color-text-muted)" }}>Commission</span>
                    <span className="font-medium" style={{ color: "var(--color-navy)" }}>
                      {channelMappings[0]?.commission_pct ? `${channelMappings[0].commission_pct}%` : "—"}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "mappings" && (
        <Card padding={false}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>Room Type Mappings</h3>
            <Button size="sm" onClick={() => setShowMappingForm(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Mapping
            </Button>
          </div>

          {showMappingForm && (
            <div className="p-4 border-b bg-gray-50" style={{ borderColor: "var(--color-border)" }}>
              <MappingForm
                channels={channels}
                onSubmit={async (data) => {
                  await createMapping({ ...data, property_id: selectedPropertyId });
                  setShowMappingForm(false);
                }}
                onCancel={() => setShowMappingForm(false)}
                isMutating={creatingMapping}
              />
            </div>
          )}

          {loadingMappings ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-info)" }} />
            </div>
          ) : mappings.length === 0 ? (
            <div className="py-12 text-center">
              <Globe className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-border-strong)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>No OTA mappings configured. Add a mapping to start syncing.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--color-light)" }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Channel</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Room Type</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Channel Code</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Rate Multiplier</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Last Synced</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {mappings.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span>{CHANNEL_ICONS[m.channel_code] || "📡"}</span>
                        <span className="text-xs font-medium" style={{ color: "var(--color-navy)" }}>{m.channel_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--color-navy)" }}>{m.unit_type}</td>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>{m.channel_room_type_code}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--color-navy)" }}>{Number(m.rate_multiplier)}x</td>
                    <td className="px-4 py-2.5 text-[10px]" style={{ color: "var(--color-text-faint)" }}>
                      {m.last_synced_at ? new Date(m.last_synced_at).toLocaleString("en-IN") : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "incoming" && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>Incoming OTA Bookings</h3>
          </div>
          {loadingBookings ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-info)" }} />
            </div>
          ) : otaBookings.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-border-strong)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>No incoming OTA bookings</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--color-light)" }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Channel</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Guest</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Dates</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Amount</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Status</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {otaBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <Badge variant="navy">{b.channel_name || b.channel_code}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--color-navy)" }}>{b.guest_name || "—"}</td>
                    <td className="px-4 py-2.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {b.check_in} → {b.check_out}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-navy)" }}>{formatCurrency(Number(b.total_amount))}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={b.status === "pending" ? "amber" : b.status === "created" ? "teal" : "red"}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {b.status === "pending" && (
                        <button
                          onClick={async () => {
                            await processBooking({ id: b.id, property_id: b.property_id });
                          }}
                          disabled={processing}
                          className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-600 cursor-pointer hover:bg-green-100"
                        >
                          Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "sync-logs" && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>Sync History</h3>
          </div>
          {loadingLogs ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-info)" }} />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-border-strong)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>No sync logs yet. Trigger a sync to see history.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--color-light)" }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Channel</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Action</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Status</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Duration</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Time</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-navy)" }}>{log.channel_name || log.channel}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--color-text-muted)" }}>{log.action}</td>
                    <td className="px-4 py-2.5">
                      {log.response_status < 300 ? (
                        <Badge variant="teal">{log.response_status}</Badge>
                      ) : (
                        <Badge variant="red">{log.response_status}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[10px]" style={{ color: "var(--color-text-faint)" }}>{log.duration_ms ? `${log.duration_ms}ms` : "—"}</td>
                    <td className="px-4 py-2.5 text-[10px]" style={{ color: "var(--color-text-faint)" }}>
                      {new Date(log.created_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "settlements" && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>OTA Settlements</h3>
          </div>
          {settlements.length === 0 ? (
            <div className="py-12 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-border-strong)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>No settlements recorded yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--color-light)" }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Channel</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Period</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Gross</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Commission</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Net</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {settlements.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-navy)" }}>{s.channel_name}</td>
                    <td className="px-4 py-2.5 text-[10px]" style={{ color: "var(--color-text-muted)" }}>{s.period_start} → {s.period_end}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--color-navy)" }}>{formatCurrency(Number(s.gross_amount))}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--color-danger)" }}>-{formatCurrency(Number(s.commission))}</td>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-success)" }}>{formatCurrency(Number(s.net_amount))}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={s.status === "reconciled" || s.status === "paid" ? "teal" : "amber"}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Mapping Form ───────────────────────────────────────────
function MappingForm({ channels, onSubmit, onCancel, isMutating }: {
  channels: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isMutating: boolean;
}) {
  const [channelId, setChannelId] = useState("");
  const [unitType, setUnitType] = useState("room");
  const [channelCode, setChannelCode] = useState("");
  const [channelName, setChannelName] = useState("");
  const [multiplier, setMultiplier] = useState(1.0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Channel</label>
        <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }}>
          <option value="">Select...</option>
          {channels.map((ch: any) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Room Type</label>
        <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }}>
          <option value="room">Room</option>
          <option value="suite">Suite</option>
          <option value="apartment">Apartment</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Channel Room Code</label>
        <input value={channelCode} onChange={(e) => setChannelCode(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }} placeholder="e.g. STD-RM" />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Rate Multiplier</label>
        <input type="number" step="0.1" min="0.5" max="3.0" value={multiplier} onChange={(e) => setMultiplier(parseFloat(e.target.value))} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSubmit({ channel_id: channelId, unit_type: unitType, channel_room_type_code: channelCode, channel_room_name: channelName, rate_multiplier: multiplier })} disabled={!channelId || !channelCode || isMutating}>
          {isMutating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
