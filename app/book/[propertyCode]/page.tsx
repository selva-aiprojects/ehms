"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Calendar, Users, CreditCard, Loader2, CheckCircle, Tag, ArrowLeft, Star, Wifi, Car, Coffee, ChevronDown, ChevronUp } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

interface RoomOption {
  unit_type: string;
  unit_name: string;
  max_occupancy: number;
  rate_per_night: number;
  amenities: string[];
}

interface PromoResult {
  valid: boolean;
  discount_pct: number;
  message: string;
}

const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶",
  parking: "🅿️",
  breakfast: "🍳",
  ac: "❄️",
  tv: "📺",
  minibar: "🍷",
  safe: "🔒",
  balcony: "🌅",
  bathtub: "🛁",
  room_service: "🛎️",
};

export default function PublicBookingPage() {
  const params = useParams();
  const router = useRouter();
  const propertyCode = params.propertyCode as string;

  const [step, setStep] = useState<"details" | "rooms" | "guest" | "confirm">("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search params
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [propertyId, setPropertyId] = useState("");

  // Room selection
  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(null);
  const [rooms, setRooms] = useState<RoomOption[]>([]);

  // Guest form
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Promo
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Booking
  const [booking, setBooking] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Set today's date as min
  const today = new Date().toISOString().split("T")[0];

  // Fetch property info and availability
  const handleSearch = async () => {
    if (!checkIn || !checkOut) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/booking-engine/availability?property_code=${propertyCode}&check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to check availability");

      setPropertyId(data.property_id);
      setRooms(data.rooms || []);

      if (data.rooms.length === 0) {
        setError("No rooms available for the selected dates");
      } else {
        setStep("rooms");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Validate promo code
  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setApplyingPromo(true);
    setPromoResult(null);

    try {
      const res = await fetch(`/api/booking-engine/promos?property_id=${propertyId}&promo_code=${promoCode}`);
      const data = await res.json();
      setPromoResult(data);
    } catch {
      setPromoResult({ valid: false, discount_pct: 0, message: "Failed to validate promo code" });
    } finally {
      setApplyingPromo(false);
    }
  };

  // Create booking
  const handleBook = async () => {
    if (!selectedRoom || !guestName || !guestEmail) return;
    setSubmitting(true);

    try {
      const nights = Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
      );
      const baseTotal = selectedRoom.rate_per_night * nights;
      const discount = promoResult?.valid ? baseTotal * (promoResult.discount_pct / 100) : 0;
      const total = baseTotal - discount;

      const res = await fetch("/api/booking-engine/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_code: propertyCode,
          check_in: checkIn,
          check_out: checkOut,
          unit_type: selectedRoom.unit_type,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          total_amount: total,
          promo_code: promoResult?.valid ? promoCode : undefined,
          special_requests: specialRequests,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setBooking(data);
      setStep("confirm");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const totalBeforeDiscount = selectedRoom ? selectedRoom.rate_per_night * nights : 0;
  const discountAmount = promoResult?.valid ? totalBeforeDiscount * (promoResult.discount_pct / 100) : 0;
  const total = totalBeforeDiscount - discountAmount;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-light)" }}>
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: "var(--color-navy)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--secondary)" }}>HostSphere Direct Booking</span>
          </div>
          {step !== "details" && step !== "confirm" && (
            <button
              onClick={() => setStep(step === "guest" ? "rooms" : "details")}
              className="text-xs flex items-center gap-1 cursor-pointer hover:underline"
              style={{ color: "var(--color-text-muted)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Booking Confirmed */}
        {step === "confirm" && booking && (
          <div className="text-center space-y-6">
            <div className="inline-flex w-16 h-16 rounded-full items-center justify-center" style={{ background: "var(--color-success-soft)" }}>
              <CheckCircle className="w-8 h-8" style={{ color: "var(--color-success)" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>Booking Confirmed!</h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                Confirmation #{booking.confirmation_no || booking.id?.slice(0, 8)}
              </p>
            </div>

            <Card className="text-left max-w-md mx-auto">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>Property</span>
                  <span className="font-medium" style={{ color: "var(--color-navy)" }}>{propertyCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>Check-in</span>
                  <span className="font-medium" style={{ color: "var(--color-navy)" }}>{checkIn}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>Check-out</span>
                  <span className="font-medium" style={{ color: "var(--color-navy)" }}>{checkOut}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>Room</span>
                  <span className="font-medium" style={{ color: "var(--color-navy)" }}>{selectedRoom?.unit_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>Guest</span>
                  <span className="font-medium" style={{ color: "var(--color-navy)" }}>{guestName}</span>
                </div>
                <hr style={{ borderColor: "var(--color-border)" }} />
                <div className="flex justify-between text-sm font-bold">
                  <span style={{ color: "var(--color-navy)" }}>Total Paid</span>
                  <span style={{ color: "var(--color-success)" }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </Card>

            <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
              A confirmation email will be sent to {guestName} at {guestName && guestEmail ? guestEmail : "your email"}.
            </p>
          </div>
        )}

        {/* Step 1: Search */}
        {step === "details" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>Book Your Stay</h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Search availability for your dates</p>
            </div>

            <Card>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Check-in</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-faint)" }} />
                    <input
                      type="date"
                      min={today}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full text-sm border rounded-lg pl-9 pr-3 py-2.5"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Check-out</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-faint)" }} />
                    <input
                      type="date"
                      min={checkIn || today}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-sm border rounded-lg pl-9 pr-3 py-2.5"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Guests</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-faint)" }} />
                    <select
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                      className="w-full text-sm border rounded-lg pl-9 pr-3 py-2.5 appearance-none cursor-pointer"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} Guest{n > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={!checkIn || !checkOut || loading} className="w-full">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
                  {error}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Step 2: Select Room */}
        {step === "rooms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Available Rooms</h2>
              <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                {nights} night{nights !== 1 ? "s" : ""} · {checkIn} → {checkOut}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.unit_type}
                  onClick={() => setSelectedRoom(room)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    selectedRoom?.unit_type === room.unit_type
                      ? "border-blue-500 bg-blue-50"
                      : "border-transparent bg-white hover:border-gray-200"
                  }`}
                  style={{ boxShadow: selectedRoom?.unit_type === room.unit_type ? "0 0 0 3px rgba(var(--color-info-rgb),0.10)" : "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: "var(--color-navy)" }}>{room.unit_name || room.unit_type}</h3>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-faint)" }}>
                        Max {room.max_occupancy} guest{room.max_occupancy !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>{formatCurrency(room.rate_per_night)}</p>
                      <p className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>per night</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {(room.amenities || []).slice(0, 5).map((a: string) => (
                      <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                        {AMENITY_ICONS[a] || "✨"} {a}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs border-t pt-2" style={{ borderColor: "var(--color-border)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{nights} nights total</span>
                    <span className="font-bold" style={{ color: "var(--color-navy)" }}>{formatCurrency(room.rate_per_night * nights)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code */}
            <Card>
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Have a promo code?"
                  className="flex-1 text-sm border-none outline-none bg-transparent"
                  style={{ color: "var(--color-navy)" }}
                />
                <Button size="sm" variant="outline" onClick={handleApplyPromo} disabled={applyingPromo || !promoCode}>
                  {applyingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                </Button>
              </div>
              {promoResult && (
                <div className={`mt-2 text-xs px-3 py-1.5 rounded-lg ${promoResult.valid ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                  {promoResult.message}
                </div>
              )}
            </Card>

            {selectedRoom && (
              <div className="flex justify-end">
                <Button onClick={() => setStep("guest")}>
                  Continue to Guest Details
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Guest Details */}
        {step === "guest" && selectedRoom && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Guest Information</h2>

            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Full Name *</label>
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2.5"
                    style={{ borderColor: "var(--color-border)" }}
                    placeholder="As on ID proof"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Email *</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2.5"
                    style={{ borderColor: "var(--color-border)" }}
                    placeholder="name@email.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Phone</label>
                  <input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2.5"
                    style={{ borderColor: "var(--color-border)" }}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Special Requests</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2.5"
                    style={{ borderColor: "var(--color-border)" }}
                    rows={3}
                    placeholder="Early check-in, extra pillows, dietary requirements..."
                  />
                </div>
              </div>
            </Card>

            {/* Price Summary */}
            <Card>
              <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-navy)" }}>Booking Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>{selectedRoom.unit_type} × {nights} nights</span>
                  <span style={{ color: "var(--color-navy)" }}>{formatCurrency(totalBeforeDiscount)}</span>
                </div>
                {promoResult?.valid && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--color-success)" }}>Promo discount ({promoResult.discount_pct}%)</span>
                    <span style={{ color: "var(--color-success)" }}>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <hr style={{ borderColor: "var(--color-border)" }} />
                <div className="flex justify-between text-sm font-bold">
                  <span style={{ color: "var(--color-navy)" }}>Total</span>
                  <span style={{ color: "var(--color-navy)" }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("rooms")}>Back</Button>
              <Button onClick={handleBook} disabled={!guestName || !guestEmail || submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
