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
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "#E2E8F0" }}>
          <h2 className="text-lg font-semibold text-[#1A3C5E] flex items-center gap-2">
            <User className="w-5 h-5 text-[#2BAE8E]" /> Guest Profile
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#2BAE8E]" />
            </div>
          ) : !guest ? (
            <div className="text-center py-12 text-[#64748B]">Guest not found.</div>
          ) : (
            <>
              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{ background: "rgba(43,174,142,0.15)", color: "#2BAE8E" }}>
                  {guest.first_name?.[0]}{guest.last_name?.[0]}
                </div>
                <div>
                  <div className="text-xl font-bold text-[#1A3C5E]">{guest.first_name} {guest.last_name}</div>
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
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(245,166,35,0.12)", color: "#D4850A" }}>
                        {Number(guest.loyalty_points).toFixed(0)} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                {guest.email && (
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <Mail className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-[#64748B]">Email</div>
                      <div className="text-sm font-medium text-[#1A2E44] truncate">{guest.email}</div>
                    </div>
                  </div>
                )}
                {guest.phone && (
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <Phone className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-[#64748B]">Phone</div>
                      <div className="text-sm font-medium text-[#1A2E44]">{guest.phone}</div>
                    </div>
                  </div>
                )}
                {guest.nationality && (
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                    <MapPin className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#64748B]">Nationality</div>
                      <div className="text-sm font-medium text-[#1A2E44]">{guest.nationality}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <Clock className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                  <div>
                    <div className="text-xs text-[#64748B]">Total Stays</div>
                    <div className="text-sm font-medium text-[#1A2E44]">{guest.total_stays || 0} stays</div>
                  </div>
                </div>
              </div>

              {/* KYC / ID Info */}
              {(guest.id_type || guest.id_number) && (
                <div className="p-3 rounded-lg border" style={{ borderColor: "#E2E8F0" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-[#64748B]" />
                    <span className="text-sm font-medium text-[#1A3C5E]">ID Document</span>
                    {guest.id_verified && <Badge variant="teal" className="text-xs">Verified</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {guest.id_type && <div><span className="text-[#64748B] text-xs">Type: </span><span className="text-[#1A2E44] capitalize">{guest.id_type.replace('_', ' ')}</span></div>}
                    {guest.id_number && <div><span className="text-[#64748B] text-xs">Number: </span><span className="text-[#1A2E44]">{guest.id_number}</span></div>}
                  </div>
                </div>
              )}

              {/* Stay History */}
              {bookings.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-[#1A3C5E] mb-2">Stay History</div>
                  <div className="space-y-2">
                    {bookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                        <div>
                          <div className="text-sm font-medium text-[#1A2E44]">
                            {b.unit?.unit_label ? `Unit ${b.unit.unit_label}` : "Room"}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            {b.check_in ? new Date(b.check_in).toLocaleDateString("en-IN") : "—"} →{" "}
                            {b.check_out ? new Date(b.check_out).toLocaleDateString("en-IN") : "—"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[#1A3C5E]">₹{Number(b.total_amount || 0).toLocaleString("en-IN")}</div>
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
                  <div className="text-sm font-semibold text-[#1A3C5E] mb-2">Preferences</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(guest.preferences).map(([k, v]) => (
                      <span key={k} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: "rgba(43,174,142,0.1)", color: "#2BAE8E" }}>
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t" style={{ borderColor: "#E2E8F0" }}>
          <button onClick={onClose}
            className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "#F5F7FA", color: "#64748B" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
