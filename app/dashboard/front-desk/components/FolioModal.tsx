"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Download, Loader2, Plus, Receipt, CheckCircle } from "lucide-react";
import Button from "@/components/ui/button";

interface FolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  guestName: string;
  onCheckout?: (bookingId: string) => void;
}

export default function FolioModal({ isOpen, onClose, bookingId, guestName, onCheckout }: FolioModalProps) {
  const [loading, setLoading] = useState(true);
  const [folio, setFolio] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showPostCharge, setShowPostCharge] = useState(false);
  const [chargeType, setChargeType] = useState("room_service");
  const [chargeDesc, setChargeDesc] = useState("");
  const [chargePrice, setChargePrice] = useState("");
  const [chargeQty, setChargeQty] = useState("1");
  const [chargeTax, setChargeTax] = useState("5");
  const [posting, setPosting] = useState(false);

  const fetchFolio = () => {
    if (!bookingId) return;
    setLoading(true);
    fetch(`/api/invoices/folio?booking_id=${bookingId}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) setFolio(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchFolio();
    }
  }, [isOpen, bookingId]);

  const handleProcessPayment = async () => {
    if (!bookingId || !folio) return;
    const amountToPay = folio.balanceDue;
    if (amountToPay <= 0) return;

    setProcessingPayment(true);
    try {
      const res = await fetch("/api/invoices/folio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          amount: amountToPay,
          payment_method: paymentMethod,
        }),
      });
      if (res.ok) {
        fetchFolio();
      } else {
        const err = await res.json();
        alert(err.error || "Payment processing failed");
      }
    } catch (e) {
      console.error(e);
      alert("Payment processing failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePostCharge = async () => {
    if (!bookingId || !chargePrice || isNaN(Number(chargePrice)) || Number(chargePrice) <= 0) {
      alert("Please enter a valid price amount.");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch("/api/invoices/folio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          charge_type: chargeType,
          description: chargeDesc || chargeType.replace("_", " ").toUpperCase(),
          unit_price: Number(chargePrice),
          quantity: Number(chargeQty) || 1,
          tax_rate: Number(chargeTax) || 0,
        }),
      });
      if (res.ok) {
        setShowPostCharge(false);
        setChargeDesc("");
        setChargePrice("");
        setChargeQty("1");
        fetchFolio();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to post charge");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to post charge");
    } finally {
      setPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white shadow-2xl w-full max-w-xl h-full overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--color-navy)" }}>
              <Receipt className="w-5 h-5 text-[var(--color-primary)]" /> Guest Folio
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{guestName} • {folio?.invoiceNumber || "Draft"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 bg-[var(--color-light)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
              <p className="text-sm text-[var(--color-text-muted)]">Loading folio details...</p>
            </div>
          ) : folio ? (
            <div className="space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[var(--color-border)]">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Total Charges</p>
                  <p className="text-2xl font-semibold text-[var(--color-navy)]">₹{folio.totalAmount?.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[var(--color-border)]">
                  <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Balance Due</p>
                  <p className="text-2xl font-bold text-[var(--color-danger)]">₹{folio.balanceDue?.toLocaleString()}</p>
                </div>
              </div>

              {/* Charges List */}
              <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
                <div className="px-4 py-3 bg-[var(--color-navy)] text-white flex justify-between items-center">
                  <h3 className="font-medium text-sm">Itemized Charges</h3>
                  <button 
                    onClick={() => setShowPostCharge(!showPostCharge)}
                    className="text-xs flex items-center gap-1 hover:text-[var(--color-primary-dark)] transition-colors"
                  >
                    <Plus className="w-3 h-3" /> {showPostCharge ? "Cancel" : "Post Charge"}
                  </button>
                </div>

                {showPostCharge && (
                  <div className="p-4 bg-[var(--color-light)] border-b border-[var(--color-border)] space-y-3 animate-in fade-in duration-200">
                    <h4 className="text-xs font-semibold text-[var(--color-navy)] uppercase tracking-wider">Post New Charge</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1">Charge Type</label>
                        <select
                          value={chargeType}
                          onChange={(e) => setChargeType(e.target.value)}
                          className="w-full text-xs p-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        >
                          <option value="room_service">Room Service</option>
                          <option value="laundry">Laundry Service</option>
                          <option value="restaurant">Restaurant / F&B</option>
                          <option value="bar">Bar & Lounge</option>
                          <option value="minibar">Minibar Consumption</option>
                          <option value="spa">Spa & Wellness</option>
                          <option value="transport">Transportation / Taxi</option>
                          <option value="damage">Property Damage / Loss</option>
                          <option value="early_checkin">Early Check-in Fee</option>
                          <option value="late_checkout">Late Check-out Fee</option>
                          <option value="other">Other Charge</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1">Description (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Dry cleaning 3 shirts"
                          value={chargeDesc}
                          onChange={(e) => setChargeDesc(e.target.value)}
                          className="w-full text-xs p-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1">Unit Price (₹)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={chargePrice}
                          onChange={(e) => setChargePrice(e.target.value)}
                          className="w-full text-xs p-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1">Qty</label>
                          <input
                            type="number"
                            value={chargeQty}
                            onChange={(e) => setChargeQty(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1">Tax (%)</label>
                          <input
                            type="number"
                            value={chargeTax}
                            onChange={(e) => setChargeTax(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => setShowPostCharge(false)}>Cancel</Button>
                      <Button variant="primary" size="sm" onClick={handlePostCharge} disabled={posting}>
                        {posting ? "Posting..." : "Add to Folio"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-[var(--color-border)]">
                  {folio.charges?.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">No charges posted yet.</div>
                  ) : (
                    folio.charges?.map((charge: any) => (
                      <div key={charge.id} className="p-4 flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-[var(--color-text)]">{charge.description}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{new Date(charge.date).toLocaleString()} • {charge.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm text-[var(--color-text)]">₹{charge.amount?.toLocaleString()}</p>
                          {charge.taxAmount > 0 && <p className="text-xs text-[var(--color-text-muted)]">+ ₹{charge.taxAmount} Tax</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payments List */}
              <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--color-border)] bg-gray-50 flex justify-between items-center">
                  <h3 className="font-medium text-sm text-[var(--color-navy)]">Payments Received</h3>
                </div>
                <div className="divide-y divide-[var(--color-border)]">
                  {folio.payments?.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">No payments received.</div>
                  ) : (
                    folio.payments?.map((payment: any) => (
                      <div key={payment.id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[color:var(--color-primary-dark)]/10 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[var(--color-text)]">{payment.payment_method}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{new Date(payment.payment_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="font-medium text-sm text-[var(--color-primary)]">- ₹{payment.amount?.toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-[var(--color-text-muted)]">No folio details found for this booking.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[var(--color-border)] flex gap-3 flex-col sm:flex-row">
          <Button variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" /> Print Invoice
          </Button>
          
          {folio?.balanceDue > 0 ? (
            <div className="flex flex-1 gap-2">
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)}
                className="p-2 border rounded-md text-sm outline-none border-[var(--color-border)] text-[var(--color-text)]"
              >
                <option value="card">Credit Card</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
              </select>
              <Button 
                className="flex-1 bg-[var(--color-navy)] hover:bg-[var(--color-dark-navy)] text-white"
                onClick={handleProcessPayment}
                disabled={processingPayment}
              >
                {processingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Pay ₹{folio.balanceDue?.toLocaleString()}
              </Button>
            </div>
          ) : (
            <Button 
              className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
              onClick={() => {
                if (bookingId && onCheckout) {
                  onCheckout(bookingId);
                  onClose();
                }
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Settle & Check-Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
