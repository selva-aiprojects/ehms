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
  
  const handleProcessPayment = () => {
    setProcessingPayment(true);
    setTimeout(() => {
      setFolio((prev: any) => ({
        ...prev,
        amountPaid: prev.totalAmount,
        balanceDue: 0,
        payments: [...prev.payments, {
          id: Math.random().toString(),
          payment_date: new Date().toISOString(),
          amount: prev.balanceDue,
          payment_method: paymentMethod,
          status: "completed"
        }]
      }));
      setProcessingPayment(false);
    }, 2000);
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      setLoading(true);
      fetch(`/api/invoices/folio?booking_id=${bookingId}`)
        .then(res => res.json())
        .then(data => {
          if (data.data) setFolio(data.data);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white shadow-2xl w-full max-w-xl h-full overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "#1A3C5E" }}>
              <Receipt className="w-5 h-5 text-[#2BAE8E]" /> Guest Folio
            </h2>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>{guestName} • {folio?.invoiceNumber || "Draft"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 bg-[#F5F7FA]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#2BAE8E]" />
              <p className="text-sm text-[#64748B]">Loading folio details...</p>
            </div>
          ) : folio ? (
            <div className="space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E2E8F0]">
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Total Charges</p>
                  <p className="text-2xl font-semibold text-[#1A3C5E]">₹{folio.totalAmount?.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E2E8F0]">
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Balance Due</p>
                  <p className="text-2xl font-bold text-[#E53E3E]">₹{folio.balanceDue?.toLocaleString()}</p>
                </div>
              </div>

              {/* Charges List */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className="px-4 py-3 bg-[#1A3C5E] text-white flex justify-between items-center">
                  <h3 className="font-medium text-sm">Itemized Charges</h3>
                  <button className="text-xs flex items-center gap-1 hover:text-[#4DB88A] transition-colors">
                    <Plus className="w-3 h-3" /> Post Charge
                  </button>
                </div>
                <div className="divide-y divide-[#E2E8F0]">
                  {folio.charges?.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[#64748B]">No charges posted yet.</div>
                  ) : (
                    folio.charges?.map((charge: any) => (
                      <div key={charge.id} className="p-4 flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-[#1A2E44]">{charge.description}</p>
                          <p className="text-xs text-[#64748B] mt-0.5">{new Date(charge.date).toLocaleString()} • {charge.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm text-[#1A2E44]">₹{charge.amount?.toLocaleString()}</p>
                          {charge.taxAmount > 0 && <p className="text-xs text-[#64748B]">+ ₹{charge.taxAmount} Tax</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payments List */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E2E8F0] bg-gray-50 flex justify-between items-center">
                  <h3 className="font-medium text-sm text-[#1A3C5E]">Payments Received</h3>
                </div>
                <div className="divide-y divide-[#E2E8F0]">
                  {folio.payments?.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#64748B]">No payments received.</div>
                  ) : (
                    folio.payments?.map((payment: any) => (
                      <div key={payment.id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#4DB88A]/10 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-[#2BAE8E]" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[#1A2E44]">{payment.payment_method}</p>
                            <p className="text-xs text-[#64748B]">{new Date(payment.payment_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="font-medium text-sm text-[#2BAE8E]">- ₹{payment.amount?.toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-[#64748B]">No folio details found for this booking.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E2E8F0] flex gap-3 flex-col sm:flex-row">
          <Button variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" /> Print Invoice
          </Button>
          
          {folio?.balanceDue > 0 ? (
            <div className="flex flex-1 gap-2">
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)}
                className="p-2 border rounded-md text-sm outline-none border-[#E2E8F0] text-[#1A2E44]"
              >
                <option value="card">Credit Card</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
              </select>
              <Button 
                className="flex-1 bg-[#1A3C5E] hover:bg-[#122b44] text-white"
                onClick={handleProcessPayment}
                disabled={processingPayment}
              >
                {processingPayment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Pay ₹{folio.balanceDue?.toLocaleString()}
              </Button>
            </div>
          ) : (
            <Button 
              className="flex-1 bg-[#2BAE8E] hover:bg-[#239B7E] text-white"
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
