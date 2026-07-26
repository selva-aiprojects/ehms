"use client";

import { useState, useEffect } from "react";
import { QrCode, Loader2, CheckCircle, Clock, AlertTriangle, Shield, Key, Eye, User, CreditCard } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useJourney } from "@/components/providers/JourneyProvider";

function useCheckins(propertyId: string | null) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async (status?: string) => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const url = status
        ? `/api/checkin?property_id=${propertyId}&status=${status}`
        : `/api/checkin?property_id=${propertyId}`;
      const res = await fetch(url);
      if (res.ok) setSessions(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return { sessions, loading, fetchSessions };
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#F59E0B", bg: "#FEF3C7" },
  identity_verified: { label: "ID Verified", color: "#3B82F6", bg: "#EFF6FF" },
  payment_pending: { label: "Payment Due", color: "#F97316", bg: "#FFF7ED" },
  completed: { label: "Completed", color: "#10B981", bg: "#ECFDF5" },
  expired: { label: "Expired", color: "#94A3B8", bg: "#F1F5F9" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2" },
};

export default function CheckinDashboardPage() {
  const { selectedPropertyId } = useJourney();
  const [filter, setFilter] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { sessions, loading, fetchSessions } = useCheckins(selectedPropertyId);

  useEffect(() => {
    fetchSessions();
  }, [selectedPropertyId]);

  const handleFilter = (s: string) => {
    setFilter(s);
    fetchSessions(s || undefined);
  };

  const qrUrl = (token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/kiosk/${token}`;

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.10)" }}>
            <QrCode className="w-5 h-5" style={{ color: "#3B82F6" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1A3C5E" }}>Self Check-in Management</h1>
            <p className="text-xs" style={{ color: "#64748B" }}>Manage kiosk sessions, QR codes, and digital keys</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["pending", "identity_verified", "payment_pending", "completed", "expired"] as const).map((s) => {
          const count = sessions.filter((x: any) => x.status === s).length;
          const meta = STATUS_META[s];
          return (
            <button
              key={s}
              onClick={() => handleFilter(filter === s ? "" : s)}
              className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${filter === s ? "border-blue-400" : "border-transparent"}`}
              style={{ background: meta.bg }}
            >
              <p className="text-[10px] font-medium uppercase" style={{ color: meta.color }}>{meta.label}</p>
              <p className="text-xl font-bold" style={{ color: meta.color }}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3B82F6" }} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center">
            <QrCode className="w-8 h-8 mx-auto mb-2" style={{ color: "#CBD5E1" }} />
            <p className="text-sm" style={{ color: "#94A3B8" }}>No check-in sessions</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F5F7FA" }}>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Guest</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Booking</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Status</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Identity</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Key</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>QR</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#E2E8F0" }}>
              {sessions.map((s: any) => {
                const meta = STATUS_META[s.status] || STATUS_META.pending;
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedSession(s)}>
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium" style={{ color: "#1A3C5E" }}>{s.guest_full_name || s.guest_full_name || "—"}</p>
                      <p className="text-[10px]" style={{ color: "#94A3B8" }}>{s.guest_email || ""}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-[10px] font-mono" style={{ color: "#64748B" }}>{s.source_booking_ref?.slice(0, 8) || "—"}</p>
                      <p className="text-[10px]" style={{ color: "#94A3B8" }}>{s.bk_check_in} → {s.bk_check_out}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {s.id_verified ? (
                        <Shield className="w-4 h-4" style={{ color: "#10B981" }} />
                      ) : (
                        <span className="text-[10px]" style={{ color: "#94A3B8" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.digital_key_issued ? (
                        <Key className="w-4 h-4" style={{ color: "#10B981" }} />
                      ) : (
                        <span className="text-[10px]" style={{ color: "#94A3B8" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = qrUrl(s.session_token);
                          navigator.clipboard.writeText(url);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100"
                      >
                        Copy QR
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-[10px]" style={{ color: "#94A3B8" }}>
                      {new Date(s.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelectedSession(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: "#1A3C5E" }}>Check-in Details</h3>
              <button onClick={() => setSelectedSession(null)} className="text-xs cursor-pointer" style={{ color: "#94A3B8" }}>✕</button>
            </div>

            <div className="space-y-3">
              <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Guest" value={selectedSession.guest_full_name || selectedSession.guest_full_name} />
              <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Dates" value={`${selectedSession.bk_check_in} → ${selectedSession.bk_check_out}`} />
              <InfoRow icon={<Shield className="w-3.5 h-3.5" />} label="ID" value={selectedSession.id_verified ? `${selectedSession.id_type}: ${selectedSession.id_number}` : "Not verified"} />
              <InfoRow icon={<CreditCard className="w-3.5 h-3.5" />} label="Payment" value={selectedSession.payment_status || "Pending"} />
              <InfoRow icon={<Key className="w-3.5 h-3.5" />} label="Digital Key" value={selectedSession.digital_key_value || "Not issued"} />

              {selectedSession.session_token && (
                <div className="p-3 rounded-lg" style={{ background: "#F8FAFC" }}>
                  <p className="text-[10px] font-medium mb-1" style={{ color: "#94A3B8" }}>Kiosk URL</p>
                  <p className="text-[10px] font-mono break-all" style={{ color: "#3B82F6" }}>
                    {qrUrl(selectedSession.session_token)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "#94A3B8" }}>{icon}</span>
      <span className="text-[10px] w-20 shrink-0" style={{ color: "#94A3B8" }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: "#1A3C5E" }}>{value || "—"}</span>
    </div>
  );
}
