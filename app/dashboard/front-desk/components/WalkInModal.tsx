"use client";

import { useState, useEffect } from "react";
import { X, DoorOpen, UserPlus, Loader2, Upload } from "lucide-react";
import Button from "@/components/ui/button";
import { useProperties, useRoomMatrix } from "@/lib/hooks";
import { toast } from "react-hot-toast";

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  propertyId?: string;
}

export default function WalkInModal({ isOpen, onClose, onSuccess, propertyId: propPropertyId }: WalkInModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    unit_id: "",
    check_out: "",
    total_amount: "",
    id_document: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const { rooms } = useRoomMatrix(propPropertyId);
  const vacantRooms = (rooms || []).filter((r: any) => r.status === "vacant");

  // Dynamic Pricing Calculation
  useEffect(() => {
    if (formData.unit_id && formData.check_out) {
      const selectedRoom = vacantRooms.find((r: any) => r.id === formData.unit_id);
      if (selectedRoom && selectedRoom.base_rate) {
        const checkInDate = new Date();
        const checkOutDate = new Date(formData.check_out);
        const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)));
        setFormData(prev => ({ ...prev, total_amount: (selectedRoom.base_rate * nights).toString() }));
      }
    }
  }, [formData.unit_id, formData.check_out, vacantRooms]);

  const { properties } = useProperties("hotel");
  const activePropertyId = propPropertyId || properties?.[0]?.id || (vacantRooms[0] as any)?.property_id || "26b9252e-c62b-426e-905b-21e979696ba8";

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
      const today = new Date().toISOString().split("T")[0];
      const resRes = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: activePropertyId,
          guest_id: guestId,
          unit_id: formData.unit_id,
          source: "direct",
          check_in: today,
          check_out: formData.check_out,
          total_amount: parseFloat(formData.total_amount),
        })
      });
      if (!resRes.ok) throw new Error("Failed to create reservation");
      const resData = await resRes.json();
      
      // 3. Mark as checked_in
      await fetch(`/api/reservations/${resData.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "checked_in" })
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error processing walk-in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "#E2E8F0" }}>
          <div>
            <h2 className="text-lg font-semibold text-[#1A3C5E] flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#2BAE8E]" /> Walk-In Check-In</h2>
            <p className="text-sm text-[#64748B]">Create guest and assign a room instantly.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
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
          
          <div className="pt-2 border-t mt-2">
            <label className="block text-xs font-medium mb-1 text-[#1A2E44]">Assign Available Room</label>
            <select required value={formData.unit_id} onChange={e => setFormData({...formData, unit_id: e.target.value})} className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#2BAE8E]">
              <option value="" disabled>Select Vacant Room...</option>
              {vacantRooms.map((r: any) => (
                <option key={r.id} value={r.id}>
                  Unit {r.unit_label} — {r.layout_type || r.unit_type} ({r.attributes?.ac !== undefined ? (r.attributes.ac ? "AC" : "Non-AC") : "Standard"}) — ₹{r.base_rate}/night
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-[#1A2E44]">Check-Out Date</label>
              <input required type="date" value={formData.check_out} min={new Date().toISOString().split("T")[0]} onChange={e => setFormData({...formData, check_out: e.target.value})} className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#2BAE8E]" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[#1A2E44]">Total Amount (Auto-Calculated)</label>
              <input required readOnly type="number" step="0.01" value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: e.target.value})} className="w-full p-2.5 text-sm rounded-lg border bg-gray-50 focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
            </div>
          </div>
          
          <div className="pt-2 border-t mt-2">
            <label className="block text-xs font-medium mb-1 text-[#1A2E44]">ID Document (KYC)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50" style={{ borderColor: "#E2E8F0" }}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Click to upload Passport / ID</p>
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
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DoorOpen className="w-4 h-4 mr-2" />} Complete Walk-In
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
