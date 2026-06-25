"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Building2, Hotel, Home, Briefcase, MapPin, Phone, Mail, Star, ArrowLeft, Save, Loader2, CheckCircle, AlertCircle, Settings, Eye, EyeOff, RefreshCw } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useProperty } from "@/lib/hooks";

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

const FEATURE_GROUPS: Record<string, { label: string; features: string[] }> = {
  "Property": { label: "Property Core", features: ["rooms_map", "rate_card"] },
  "F&B": { label: "Food & Beverage", features: ["restaurant", "bar"] },
  "Services": { label: "Guest Services", features: ["laundry", "maintenance"] },
  "Wellness": { label: "Wellness & Recreation", features: ["gym", "yoga", "swimming_pool", "spa"] },
};

const FEATURE_ICONS: Record<string, string> = {
  rooms_map: "🗺️",
  rate_card: "💰",
  restaurant: "🍽️",
  bar: "🍸",
  laundry: "👕",
  maintenance: "🔧",
  gym: "💪",
  yoga: "🧘",
  swimming_pool: "🏊",
  spa: "💆",
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { property, isLoading, mutate } = useProperty(id);
  const [activeTab, setActiveTab] = useState<"overview" | "configuration">("overview");
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [initialConfig, setInitialConfig] = useState<any>(null);

  useEffect(() => {
    if (property?.config) {
      const parsed = typeof property.config === "string" ? JSON.parse(property.config) : property.config;
      setConfig(parsed);
      setInitialConfig(JSON.stringify(parsed));
    }
  }, [property?.config]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const hasConfigChanges = initialConfig !== null && JSON.stringify(config) !== initialConfig;

  function toggleFeature(key: string) {
    setConfig((prev: any) => ({
      ...prev,
      features: {
        ...prev?.features,
        [key]: { ...prev?.features?.[key], enabled: !prev?.features?.[key]?.enabled },
      },
    }));
  }

  async function saveConfig() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: "Configuration saved" });
        setInitialConfig(JSON.stringify(config));
        mutate();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to save config" });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#94A3B8" }} />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: "#94A3B8" }} />
        <p style={{ color: "#64748B" }}>Property not found</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/dashboard/admin/properties")}>Back to Properties</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dashboard/admin/properties")} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>{property.name}</h1>
            <Badge variant={property.is_active ? "teal" : "red"}>{property.is_active ? "Active" : "Inactive"}</Badge>
            <Badge variant="gray">{VERTICAL_LABELS[property.vertical_type] || property.vertical_type}</Badge>
          </div>
          <p className="text-xs" style={{ color: "#64748B" }}>Code: {property.code} &middot; {BOOKING_LABELS[property.booking_model] || property.booking_model}</p>
        </div>
        <button onClick={() => mutate()} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{ background: feedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)", color: feedback.type === "success" ? "#2BAE8E" : "#E53E3E", border: `1px solid ${feedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}` }}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      <div className="flex items-center gap-1 border-b" style={{ borderColor: "#E2E8F0" }}>
        {(["overview", "configuration"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-medium capitalize transition-colors relative"
            style={{ color: activeTab === tab ? "#1A3C5E" : "#64748B", borderBottom: activeTab === tab ? "2px solid #1A3C5E" : "2px solid transparent" }}>
            {tab === "overview" && <Building2 className="w-3.5 h-3.5 inline mr-1.5" />}
            {tab === "configuration" && <Settings className="w-3.5 h-3.5 inline mr-1.5" />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Property Details" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>Name</span>
                  <p style={{ color: "#1A2E44" }}>{property.name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>Code</span>
                  <p style={{ color: "#1A2E44" }}>{property.code}</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>Vertical</span>
                  <p style={{ color: "#1A2E44" }}>{VERTICAL_LABELS[property.vertical_type] || property.vertical_type}</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>Booking Model</span>
                  <p style={{ color: "#1A2E44" }}>{BOOKING_LABELS[property.booking_model] || property.booking_model}</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>Check-in / Check-out</span>
                  <p style={{ color: "#1A2E44" }}>{property.check_in_time?.slice(0, 5)} / {property.check_out_time?.slice(0, 5)}</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>Star Rating</span>
                  <p style={{ color: "#1A2E44" }}>
                    {property.star_rating && Array.from({ length: property.star_rating }).map((_, i) => (
                      <span key={i} style={{ color: "#F5A623" }}>&#9733;</span>
                    ))}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>Address</span>
                  <p style={{ color: "#1A2E44" }}>{[property.address, property.city, property.state, property.country].filter(Boolean).join(", ") || "—"}</p>
                </div>
                {property.phone && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: "#64748B" }}>Phone</span>
                    <p style={{ color: "#1A2E44" }}>{property.phone}</p>
                  </div>
                )}
                {property.email && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: "#64748B" }}>Email</span>
                    <p style={{ color: "#1A2E44" }}>{property.email}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>Units</span>
                  <p style={{ color: "#1A2E44" }}>{property.units?.length || 0} total</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>Buildings</span>
                  <p style={{ color: "#1A2E44" }}>{property.buildings?.length || 0}</p>
                </div>
              </div>
            </Card>

            {property.buildings?.length > 0 && (
              <Card>
                <CardHeader title="Buildings" />
                <div className="space-y-2">
                  {property.buildings.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F8FAFC" }}>
                      <div>
                        <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>{b.name}</span>
                        <code className="ml-2 text-[10px] font-mono" style={{ color: "#94A3B8" }}>{b.code}</code>
                      </div>
                      <span className="text-xs" style={{ color: "#64748B" }}>{b.floors} floors</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Feature Status" />
              <div className="space-y-2">
                {config?.features && Object.entries(config.features).map(([key, feat]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between text-xs py-1">
                    <span style={{ color: "#475569" }}>{FEATURE_ICONS[key] || "•"} {feat.label || key}</span>
                    <Badge variant={feat.enabled ? "teal" : "gray"}>{feat.enabled ? "On" : "Off"}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                <button onClick={() => setActiveTab("configuration")}
                  className="w-full text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(26,60,94,0.08)", color: "#1A3C5E" }}>
                  <Settings className="w-3 h-3" /> Configure Features
                </button>
              </div>
            </Card>

            {property.region_name && (
              <Card>
                <CardHeader title="Region" />
                <p className="text-sm" style={{ color: "#475569" }}>
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  {[property.region_name, property.city, property.state, property.country].filter(Boolean).join(", ")}
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "configuration" && (
        <div className="max-w-3xl">
          <Card>
            <CardHeader title="Property Feature Configuration" subtitle="Enable or disable modules and features for this property. Disabled features will be hidden from the workflow."
              action={hasConfigChanges ? <Button variant="primary" size="sm" onClick={saveConfig} disabled={saving}>
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : <><Save className="w-3.5 h-3.5 mr-1" /> Save</>}
              </Button> : undefined} />
            <div className="space-y-6">
              {Object.entries(FEATURE_GROUPS).map(([groupKey, group]) => (
                <div key={groupKey}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#94A3B8" }}>{group.label}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.features.map((key) => {
                      const feat = config?.features?.[key] || { enabled: false, label: key };
                      return (
                        <button key={key} onClick={() => toggleFeature(key)}
                          className="flex items-center justify-between p-3 rounded-lg text-sm transition-all text-left"
                          style={{
                            background: feat.enabled ? "rgba(42,157,143,0.08)" : "#F8FAFC",
                            border: `1px solid ${feat.enabled ? "rgba(42,157,143,0.2)" : "#E2E8F0"}`,
                          }}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{FEATURE_ICONS[key] || "•"}</span>
                            <div>
                              <span className="font-medium" style={{ color: feat.enabled ? "#1A2E44" : "#64748B" }}>{feat.label || key}</span>
                              <p className="text-[10px]" style={{ color: "#94A3B8" }}>{key.replace(/_/g, " ")}</p>
                            </div>
                          </div>
                          {feat.enabled ? (
                            <Eye className="w-4 h-4" style={{ color: "#2BAE8E" }} />
                          ) : (
                            <EyeOff className="w-4 h-4" style={{ color: "#94A3B8" }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {hasConfigChanges && (
              <div className="mt-6 pt-4 flex justify-end gap-2" style={{ borderTop: "1px solid #F1F5F9" }}>
                <Button variant="outline" size="sm" onClick={() => { setConfig(JSON.parse(initialConfig!)); }}>Reset</Button>
                <Button variant="primary" size="sm" onClick={saveConfig} disabled={saving}>
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : <><Save className="w-3.5 h-3.5 mr-1" /> Save Configuration</>}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
