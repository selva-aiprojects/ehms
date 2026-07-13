"use client";

import { useState, useEffect } from "react";
import { Wrench, Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, Search, Building2, DollarSign, IndianRupee, BadgePercent } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useVendorServices, useVendorsList } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-12 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

export default function VendorServicesPage() {
  const [filterVendor, setFilterVendor] = useState("");
  const { vendors = [] } = useVendorsList();
  const { services, isLoading, mutate } = useVendorServices(filterVendor || undefined);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ vendor_id: "", service_type: "", description: "", rate: "", rate_unit: "" });

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const displayData = (services || []) as any[];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendors/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: form.vendor_id,
          service_type: form.service_type,
          description: form.description || null,
          rate: form.rate ? parseFloat(form.rate) : null,
          rate_unit: form.rate_unit || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ type: "success", message: "Service added" });
        setShowModal(false);
        setForm({ vendor_id: "", service_type: "", description: "", rate: "", rate_unit: "" });
        mutate();
      } else {
        setActionFeedback({ type: "error", message: data.error || "Failed to add service" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Vendor Services</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Services offered by approved vendors</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Service
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)",
            color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}`,
          }}
        >
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <Card>
        <CardHeader
          title="Service Catalog"
          subtitle={`${displayData.length} service(s)`}
          action={
            <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0", color: "#1A2E44" }}>
              <option value="">All Vendors</option>
              {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          }
        />
        {isLoading ? (
          <div className="space-y-1">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-8">
            <Wrench className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No services registered</p>
          </div>
        ) : (
          <div className="space-y-1">
            {displayData.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Wrench className="w-5 h-5 shrink-0" style={{ color: "#1A3C5E" }} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{s.service_type?.replace("_", " ")}</div>
                    <div className="text-xs" style={{ color: "#64748B" }}>{s.description || "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.rate && (
                    <span className="text-sm font-semibold flex items-center" style={{ color: "#1A2E44" }}>
                      <IndianRupee className="w-3.5 h-3.5 inline mr-0.5" />{parseFloat(s.rate).toLocaleString()}{s.rate_unit ? `/${s.rate_unit}` : ""}
                    </span>
                  )}
                  <Badge variant="gray">{s.service_type}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>Add Vendor Service</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Vendor *</label>
                <select required value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  <option value="">Select Vendor</option>
                  {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Service Type *</label>
                <select required value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  <option value="">Select Type</option>
                  {["housekeeping","laundry","hvac","electrical","plumbing","pest_control","landscaping","security","catering","it_support","elevator","fire_safety","civil","painting"].map(t => (
                    <option key={t} value={t}>{t.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Rate (₹)</label>
                  <input type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Rate Unit</label>
                  <select value={form.rate_unit} onChange={(e) => setForm({ ...form, rate_unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">—</option>
                    <option value="hour">Per Hour</option>
                    <option value="visit">Per Visit</option>
                    <option value="sqft">Per Sq.Ft</option>
                    <option value="month">Per Month</option>
                    <option value="unit">Per Unit</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : "Add Service"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
