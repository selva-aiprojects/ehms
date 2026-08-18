"use client";

import { useEffect, useState } from "react";
import { X, User, Mail, Phone, MapPin, Shield, Star, Clock, CreditCard, Loader2, FileText } from "lucide-react";
import Badge from "@/components/ui/badge";

interface GuestDetailsModalProps {
  guestId: string | null;
  onClose: () => void;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function GuestDetailsModal({ guestId, onClose }: GuestDetailsModalProps) {
  const [guest, setGuest] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guestId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/guests/${guestId}`).then(r => r.json()),
      fetch(`/api/reservations?guest_id=${guestId}&limit=5`).then(r => r.json())
    ]).then(([guestData, resData]) => {
      setGuest(guestData.data || guestData);
      setBookings(resData.data || []);
    }).finally(() => setLoading(false));
  }, [guestId]);

  if (!guestId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="text-lg font-semibold text-[var(--color-navy)] flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--color-primary)]" /> Guest Profile
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : !guest ? (
            <div className="text-center py-12 text-[var(--color-text-muted)]">Guest not found.</div>
          ) : (
            <>
              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{ background: "rgba(var(--color-primary-rgb),0.15)", color: "var(--color-primary)" }}>
                  {guest.first_name?.[0]}{guest.last_name?.[0]}
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--color-navy)]">{guest.first_name} {guest.last_name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {(guest.total_stays > 3 || guest.tags?.includes("VIP")) && (
                      <Badge variant="amber" className="flex items-center gap-1 w-fit">
                        <Star className="w-3 h-3 fill-current" /> VIP Guest
                      </Badge>
                    )}
                    {guest.id_verified && (
                      <Badge variant="teal" className="flex items-center gap-1 w-fit">
                        <Shield className="w-3 h-3" /> KYC Verified
                      </Badge>
                    )}
                    {guest.loyalty_points > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(var(--color-warning-rgb),0.12)", color: "var(--color-warning)" }}>
                        {Number(guest.loyalty_points).toFixed(0)} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                {guest.email && (
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                    <Mail className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-[var(--color-text-muted)]">Email</div>
                      <div className="text-sm font-medium text-[var(--color-text)] truncate">{guest.email}</div>
                    </div>
                  </div>
                )}
                {guest.phone && (
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                    <Phone className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-[var(--color-text-muted)]">Phone</div>
                      <div className="text-sm font-medium text-[var(--color-text)]">{guest.phone}</div>
                    </div>
                  </div>
                )}
                {guest.nationality && (
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                    <MapPin className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[var(--color-text-muted)]">Nationality</div>
                      <div className="text-sm font-medium text-[var(--color-text)]">{guest.nationality}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <Clock className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                  <div>
                    <div className="text-xs text-[var(--color-text-muted)]">Total Stays</div>
                    <div className="text-sm font-medium text-[var(--color-text)]">{guest.total_stays || 0} stays</div>
                  </div>
                </div>
              </div>

              {/* KYC / ID Info */}
              {(guest.id_type || guest.id_number) && (
                <div className="p-3 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span className="text-sm font-medium text-[var(--color-navy)]">ID Document</span>
                    {guest.id_verified && <Badge variant="teal" className="text-xs">Verified</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {guest.id_type && <div><span className="text-[var(--color-text-muted)] text-xs">Type: </span><span className="text-[var(--color-text)] capitalize">{guest.id_type.replace('_', ' ')}</span></div>}
                    {guest.id_number && <div><span className="text-[var(--color-text-muted)] text-xs">Number: </span><span className="text-[var(--color-text)]">{guest.id_number}</span></div>}
                  </div>
                </div>
              )}

              {/* Stay History */}
              {bookings.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-[var(--color-navy)] mb-2">Stay History</div>
                  <div className="space-y-2">
                    {bookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                        <div>
                          <div className="text-sm font-medium text-[var(--color-text)]">
                            {b.unit?.unit_label ? `Unit ${b.unit.unit_label}` : "Room"}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {b.check_in ? new Date(b.check_in).toLocaleDateString("en-IN") : "—"} →{" "}
                            {b.check_out ? new Date(b.check_out).toLocaleDateString("en-IN") : "—"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[var(--color-navy)]">₹{Number(b.total_amount || 0).toLocaleString("en-IN")}</div>
                          <Badge variant={b.status === "checked_out" ? "gray" : b.status === "checked_in" ? "teal" : "amber"} className="text-xs capitalize">
                            {b.status?.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences */}
              {guest.preferences && Object.keys(guest.preferences).length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-[var(--color-navy)] mb-2">Preferences</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(guest.preferences).map(([k, v]) => (
                      <span key={k} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: "rgba(var(--color-primary-rgb),0.1)", color: "var(--color-primary)" }}>
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t" style={{ borderColor: "var(--color-border)" }}>
          <button onClick={onClose}
            className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--color-light)", color: "var(--color-text-muted)" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
