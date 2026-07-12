"use client";

import { useState, useEffect } from "react";
import { X, DoorOpen, UserPlus, Loader2, Upload, Clock } from "lucide-react";
import Button from "@/components/ui/button";
import { useProperties, useRoomMatrix } from "@/lib/hooks";
import { calculateBookingPrice } from "@/lib/pricing";
import { toast } from "react-hot-toast";

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  propertyId?: string;
}

export default function WalkInModal({ isOpen, onClose, onSuccess, propertyId: propPropertyId }: WalkInModalProps) {
  const now = new Date();
  const [formData, setFormData] = useState({
    booking_model: "nightly" as "nightly" | "hourly",
    hourly_package: "3h" as "3h" | "6h" | "12h" | "24h" | "custom",
    custom_hours: 3,
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    unit_id: "",
    check_in: now.toISOString().split("T")[0],
    check_out: new Date(now.getTime() + 24 * 3600 * 1000).toISOString().split("T")[0],
    total_amount: "",
    id_document: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const { rooms } = useRoomMatrix(propPropertyId);
  const vacantRooms = (rooms || []).filter((r: any) => r.status === "vacant");

  const { properties } = useProperties("hotel");
  const activePropertyId = propPropertyId || properties?.[0]?.id || (vacantRooms[0] as any)?.property_id;

  // Handle Switching between Nightly & Hourly Model
  const handleBookingModelChange = (model: "nightly" | "hourly") => {
    const cur = new Date();
    if (model === "hourly") {
      // Default to 3-hour micro-stay starting now
      const ciStr = new Date(cur.getTime() - cur.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      const co = new Date(cur.getTime() + 3 * 3600 * 1000);
      const coStr = new Date(co.getTime() - co.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setFormData(prev => ({
        ...prev,
        booking_model: "hourly",
        hourly_package: "3h",
        custom_hours: 3,
        check_in: ciStr,
        check_out: coStr,
        unit_id: ""
      }));
    } else {
      const todayStr = cur.toISOString().split("T")[0];
      const tomorrow = new Date(cur.getTime() + 24 * 3600 * 1000);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      setFormData(prev => ({
        ...prev,
        booking_model: "nightly",
        check_in: todayStr,
        check_out: tomorrowStr,
        unit_id: ""
      }));
    }
  };

  // Handle Hourly Package selection (3h / 6h / 12h / 24h)
  const handleHourlyPackageChange = (pkg: "3h" | "6h" | "12h" | "24h" | "custom", customHrs?: number) => {
    const hours = pkg === "3h" ? 3 : pkg === "6h" ? 6 : pkg === "12h" ? 12 : pkg === "24h" ? 24 : (customHrs || formData.custom_hours);
    const ci = new Date(formData.check_in || new Date());
    if (!isNaN(ci.getTime())) {
      const co = new Date(ci.getTime() + hours * 3600 * 1000);
      // Format as datetime-local without timezone shift issues
      const coStr = new Date(co.getTime() - co.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setFormData(prev => ({
        ...prev,
        hourly_package: pkg,
        custom_hours: hours,
        check_out: coStr
      }));
    } else {
      setFormData(prev => ({ ...prev, hourly_package: pkg, custom_hours: hours }));
    }
  };

  // Check room availability whenever property, check_in, or check_out changes
  useEffect(() => {
    async function fetchAvailable() {
      if (!activePropertyId || !formData.check_in || !formData.check_out) return;
      
      const ci = new Date(formData.check_in);
      const co = new Date(formData.check_out);
      if (isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) {
        setAvailableUnits([]);
        return;
      }

      setLoadingUnits(true);
      try {
        const res = await fetch(
          `/api/reservations/check-availability?property_id=${activePropertyId}&check_in=${ci.toISOString()}&check_out=${co.toISOString()}`
        );
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setAvailableUnits(json.data);
        } else {
          setAvailableUnits(vacantRooms);
        }
      } catch (e) {
        console.error("Failed to check availability:", e);
        setAvailableUnits(vacantRooms);
      } finally {
        setLoadingUnits(false);
      }
    }

    if (isOpen) {
      fetchAvailable();
    }
  }, [activePropertyId, formData.check_in, formData.check_out, isOpen]);

  // Dynamic Pricing Calculation
  useEffect(() => {
    if (formData.unit_id && formData.check_in && formData.check_out) {
      const unitsList = availableUnits.length > 0 ? availableUnits : vacantRooms;
      const selectedRoom = unitsList.find((r: any) => r.id === formData.unit_id);
      if (selectedRoom && selectedRoom.base_rate) {
        const ci = new Date(formData.check_in);
        const co = new Date(formData.check_out);
        if (!isNaN(ci.getTime()) && !isNaN(co.getTime()) && ci < co) {
          const priceObj = calculateBookingPrice(
            formData.booking_model,
            Number(selectedRoom.base_rate),
            ci,
            co
          );
          setFormData(prev => ({ ...prev, total_amount: priceObj.totalAmount.toString() }));
        }
      }
    }
  }, [formData.unit_id, formData.check_in, formData.check_out, formData.booking_model, availableUnits, vacantRooms]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!activePropertyId) throw new Error("No active property found");

      // 1. Create Guest Profile
      const guestRes = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          id_document: formData.id_document
        })
      });
      if (!guestRes.ok) throw new Error("Failed to create guest");
      const guestData = await guestRes.json();
      const guestId = guestData.data?.id;

      // 2. Create Reservation & Check-In
      const resRes = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: activePropertyId,
          guest_id: guestId,
          unit_id: formData.unit_id,
          booking_model: formData.booking_model,
          source: "direct",
          check_in: new Date(formData.check_in).toISOString(),
          check_out: new Date(formData.check_out).toISOString(),
          total_amount: parseFloat(formData.total_amount || "0"),
        })
      });
      if (!resRes.ok) {
        const errJson = await resRes.json();
        throw new Error(errJson.error || "Failed to create reservation");
      }
      const resData = await resRes.json();
      
      // 3. Mark as checked_in
      await fetch(`/api/reservations/${resData.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "checked_in" })
      });

      toast.success("Walk-in checked in successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error processing walk-in");
    } finally {
      setSubmitting(false);
    }
  };

  const unitsToDisplay = availableUnits.length > 0 ? availableUnits : vacantRooms;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "#E2E8F0" }}>
          <div>
            <h2 className="text-lg font-semibold text-[#1A3C5E] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#2BAE8E]" /> Walk-In Check-In
            </h2>
            <p className="text-sm text-[#64748B]">Create guest and assign a room instantly.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Booking Model Selector */}
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1A2E44] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2BAE8E]" /> Booking & Billing Model
              </label>
              <div className="flex gap-1 bg-gray-200 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => handleBookingModelChange("nightly")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    formData.booking_model === "nightly"
                      ? "bg-white text-[#1A2E44] shadow-sm font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  🌙 Standard Nightly
                </button>
                <button
                  type="button"
                  onClick={() => handleBookingModelChange("hourly")}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    formData.booking_model === "hourly"
                      ? "bg-[#2BAE8E] text-white shadow-sm font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  ⏱️ Flexi / Hourly
                </button>
              </div>
            </div>

            {formData.booking_model === "hourly" && (
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <label className="block text-xs font-medium text-[#1A2E44]">Select Stay Duration Package</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "3h", label: "3 Hours", sub: "30% Rate" },
                    { id: "6h", label: "6 Hours", sub: "50% Rate" },
                    { id: "12h", label: "12 Hours", sub: "70% Rate" },
                    { id: "24h", label: "24 Hours", sub: "100% Rate" },
                  ].map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => handleHourlyPackageChange(pkg.id as any)}
                      className={`p-2 text-center rounded border text-xs transition-all ${
                        formData.hourly_package === pkg.id
                          ? "border-[#2BAE8E] bg-[#ECFDF5] text-[#065F46] font-semibold ring-1 ring-[#2BAE8E]"
                          : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="font-bold">{pkg.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{pkg.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-[#1A2E44]">First Name</label>
              <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#2BAE8E]" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[#1A2E44]">Last Name</label>
              <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#2BAE8E]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-[#1A2E44]">Phone Number</label>
              <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#2BAE8E]" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[#1A2E44]">Email Address</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#2BAE8E]" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium mb-1 text-[#1A2E44]">
                {formData.booking_model === "hourly" ? "Check-In Date & Time" : "Check-In Date"}
              </label>
              <input
                required
                type={formData.booking_model === "hourly" ? "datetime-local" : "date"}
                value={formData.check_in}
                onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, check_in: val }));
                  if (formData.booking_model === "hourly") {
                    const ci = new Date(val);
                    if (!isNaN(ci.getTime())) {
                      const co = new Date(ci.getTime() + formData.custom_hours * 3600 * 1000);
                      const coStr = new Date(co.getTime() - co.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                      setFormData(prev => ({ ...prev, check_in: val, check_out: coStr }));
                    }
                  }
                }}
                className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#2BAE8E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[#1A2E44]">
                {formData.booking_model === "hourly" ? "Check-Out Date & Time" : "Check-Out Date"}
              </label>
              <input
                required
                type={formData.booking_model === "hourly" ? "datetime-local" : "date"}
                value={formData.check_out}
                min={formData.booking_model === "nightly" ? new Date().toISOString().split("T")[0] : undefined}
                onChange={e => setFormData({...formData, check_out: e.target.value})}
                className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#2BAE8E]"
              />
            </div>
          </div>

          <div className="pt-2 border-t mt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#1A2E44]">Assign Available Room</label>
              {loadingUnits && <span className="text-[11px] text-[#2BAE8E] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking time slot availability...</span>}
            </div>
            <select required value={formData.unit_id} onChange={e => setFormData({...formData, unit_id: e.target.value})} className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#2BAE8E]">
              <option value="" disabled>
                {loadingUnits ? "Checking room availability..." : `Select Available Room (${unitsToDisplay.length} available)...`}
              </option>
              {unitsToDisplay.map((r: any) => (
                <option key={r.id} value={r.id}>
                  Unit {r.unit_label} — {r.layout_type || r.unit_type} ({r.attributes?.ac !== undefined ? (r.attributes.ac ? "AC" : "Non-AC") : "Standard"}) — ₹{r.base_rate}/night
                </option>
              ))}
            </select>
          </div>

          {/* Total Estimated Charges Box */}
          <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#065F46]">Total Estimated Charges</div>
              <div className="text-[11px] text-[#047857]">
                {formData.booking_model === "hourly" ? `Hourly Flexi-Stay (${formData.custom_hours} hrs package)` : "Standard Nightly Stay"}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[#065F46]">₹</span>
              <input
                required
                readOnly
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={e => setFormData({...formData, total_amount: e.target.value})}
                className="w-28 p-1.5 text-right font-bold text-base text-[#065F46] rounded border bg-white border-[#A7F3D0] focus:outline-none"
              />
            </div>
          </div>
          
          <div className="pt-2 border-t mt-2">
            <label className="block text-xs font-medium mb-1 text-[#1A2E44]">ID Document (KYC)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50" style={{ borderColor: "#E2E8F0" }}>
                <div className="flex flex-col items-center justify-center pt-3 pb-3 text-center">
                  <Upload className="w-4 h-4 text-gray-400 mb-1" />
                  <p className="text-[11px] text-gray-500">Click to upload Passport / ID</p>
                </div>
                <input type="file" className="hidden" onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFormData({...formData, id_document: e.target.files[0].name});
                  }
                }} />
              </label>
            </div>
            {formData.id_document && <p className="text-xs text-[#2BAE8E] mt-1 text-center">Selected: {formData.id_document}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-[#2BAE8E] hover:bg-[#239B7E] text-white">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DoorOpen className="w-4 h-4 mr-2" />} Complete Walk-In Check-In
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
