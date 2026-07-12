"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, Car, ShieldCheck, DoorOpen, Loader2, Sparkles, Smartphone, Copy, RefreshCw, Key } from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "react-hot-toast";

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
  const [activeTab, setActiveTab] = useState<"checklist" | "parking" | "upsell">("checklist");
  const [checklist, setChecklist] = useState({ idVerified: false, roomCleaned: false, keysIssued: false });
  const [parking, setParking] = useState({ vehicleNumber: "", slotNumber: "" });
  const [upsells, setUpsells] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Real Digital Smart Key State
  const [digitalKeyIssuing, setDigitalKeyIssuing] = useState(false);
  const [smartKey, setSmartKey] = useState<any>(null);

  useEffect(() => {
    if (isOpen && bookingId) {
      // Check if smart key already exists for this booking
      fetch(`/api/reservations/${bookingId}/smart-key`)
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setSmartKey(data.data);
            setChecklist(prev => ({ ...prev, keysIssued: true }));
          }
        })
        .catch(err => console.error("Could not check smart key status:", err));
    }
  }, [isOpen, bookingId]);

  const issueDigitalKey = async () => {
    if (!bookingId) return;
    setDigitalKeyIssuing(true);
    try {
      const res = await fetch(`/api/reservations/${bookingId}/smart-key`, {
        method: "POST"
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate digital key");
      
      setSmartKey(json.data);
      setChecklist(prev => ({ ...prev, keysIssued: true }));
      toast.success(json.message || "Smart Key PIN generated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Error issuing digital key");
    } finally {
      setDigitalKeyIssuing(false);
    }
  };

  const regenerateDigitalKey = async () => {
    if (!bookingId) return;
    setDigitalKeyIssuing(true);
    try {
      const res = await fetch(`/api/reservations/${bookingId}/smart-key`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate" })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to regenerate digital key");
      
      setSmartKey(json.data);
      toast.success(json.message || "Fresh PIN generated!");
    } catch (err: any) {
      toast.error(err?.message || "Error regenerating digital key");
    } finally {
      setDigitalKeyIssuing(false);
    }
  };

  if (!isOpen) return null;

  const allChecked = checklist.idVerified && checklist.roomCleaned && checklist.keysIssued;

  const handleSubmit = async () => {
    setSubmitting(true);
    await onConfirm({
      bookingId,
      roomId,
      checklistItems: checklist,
      vehicleNumber: parking.vehicleNumber,
      parkingSlot: parking.slotNumber,
      upsells,
      digitalPin: smartKey?.pin_code
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
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
          <button
            onClick={() => setActiveTab("upsell")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "upsell" ? "border-b-2" : ""}`}
            style={{ 
              borderColor: activeTab === "upsell" ? "#2BAE8E" : "transparent",
              color: activeTab === "upsell" ? "#2BAE8E" : "#64748B" 
            }}
          >
            <Sparkles className="w-4 h-4 inline-block mr-2 mb-0.5" /> Upsell
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
                className="p-4 rounded-lg transition-colors space-y-3"
                style={{ background: checklist.keysIssued ? "rgba(43,174,142,0.1)" : "#F5F7FA", border: "1px solid", borderColor: checklist.keysIssued ? "#2BAE8E" : "transparent" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${checklist.keysIssued ? "border-[#2BAE8E] bg-[#2BAE8E]" : "border-gray-300"}`}>
                      {checklist.keysIssued && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "#1A2E44" }}>Key Handover (Smart Keyless Access)</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Issue Salto Digital Key PIN or physical card.</p>
                    </div>
                  </div>
                  <div>
                    {!checklist.keysIssued && !smartKey ? (
                      <Button onClick={issueDigitalKey} disabled={digitalKeyIssuing} size="sm" style={{ background: "#1A3C5E", color: "white" }}>
                        {digitalKeyIssuing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5 mr-1.5" />}
                        Issue Digital Key
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#2BAE8E] text-white flex items-center gap-1">
                        <Key className="w-3 h-3" /> Key Issued
                      </span>
                    )}
                  </div>
                </div>

                {/* Digital Key Display Box */}
                {smartKey && (
                  <div className="mt-2 p-3 bg-white border border-[#2BAE8E] rounded-lg shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1A3C5E]">
                        <Smartphone className="w-3.5 h-3.5 text-[#2BAE8E]" /> {smartKey.lock_vendor || "Salto PIN Lock"}
                      </div>
                      <div className="text-xl font-mono font-bold tracking-widest text-[#065F46] mt-0.5">
                        {smartKey.pin_code}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Valid until: {smartKey.valid_to ? new Date(smartKey.valid_to).toLocaleDateString() : "Check-out"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(smartKey.pin_code);
                          toast.success("PIN copied to clipboard!");
                        }}
                        className="h-7 px-2 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy PIN
                      </Button>
                      <button
                        type="button"
                        onClick={regenerateDigitalKey}
                        disabled={digitalKeyIssuing}
                        title="Regenerate fresh PIN"
                        className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${digitalKeyIssuing ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "parking" ? (
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
                  style={{ borderColor: "#E2E8F0" }}
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
          ) : activeTab === "upsell" ? (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "#64748B" }}>Offer additional services to enhance the guest's stay. Charges will be added to the folio.</p>
              
              <div className="space-y-3">
                {[
                  { id: "early_checkin", title: "Early Check-in Fee", desc: "Arrived before 2:00 PM standard check-in time", price: "₹1,000" },
                  { id: "premium_wifi", title: "Premium Wi-Fi Access", desc: "High-speed internet for up to 4 devices", price: "₹500" },
                  { id: "room_upgrade", title: "Room Upgrade", desc: "Upgrade to next available premium category", price: "₹3,000" }
                ].map(offer => (
                  <div 
                    key={offer.id} 
                    className="flex items-center justify-between p-4 rounded-lg cursor-pointer border transition-colors"
                    style={{ 
                      borderColor: upsells.includes(offer.id) ? "#2BAE8E" : "#E2E8F0",
                      background: upsells.includes(offer.id) ? "rgba(43,174,142,0.05)" : "#FFFFFF"
                    }}
                    onClick={() => {
                      if (upsells.includes(offer.id)) setUpsells(upsells.filter(u => u !== offer.id));
                      else setUpsells([...upsells, offer.id]);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${upsells.includes(offer.id) ? "border-[#2BAE8E] bg-[#2BAE8E]" : "border-gray-300"}`}>
                        {upsells.includes(offer.id) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-[#1A2E44]">{offer.title}</p>
                        <p className="text-xs text-[#64748B]">{offer.desc}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm text-[#1A3C5E]">{offer.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
