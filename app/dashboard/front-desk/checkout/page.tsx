"use client";

import { useState, useEffect } from "react";
import { LogOut, Loader2, CreditCard, Star, Key, Eye, Clock } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useJourney } from "@/components/providers/JourneyProvider";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "var(--color-warning)", bg: "var(--color-warning-soft)" },
  folio_review: { label: "Folio Review", color: "var(--color-info)", bg: "var(--color-info-soft)" },
  payment_pending: { label: "Payment Due", color: "var(--color-warning)", bg: "var(--color-warning-soft)" },
  completed: { label: "Checked Out", color: "var(--color-success)", bg: "var(--color-success-soft)" },
  expired: { label: "Expired", color: "var(--color-text-faint)", bg: "var(--color-light)" },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function CheckoutDashboardPage() {
  const { selectedPropertyId } = useJourney();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const fetchSessions = async () => {
    if (!selectedPropertyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout?property_id=${selectedPropertyId}`);
      if (res.ok) setSessions(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedPropertyId]);

  const qrUrl = (token: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/kiosk/${token}`;

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-warning-rgb),0.10)" }}>
            <LogOut className="w-5 h-5" style={{ color: "var(--color-warning)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Self Check-out</h1>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Manage digital check-out sessions and folio review</p>
          </div>
        </div>
        <Button onClick={fetchSessions} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["pending", "folio_review", "payment_pending", "completed"] as const).map((s) => {
          const count = sessions.filter((x: any) => x.status === s).length;
          const meta = STATUS_META[s];
          return (
            <div key={s} className="p-3 rounded-xl" style={{ background: meta.bg }}>
              <p className="text-[10px] font-medium uppercase" style={{ color: meta.color }}>{meta.label}</p>
              <p className="text-xl font-bold" style={{ color: meta.color }}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-info)" }} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center">
            <LogOut className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-border-strong)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>No check-out sessions</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--color-light)" }}>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Guest</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Booking</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Status</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Charges</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Balance</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Rating</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {sessions.map((s: any) => {
                const meta = STATUS_META[s.status] || STATUS_META.pending;
                return (
                  <tr key={s.id} className="transition-colors hover:opacity-80">
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium" style={{ color: "var(--color-navy)" }}>{s.guest_full_name || "—"}</p>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>
                      {s.source_booking_ref?.slice(0, 8) || "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--color-navy)" }}>
                      {formatCurrency(Number(s.total_charges))}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: Number(s.balance_due) > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                      {formatCurrency(Number(s.balance_due))}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.satisfaction_rating ? (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className="w-3 h-3" style={{ color: i < s.satisfaction_rating ? "var(--color-warning)" : "var(--color-border)", fill: i < s.satisfaction_rating ? "var(--color-warning)" : "none" }} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors hover:opacity-80"
                        style={{ background: "var(--color-warning-soft)", color: "var(--color-warning-dark)", border: "1px solid var(--color-warning)" }}
                      >
                        View
                      </button>
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
              <h3 className="text-sm font-bold" style={{ color: "var(--color-navy)" }}>Check-out Details</h3>
              <button onClick={() => setSelectedSession(null)} className="text-xs cursor-pointer" style={{ color: "var(--color-text-faint)" }}>✕</button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>Guest</span>
                <span className="font-medium" style={{ color: "var(--color-navy)" }}>{selectedSession.guest_full_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>Total Charges</span>
                <span className="font-medium" style={{ color: "var(--color-navy)" }}>{formatCurrency(Number(selectedSession.total_charges))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>Payments Made</span>
                <span className="font-medium" style={{ color: "var(--color-success)" }}>{formatCurrency(Number(selectedSession.total_payments))}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span style={{ color: "var(--color-navy)" }}>Balance Due</span>
                <span style={{ color: Number(selectedSession.balance_due) > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                  {formatCurrency(Number(selectedSession.balance_due))}
                </span>
              </div>
              <hr style={{ borderColor: "var(--color-border)" }} />
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>Payment Method</span>
                <span className="font-medium" style={{ color: "var(--color-navy)" }}>{selectedSession.payment_method || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>Feedback</span>
                <span className="font-medium" style={{ color: "var(--color-navy)" }}>
                  {selectedSession.satisfaction_rating ? `${selectedSession.satisfaction_rating}/5` : "—"}
                </span>
              </div>
              {selectedSession.feedback_text && (
                <p className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>"{selectedSession.feedback_text}"</p>
              )}
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>Digital Key Returned</span>
                <span className="font-medium" style={{ color: selectedSession.digital_key_returned ? "var(--color-success)" : "var(--color-danger)" }}>
                  {selectedSession.digital_key_returned ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
