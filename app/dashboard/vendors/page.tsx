"use client";

import { useState, useEffect } from "react";
import {
  Building2, Plus, Edit2, Search, ChevronDown, ChevronRight, Phone, Mail,
  User, CheckCircle, AlertCircle, X, Loader2, RefreshCw, ClipboardList,
  FileText, ShieldCheck, ShieldAlert, Star, Eye, EyeOff
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useVendorsList, useProperties } from "@/lib/hooks";

const SERVICE_TYPE_OPTIONS = [
  "housekeeping", "laundry", "hvac", "electrical", "plumbing",
  "pest_control", "landscaping", "security", "catering", "it_support",
  "elevator", "fire_safety", "civil", "painting",
];

const STATUS_OPTIONS = ["pending", "approved", "suspended"];

export default function VendorsPage() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVendor, setEditVendor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [showServicesForm, setShowServicesForm] = useState(false);

  const { vendors = [], isLoading, mutate } = useVendorsList({
    search: searchQuery || undefined,
    status: filterStatus || undefined,
  });
  const { properties = [] } = useProperties();

  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    gst_number: "",
    property_id: "",
    status: "pending",
    is_compliant: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    service_type: "",
    description: "",
    rate: "",
    rate_unit: "per_visit",
  });
  const [isServiceSubmitting, setIsServiceSubmitting] = useState(false);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  function resetForm() {
    setFormData({
      company_name: "", contact_person: "", email: "", phone: "",
      gst_number: "", property_id: "", status: "pending", is_compliant: false,
    });
  }

  function handleEdit(vendor: any) {
    setEditVendor(vendor);
    setFormData({
      company_name: vendor.name || "",
      contact_person: vendor.contact_person || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      gst_number: vendor.gst_number || "",
      property_id: vendor.property_id || "",
      status: vendor.status || "pending",
      is_compliant: vendor.is_compliant || false,
    });
    setShowAddModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setActionFeedback(null);
    try {
      const isEdit = !!editVendor;
      const url = isEdit ? `/api/vendors/${editVendor.id}` : "/api/vendors";
      const method = isEdit ? "PUT" : "POST";

      const body: Record<string, any> = { ...formData };
      if (!isEdit) {
        delete (body as any).id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ type: "success", message: isEdit ? "Vendor updated successfully" : "Vendor created successfully" });
        setShowAddModal(false);
        setEditVendor(null);
        resetForm();
        mutate();
      } else {
        setActionFeedback({ type: "error", message: data.error || "Operation failed" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddService(vendorId: string) {
    if (!serviceForm.service_type) return;
    setIsServiceSubmitting(true);
    try {
      const res = await fetch("/api/vendors/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          service_type: serviceForm.service_type,
          description: serviceForm.description || null,
          rate: serviceForm.rate ? parseFloat(serviceForm.rate) : null,
          rate_unit: serviceForm.rate_unit || null,
        }),
      });
      if (res.ok) {
        setActionFeedback({ type: "success", message: "Service added" });
        setServiceForm({ service_type: "", description: "", rate: "", rate_unit: "per_visit" });
        setShowServicesForm(false);
        mutate();
      } else {
        const err = await res.json();
        setActionFeedback({ type: "error", message: err.error || "Failed to add service" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error" });
    } finally {
      setIsServiceSubmitting(false);
    }
  }

  const totalVendors = vendors.length || 0;
  const activeCount = vendors.filter((v: any) => v.status === "approved").length;
  const pendingCount = vendors.filter((v: any) => v.status === "pending").length;
  const nonCompliantCount = vendors.filter((v: any) => !v.is_compliant).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Vendors</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage all vendors, services, and purchase orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setEditVendor(null); resetForm(); setShowAddModal(true); }}>
            <Plus className="w-3.5 h-3.5" /> Add Vendor
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }}>
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
          }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.1)" }}>
              <Building2 className="w-5 h-5" style={{ color: "#1A3C5E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Total Vendors</p>
              <p className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{totalVendors}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(43,174,142,0.1)" }}>
              <ShieldCheck className="w-5 h-5" style={{ color: "#2BAE8E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Active</p>
              <p className="text-lg font-bold" style={{ color: "#2BAE8E" }}>{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.1)" }}>
              <ClipboardList className="w-5 h-5" style={{ color: "#F5A623" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Pending</p>
              <p className="text-lg font-bold" style={{ color: "#F5A623" }}>{pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(229,62,62,0.1)" }}>
              <ShieldAlert className="w-5 h-5" style={{ color: "#E53E3E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Non-Compliant</p>
              <p className="text-lg font-bold" style={{ color: "#E53E3E" }}>{nonCompliantCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, contact, email..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
        </div>
        <div className="flex items-center gap-1">
          {["", ...STATUS_OPTIONS].map((s) => (
            <button key={s || "all"} onClick={() => setFilterStatus(s)}
              className="px-2.5 py-1 text-[10px] font-medium rounded transition-all"
              style={{ background: filterStatus === s ? "#1A3C5E" : "#F5F7FA", color: filterStatus === s ? "#FFFFFF" : "#64748B" }}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !vendors.length ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#94A3B8" }} /></div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#94A3B8" }} />
          <p className="text-sm" style={{ color: "#64748B" }}>No vendors found. Add your first vendor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((v: any) => {
            const isExpanded = expandedVendor === v.id;
            return (
              <Card key={v.id} padding={false}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => setExpandedVendor(isExpanded ? null : v.id)}
                        className="p-0.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "#94A3B8" }}>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.08)" }}>
                        <Building2 className="w-4.5 h-4.5" style={{ color: "#1A3C5E" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm" style={{ color: "#1A2E44" }}>{v.name}</span>
                          <Badge variant={v.status === "approved" ? "teal" : v.status === "pending" ? "amber" : "red"}>
                            {v.status}
                          </Badge>
                          <Badge variant={v.is_compliant ? "teal" : "red"}>
                            {v.is_compliant ? "Compliant" : "Non-Compliant"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#64748B" }}>
                          {v.contact_person && (
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{v.contact_person}</span>
                          )}
                          {v.phone && (
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.phone}</span>
                          )}
                          {v.email && (
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{v.email}</span>
                          )}
                          {v.category && (
                            <Badge variant="gray">{v.category}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(v)}
                        className="p-1.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold" style={{ color: "#1A3C5E" }}>
                        Services ({v.services?.length || 0})
                      </h4>
                      <button onClick={() => setShowServicesForm(!showServicesForm)}
                        className="text-xs font-medium flex items-center gap-1" style={{ color: "#2BAE8E" }}>
                        <Plus className="w-3 h-3" /> Add Service
                      </button>
                    </div>

                    {showServicesForm && (
                      <div className="mb-3 p-3 rounded-lg border" style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}>
                        <div className="grid grid-cols-4 gap-2">
                          <select value={serviceForm.service_type}
                            onChange={(e) => setServiceForm({ ...serviceForm, service_type: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                            <option value="">Select type</option>
                            {SERVICE_TYPE_OPTIONS.map((st) => (
                              <option key={st} value={st}>{st.replace(/_/g, " ")}</option>
                            ))}
                          </select>
                          <input type="text" value={serviceForm.description}
                            onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                            placeholder="Description"
                            className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
                          <input type="number" value={serviceForm.rate}
                            onChange={(e) => setServiceForm({ ...serviceForm, rate: e.target.value })}
                            placeholder="Rate"
                            className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
                          <div className="flex gap-1">
                            <select value={serviceForm.rate_unit}
                              onChange={(e) => setServiceForm({ ...serviceForm, rate_unit: e.target.value })}
                              className="flex-1 px-2 py-1.5 text-xs rounded-lg border outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                              <option value="per_visit">Per Visit</option>
                              <option value="per_hour">Per Hour</option>
                              <option value="per_room">Per Room</option>
                            </select>
                            <Button size="sm" onClick={() => handleAddService(v.id)} disabled={isServiceSubmitting || !serviceForm.service_type}>
                              {isServiceSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {v.services?.length > 0 ? (
                      <div className="space-y-1.5">
                        {v.services.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between text-xs py-1 px-2 rounded"
                            style={{ background: "#FFFFFF" }}>
                            <span className="font-medium" style={{ color: "#1A2E44" }}>
                              {s.service_type?.replace(/_/g, " ")}
                            </span>
                            <span style={{ color: "#64748B" }}>
                              {s.rate ? `₹${parseFloat(s.rate).toLocaleString()}` : "—"} {s.rate_unit ? `/ ${s.rate_unit.replace("_", " ")}` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: "#94A3B8" }}>No services configured for this vendor.</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>
                {editVendor ? "Edit Vendor" : "Add New Vendor"}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditVendor(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Company Name *</label>
                  <input type="text" required value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="ABC Services Pvt Ltd" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Contact Person</label>
                  <input type="text" value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="John Doe" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Email</label>
                  <input type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="contact@abc.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Phone</label>
                  <input type="text" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="+91-9876543210" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>GST Number</label>
                  <input type="text" value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="22AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Property</label>
                  <select value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Select Property</option>
                    {(properties || []).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Status</label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Compliance</label>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "#64748B" }}>
                      <input type="checkbox" checked={formData.is_compliant}
                        onChange={(e) => setFormData({ ...formData, is_compliant: e.target.checked })}
                        className="rounded" />
                      Compliant with all requirements
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddModal(false); setEditVendor(null); }}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : editVendor ? "Update Vendor" : "Create Vendor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
