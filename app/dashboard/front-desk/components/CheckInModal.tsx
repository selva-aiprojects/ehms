"use client";

import { useState } from "react";
import { X, CheckCircle, Car, ShieldCheck, DoorOpen, Loader2 } from "lucide-react";
import Button from "@/components/ui/button";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  roomId: string;
  guestName: string;
  unitLabel: string;
  onConfirm: (data: any) => Promise<void>;
}

export default function CheckInModal({ isOpen, onClose, bookingId, roomId, guestName, unitLabel, onConfirm }: CheckInModalProps) {
  const [activeTab, setActiveTab] = useState<"checklist" | "parking">("checklist");
  const [checklist, setChecklist] = useState({ idVerified: false, roomCleaned: false, keysIssued: false });
  const [parking, setParking] = useState({ vehicleNumber: "", slotNumber: "" });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const allChecked = checklist.idVerified && checklist.roomCleaned && checklist.keysIssued;

  const handleSubmit = async () => {
    setSubmitting(true);
    await onConfirm({
      bookingId,
      roomId,
      checklistItems: checklist,
      vehicleNumber: parking.vehicleNumber,
      parkingSlot: parking.slotNumber
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#1A3C5E" }}>Check-In: {guestName}</h2>
            <p className="text-sm" style={{ color: "#64748B" }}>Room {unitLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "#E2E8F0" }}>
          <button
            onClick={() => setActiveTab("checklist")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "checklist" ? "border-b-2" : ""}`}
            style={{ 
              borderColor: activeTab === "checklist" ? "#2BAE8E" : "transparent",
              color: activeTab === "checklist" ? "#2BAE8E" : "#64748B" 
            }}
          >
            <ShieldCheck className="w-4 h-4 inline-block mr-2 mb-0.5" /> SOP Checklist
          </button>
          <button
            onClick={() => setActiveTab("parking")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "parking" ? "border-b-2" : ""}`}
            style={{ 
              borderColor: activeTab === "parking" ? "#2BAE8E" : "transparent",
              color: activeTab === "parking" ? "#2BAE8E" : "#64748B" 
            }}
          >
            <Car className="w-4 h-4 inline-block mr-2 mb-0.5" /> Parking
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === "checklist" ? (
            <div className="space-y-4">
              <div 
                className="flex items-center p-4 rounded-lg cursor-pointer transition-colors"
                style={{ background: checklist.idVerified ? "rgba(43,174,142,0.1)" : "#F5F7FA", border: "1px solid", borderColor: checklist.idVerified ? "#2BAE8E" : "transparent" }}
                onClick={() => setChecklist(prev => ({ ...prev, idVerified: !prev.idVerified }))}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${checklist.idVerified ? "border-[#2BAE8E] bg-[#2BAE8E]" : "border-gray-300"}`}>
                  {checklist.idVerified && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: "#1A2E44" }}>ID Verification & Registration</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Guest identity proof collected and verified.</p>
                </div>
              </div>

              <div 
                className="flex items-center p-4 rounded-lg cursor-pointer transition-colors"
                style={{ background: checklist.roomCleaned ? "rgba(43,174,142,0.1)" : "#F5F7FA", border: "1px solid", borderColor: checklist.roomCleaned ? "#2BAE8E" : "transparent" }}
                onClick={() => setChecklist(prev => ({ ...prev, roomCleaned: !prev.roomCleaned }))}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${checklist.roomCleaned ? "border-[#2BAE8E] bg-[#2BAE8E]" : "border-gray-300"}`}>
                  {checklist.roomCleaned && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: "#1A2E44" }}>Room Readiness</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Housekeeping has marked the room as Vacant & Clean.</p>
                </div>
              </div>

              <div 
                className="flex items-center p-4 rounded-lg cursor-pointer transition-colors"
                style={{ background: checklist.keysIssued ? "rgba(43,174,142,0.1)" : "#F5F7FA", border: "1px solid", borderColor: checklist.keysIssued ? "#2BAE8E" : "transparent" }}
                onClick={() => setChecklist(prev => ({ ...prev, keysIssued: !prev.keysIssued }))}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${checklist.keysIssued ? "border-[#2BAE8E] bg-[#2BAE8E]" : "border-gray-300"}`}>
                  {checklist.keysIssued && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: "#1A2E44" }}>Key Handover</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Keycard programmed and handed to the guest.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "#64748B" }}>Allocate a parking slot for the guest's vehicle. Leave blank if not required.</p>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Vehicle Number (License Plate)</label>
                <input 
                  type="text" 
                  value={parking.vehicleNumber}
                  onChange={(e) => setParking({ ...parking, vehicleNumber: e.target.value })}
                  placeholder="e.g. MH-12-AB-1234" 
                  className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: "#E2E8F0", focusRingColor: "#2BAE8E" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Slot / Valet Number</label>
                <input 
                  type="text" 
                  value={parking.slotNumber}
                  onChange={(e) => setParking({ ...parking, slotNumber: e.target.value })}
                  placeholder="e.g. P-102" 
                  className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1"
                  style={{ borderColor: "#E2E8F0" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: "1px solid #E2E8F0", background: "#F5F7FA" }}>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!allChecked || submitting}
            style={{ background: !allChecked ? "#A0AABF" : "#2BAE8E", color: "white" }}
          >
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing</> : <><DoorOpen className="w-4 h-4 mr-2" /> Complete Check-In</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
