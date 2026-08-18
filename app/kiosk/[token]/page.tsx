"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Building2, User, CreditCard, Key, Loader2, CheckCircle, Camera, Upload, Shield, AlertTriangle, Clock, Phone, Mail } from "lucide-react";

type Session = any;
type Step = "welcome" | "identity" | "selfie" | "payment" | "key" | "done" | "expired" | "error";

export default function KioskPage() {
  const params = useParams();
  const token = params.token as string;
  const [session, setSession] = useState<Session>(null);
  const [step, setStep] = useState<Step>("welcome");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [idType, setIdType] = useState("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [selfieDataUrl, setSelfieDataUrl] = useState("");
  const DEMO_SELFIE = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e2e8f0"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9da3ab" font-size="14">Selfie Captured</text></svg>');
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/checkin/${token}`);
      if (!res.ok) throw new Error("Invalid or expired session");
      const data = await res.json();
      setSession(data);

      if (data.status === "expired") setStep("expired");
      else if (data.status === "completed") setStep("done");
      else if (data.status === "pending") setStep("welcome");
      else setStep(data.status === "identity_verified" ? "selfie" : data.status === "payment_pending" ? "payment" : "welcome");
    } catch (e: any) {
      setError(e.message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const updateSession = async (updates: Record<string, any>) => {
    const res = await fetch(`/api/checkin/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update session");
    return res.json();
  };

  const handleIdentitySubmit = async () => {
    setSubmitting(true);
    try {
      await updateSession({
        id_type: idType,
        id_number: idNumber,
        status: "identity_verified",
        id_verified: true,
        id_verified_at: new Date().toISOString(),
      });
      setStep("selfie");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelfieCapture = async () => {
    setSubmitting(true);
    try {
      await updateSession({
        selfie_url: selfieDataUrl,
        face_matched: true,
        status: "payment_pending",
      });
      setStep("payment");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    setSubmitting(true);
    try {
      const key = `DKEY-${Date.now().toString(36).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await updateSession({
        payment_method: paymentMethod,
        payment_status: "captured",
        payment_amount: session.payment_amount || session.total_amount || 0,
        status: "completed",
        digital_key_issued: true,
        digital_key_value: key,
        digital_key_expires: expiresAt,
      });
      setSession({ ...session, digital_key_value: key, status: "completed" });
      setStep("done");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-light)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-navy)" }} />
      </div>
    );
  }

  const steps = ["welcome", "identity", "selfie", "payment", "key", "done"];
  const currentIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, var(--color-navy) 0%, var(--color-info) 100%)" }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-3">
        <Building2 className="w-6 h-6 text-white" />
        <span className="text-white font-bold text-lg">{session?.property_name || "HostSphere Kiosk"}</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          {/* Progress */}
          {step !== "expired" && step !== "error" && (
            <div className="flex items-center gap-1 mb-6">
              {steps.map((s, i) => (
                <div key={s} className="flex-1 h-1 rounded-full" style={{
                  background: i <= currentIdx ? "var(--color-warning)" : "rgba(var(--color-on-dark-rgb),0.3)"
                }} />
              ))}
            </div>
          )}

          <div className="rounded-2xl p-6" style={{ background: "rgba(var(--color-on-dark-rgb),0.95)", backdropFilter: "blur(10px)" }}>
            {/* Welcome */}
            {step === "welcome" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: "var(--color-success-soft)" }}>
                  <User className="w-8 h-8" style={{ color: "var(--color-success)" }} />
                </div>
                <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Self Check-in</h1>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Welcome, <strong>{session?.guest_full_name || "Guest"}</strong>
                </p>
                <div className="text-xs space-y-1" style={{ color: "var(--color-text-faint)" }}>
                  <p>Check-in: {session?.bk_check_in}</p>
                  <p>Check-out: {session?.bk_check_out}</p>
                  {session?.source_booking_ref && <p>Booking: {session.source_booking_ref}</p>}
                </div>
                <button
                  onClick={() => setStep("identity")}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: "var(--color-navy)" }}
                >
                  Start Check-in
                </button>
              </div>
            )}

            {/* Identity Verification */}
            {step === "identity" && (
              <div className="space-y-4">
                <div className="text-center">
                  <Shield className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-info)" }} />
                  <h2 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Identity Verification</h2>
                  <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>Required for hotel registration</p>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>ID Type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2.5"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="pan">PAN Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>ID Number</label>
                  <input
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2.5"
                    style={{ borderColor: "var(--color-border)" }}
                    placeholder="Enter your ID number"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Upload ID (Front)</label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50" style={{ borderColor: "var(--color-border)" }}>
                    <Upload className="w-6 h-6 mx-auto mb-1" style={{ color: "var(--color-border-strong)" }} />
                    <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>Tap to upload or take photo</p>
                  </div>
                </div>

                <button
                  onClick={handleIdentitySubmit}
                  disabled={!idNumber || submitting}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: "var(--color-navy)" }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Continue"}
                </button>
              </div>
            )}

            {/* Selfie */}
            {step === "selfie" && (
              <div className="space-y-4">
                <div className="text-center">
                  <Camera className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-info)" }} />
                  <h2 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Take a Selfie</h2>
                  <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>For identity verification and face match</p>
                </div>

                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  {selfieDataUrl ? (
                    <img src={selfieDataUrl} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-12 h-12 mx-auto mb-2" style={{ color: "var(--color-border-strong)" }} />
                      <button
                        onClick={() => {
                          // Simulate camera capture for demo
                          setSelfieDataUrl(DEMO_SELFIE);
                        }}
                        className="text-xs px-4 py-2 rounded-lg text-white cursor-pointer"
                        style={{ background: "var(--color-info)" }}
                      >
                        Open Camera
                      </button>
                    </div>
                  )}
                </div>

                {selfieDataUrl && (
                  <button
                    onClick={handleSelfieCapture}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ background: "var(--color-navy)" }}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Verify & Continue"}
                  </button>
                )}
              </div>
            )}

            {/* Payment */}
            {step === "payment" && (
              <div className="space-y-4">
                <div className="text-center">
                  <CreditCard className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-info)" }} />
                  <h2 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Complete Payment</h2>
                  <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                    Total: <strong>₹{session?.payment_amount || session?.total_amount || 0}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {["card", "upi", "cash", "link"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-3 rounded-xl text-sm font-medium border-2 cursor-pointer transition-all ${
                        paymentMethod === m ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                      style={{ color: paymentMethod === m ? "var(--color-navy)" : "var(--color-text-muted)" }}
                    >
                      {m === "card" ? "💳 Card" : m === "upi" ? "📱 UPI" : m === "cash" ? "💵 Cash" : "🔗 Payment Link"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handlePayment}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: "var(--color-success)" }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Complete Payment & Check In"}
                </button>
              </div>
            )}

            {/* Done */}
            {step === "done" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: "var(--color-success-soft)" }}>
                  <CheckCircle className="w-8 h-8" style={{ color: "var(--color-success)" }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>You&apos;re All Set!</h2>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Welcome to {session?.property_name}</p>

                {session?.digital_key_value && (
                  <div className="p-4 rounded-xl" style={{ background: "var(--color-success-soft)" }}>
                    <Key className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-success)" }} />
                    <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>Digital Room Key</p>
                    <p className="text-lg font-mono font-bold mt-1" style={{ color: "var(--color-navy)" }}>{session.digital_key_value}</p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--color-text-faint)" }}>
                      Valid for 24 hours. Use on your phone or show at the door.
                    </p>
                  </div>
                )}

                <div className="text-xs space-y-1" style={{ color: "var(--color-text-faint)" }}>
                  <p>Check-in: {new Date().toLocaleString("en-IN")}</p>
                  <p>Check-out: {session?.bk_check_out}</p>
                </div>
              </div>
            )}

            {/* Expired */}
            {step === "expired" && (
              <div className="text-center space-y-4">
                <Clock className="w-12 h-12 mx-auto" style={{ color: "var(--color-warning)" }} />
                <h2 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Session Expired</h2>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Please scan the QR code again or contact the front desk.</p>
              </div>
            )}

            {/* Error */}
            {step === "error" && (
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 mx-auto" style={{ color: "var(--color-danger)" }} />
                <h2 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Something went wrong</h2>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] mt-4" style={{ color: "rgba(var(--color-on-dark-rgb),0.6)" }}>
            Powered by HostSphere • Digital Check-in
          </p>
        </div>
      </main>
    </div>
  );
}
