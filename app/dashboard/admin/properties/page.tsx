"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Edit2, Settings, MapPin, Phone, Mail, Star, ChevronRight, Loader2, CheckCircle, AlertCircle, RefreshCw, Search, X, Hotel, Home, Briefcase, Building, Eye, EyeOff } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useProperties } from "@/lib/hooks";

const VERTICAL_ICONS: Record<string, any> = {
  hotel: Hotel,
  service_apartment: Building,
  rental_apartment: Home,
  workplace: Briefcase,
};

const VERTICAL_LABELS: Record<string, string> = {
  hotel: "Hotel",
  service_apartment: "Service Apt",
  rental_apartment: "Rental",
  workplace: "Workplace",
};

const BOOKING_LABELS: Record<string, string> = {
  nightly: "Nightly",
  lease: "Lease",
  membership: "Membership",
  hourly: "Hourly",
};

export default function PropertiesPage() {
  const router = useRouter();
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProperty, setEditProperty] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVertical, setFilterVertical] = useState("");

  const { properties = [], isLoading, mutate } = useProperties();

  const DEFAULT_FEATURES = {
    rooms_map:     { enabled: true,  label: "Rooms Map" },
    rate_card:     { enabled: true,  label: "Rate Card" },
    restaurant:    { enabled: false, label: "Restaurant" },
    bar:           { enabled: false, label: "Bar" },
    laundry:       { enabled: true,  label: "Laundry" },
    maintenance:   { enabled: true,  label: "Maintenance" },
    gym:           { enabled: false, label: "Gym" },
    yoga:          { enabled: false, label: "Yoga" },
    swimming_pool: { enabled: false, label: "Swimming Pool" },
    spa:           { enabled: false, label: "Spa" },
  };

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    vertical_type: "hotel",
    booking_model: "nightly",
    address: "",
    phone: "",
    email: "",
    check_in_time: "14:00",
    check_out_time: "11:00",
    star_rating: 3,
    latitude: "",
    longitude: "",
  });
  const [featureConfig, setFeatureConfig] = useState<Record<string, { enabled: boolean; label: string }>>(DEFAULT_FEATURES);
  const [showConfig, setShowConfig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  function resetForm() {
    setFormData({ name: "", code: "", vertical_type: "hotel", booking_model: "nightly", address: "", phone: "", email: "", check_in_time: "14:00", check_out_time: "11:00", star_rating: 3, latitude: "", longitude: "" });
    setFeatureConfig(DEFAULT_FEATURES);
    setShowConfig(false);
  }

  function handleEdit(prop: any) {
    setEditProperty(prop);
    setFormData({
      name: prop.name || "",
      code: prop.code || "",
      vertical_type: prop.vertical_type || "hotel",
      booking_model: prop.booking_model || "nightly",
      address: prop.address || "",
      phone: prop.phone || "",
      email: prop.email || "",
      check_in_time: prop.check_in_time || "14:00",
      check_out_time: prop.check_out_time || "11:00",
      star_rating: prop.star_rating || 3,
      latitude: prop.latitude?.toString() || "",
      longitude: prop.longitude?.toString() || "",
    });
    const parsed = prop.config ? (typeof prop.config === "string" ? JSON.parse(prop.config) : prop.config) : null;
    setFeatureConfig(parsed?.features || DEFAULT_FEATURES);
    setShowAddModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setActionFeedback(null);
    try {
      const isEdit = !!editProperty;
      const url = isEdit ? `/api/properties/${editProperty.id}` : "/api/properties";
      const method = isEdit ? "PUT" : "POST";

      const payload = { ...formData };
      (payload as any).config = { features: featureConfig };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ type: "success", message: isEdit ? "Property updated successfully" : "Property created successfully" });
        setShowAddModal(false);
        setEditProperty(null);
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

  const filteredProperties = (properties || []).filter((p: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name?.toLowerCase().includes(q) && !p.code?.toLowerCase().includes(q) && !p.city?.toLowerCase().includes(q)) return false;
    }
    if (filterVertical && p.vertical_type !== filterVertical) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Workspaces / Properties</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage all properties, buildings, floors across verticals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setEditProperty(null); resetForm(); setShowAddModal(true); }}>
            <Plus className="w-3.5 h-3.5" /> Add Property
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{ background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)", color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E", border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}` }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, code, city..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
        </div>
        <div className="flex items-center gap-1">
          {["", "hotel", "service_apartment", "rental_apartment", "workplace"].map((v) => (
            <button key={v || "all"} onClick={() => setFilterVertical(v)}
              className="px-2.5 py-1 text-[10px] font-medium rounded transition-all"
              style={{ background: filterVertical === v ? "#1A3C5E" : "#F5F7FA", color: filterVertical === v ? "#FFFFFF" : "#64748B" }}>
              {v || "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !properties.length ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#94A3B8" }} /></div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#94A3B8" }} />
          <p className="text-sm" style={{ color: "#64748B" }}>No properties found. Create your first workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProperties.map((p: any) => {
            const VertIcon = VERTICAL_ICONS[p.vertical_type] || Building2;
            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.1)" }}>
                      <VertIcon className="w-5 h-5" style={{ color: "#1A3C5E" }} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "#1A2E44" }}>{p.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="gray">{VERTICAL_LABELS[p.vertical_type] || p.vertical_type}</Badge>
                        <code className="text-[10px] font-mono" style={{ color: "#94A3B8" }}>{p.code}</code>
                      </div>
                    </div>
                  </div>
                  <Badge variant={p.is_active ? "teal" : "red"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                </div>

                <div className="mt-3 space-y-1.5 text-xs" style={{ color: "#64748B" }}>
                  {p.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {[p.city, p.state, p.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {p.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{p.phone}</div>}
                  {p.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{p.email}</div>}
                  {p.star_rating && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3" style={{ color: "#F5A623" }} />
                      {Array.from({ length: p.star_rating }).map((_, i) => (
                        <span key={i} className="text-[10px]" style={{ color: "#F5A623" }}>&#9733;</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid #F1F5F9" }}>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "#64748B" }}>
                    <span>{p.total_units || 0} units</span>
                    <span>{p.occupancy_pct || 0}% occ.</span>
                    <span>{BOOKING_LABELS[p.booking_model] || p.booking_model}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(p)}
                      className="p-1.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => router.push(`/dashboard/admin/properties/${p.id}`)}
                      className="p-1.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
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
                {editProperty ? "Edit Property" : "Add New Property"}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditProperty(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Property Name *</label>
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="Grand Palace Hotel" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Code *</label>
                  <input type="text" required value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="GPH" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Vertical Type *</label>
                  <select required value={formData.vertical_type}
                    onChange={(e) => setFormData({ ...formData, vertical_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="hotel">Hotel</option>
                    <option value="service_apartment">Service Apartment</option>
                    <option value="rental_apartment">Rental Apartment</option>
                    <option value="workplace">Workplace</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Booking Model *</label>
                  <select required value={formData.booking_model}
                    onChange={(e) => setFormData({ ...formData, booking_model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="nightly">Nightly (Hotel)</option>
                    <option value="lease">Lease (Rental)</option>
                    <option value="membership">Membership (Workplace)</option>
                    <option value="hourly">Hourly (Coworking)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Address</label>
                <textarea value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                  rows={2} placeholder="123 Main Street, City, State" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Phone</label>
                  <input type="text" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="+91-1234567890" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Email</label>
                  <input type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="contact@gph.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Star Rating</label>
                  <select value={formData.star_rating}
                    onChange={(e) => setFormData({ ...formData, star_rating: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    {[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s} Star</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Check-in Time</label>
                  <input type="time" value={formData.check_in_time}
                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Check-out Time</label>
                  <input type="time" value={formData.check_out_time}
                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>

              <div>
                <button type="button" onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center gap-2 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                  style={{ background: showConfig ? "rgba(26,60,94,0.08)" : "#F8FAFC", color: "#1A3C5E", border: "1px solid #E2E8F0" }}>
                  <Settings className="w-3.5 h-3.5" />
                  {showConfig ? "Hide" : "Configure"} Feature Settings
                  <ChevronRight className={`w-3 h-3 transition-transform ${showConfig ? "rotate-90" : ""}`} />
                </button>
                {showConfig && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(featureConfig).map(([key, feat]) => (
                      <button key={key} type="button" onClick={() => setFeatureConfig((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }))}
                        className="flex items-center gap-2 p-2.5 rounded-lg text-xs transition-all text-left"
                        style={{
                          background: feat.enabled ? "rgba(42,157,143,0.08)" : "#F8FAFC",
                          border: `1px solid ${feat.enabled ? "rgba(42,157,143,0.2)" : "#E2E8F0"}`,
                        }}>
                        {feat.enabled ? <Eye className="w-3 h-3" style={{ color: "#2BAE8E" }} /> : <EyeOff className="w-3 h-3" style={{ color: "#94A3B8" }} />}
                        <span style={{ color: feat.enabled ? "#1A2E44" : "#64748B" }}>{feat.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddModal(false); setEditProperty(null); }}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : editProperty ? "Update Property" : "Create Property"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
