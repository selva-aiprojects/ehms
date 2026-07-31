"use client";

import { useState, useEffect } from "react";
import { Users, Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, UserCheck, LogOut, Phone, Mail, Car, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useVisitors } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-12 rounded animate-pulse mb-2" style={{ background: "var(--color-light)" }} />;
}

export default function WorkplaceVisitorsPage() {
  const { visitors, isLoading, isError, mutate } = useVisitors();
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    property_id: "", visitor_name: "", visitor_phone: "", visitor_email: "",
    host_employee_id: "", purpose: "", id_proof_type: "", id_proof_number: "", vehicle_number: "",
  });

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const displayVisitors = (visitors || []) as any[];

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          property_id: form.property_id || "00000000-0000-0000-0000-000000000000",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ type: "success", message: `${form.visitor_name} checked in` });
        setShowCheckInModal(false);
        setForm({ property_id: "", visitor_name: "", visitor_phone: "", visitor_email: "", host_employee_id: "", purpose: "", id_proof_type: "", id_proof_number: "", vehicle_number: "" });
        mutate();
      } else {
        setActionFeedback({ type: "error", message: data.error || "Failed to check in" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckOut(id: string) {
    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setActionFeedback({ type: "success", message: "Visitor checked out" });
        mutate();
      } else {
        setActionFeedback({ type: "error", message: "Failed to check out" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error" });
    }
  }

  const checkedIn = displayVisitors.filter((v: any) => !v.check_out).length;
  const checkedOut = displayVisitors.filter((v: any) => v.check_out).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Visitor Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Pre-register visitors and manage check-in/out</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowCheckInModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Pre-register Visitor
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.1)" : "rgba(var(--color-danger-rgb),0.08)",
            color: actionFeedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.2)" : "rgba(var(--color-danger-rgb),0.2)"}`,
          }}
        >
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-4" style={{ background: "var(--color-primary)" }}>
          <div className="text-2xl font-bold text-white">{displayVisitors.length}</div>
          <div className="text-xs text-white/80">Total Visitors</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--color-navy)" }}>
          <div className="text-2xl font-bold text-white">{checkedIn}</div>
          <div className="text-xs text-white/80">Checked In</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "var(--color-text-muted)" }}>
          <div className="text-2xl font-bold text-white">{checkedOut}</div>
          <div className="text-xs text-white/80">Checked Out</div>
        </div>
      </div>

      <Card>
        <CardHeader title="Visitor Log" subtitle={`${displayVisitors.length} record(s)`} />
        {isLoading ? (
          <div className="space-y-1">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-danger)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Failed to load visitors</p>
          </div>
        ) : displayVisitors.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No visitors yet</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowCheckInModal(true)}>
              <Plus className="w-3.5 h-3.5" /> Pre-register Visitor
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {displayVisitors.map((v: any) => {
              const checkInTime = v.check_in ? new Date(v.check_in).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
              const checkOutTime = v.check_out ? new Date(v.check_out).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
              return (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <UserCheck className="w-5 h-5 shrink-0" style={{ color: v.check_out ? "var(--color-text-muted)" : "var(--color-primary)" }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{v.visitor_name}</div>
                      <div className="text-xs flex items-center gap-2 flex-wrap" style={{ color: "var(--color-text-muted)" }}>
                        {v.visitor_phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{v.visitor_phone}</span>}
                        {v.purpose && <span>· {v.purpose}</span>}
                        {v.host?.first_name && <span>· Host: {v.host.first_name} {v.host.last_name || ""}</span>}
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>
                        In: {checkInTime} {v.check_out ? `· Out: ${checkOutTime}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={v.check_out ? "teal" : "amber"}>{v.check_out ? "Checked Out" : "Checked In"}</Badge>
                    {!v.check_out && (
                      <button onClick={() => handleCheckOut(v.id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "var(--color-text-faint)" }} title="Check out">
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-lg" style={{ color: "var(--color-navy)" }}>Pre-register Visitor</h3>
              <button onClick={() => setShowCheckInModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCheckIn} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Visitor Name *</label>
                <input type="text" required value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                  placeholder="e.g. Ankit Jain" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Phone</label>
                  <input type="tel" value={form.visitor_phone} onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                    placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Email</label>
                  <input type="email" value={form.visitor_email} onChange={(e) => setForm({ ...form, visitor_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                    placeholder="ankit@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Purpose of Visit</label>
                <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                  placeholder="e.g. Meeting with Priya" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>ID Proof Type</label>
                  <select value={form.id_proof_type} onChange={(e) => setForm({ ...form, id_proof_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "var(--color-border)" }}>
                    <option value="">None</option>
                    <option value="aadhar">Aadhar</option>
                    <option value="pan">PAN</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                    <option value="voter_id">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>ID Proof Number</label>
                  <input type="text" value={form.id_proof_number} onChange={(e) => setForm({ ...form, id_proof_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Vehicle Number</label>
                <input type="text" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }}
                  placeholder="e.g. MH 01 AB 1234" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCheckInModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Checking In</> : "Check In"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
