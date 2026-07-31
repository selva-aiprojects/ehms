"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Building2, Hotel, Home, Briefcase, MapPin, Phone, Mail, Star, ArrowLeft, Save, Loader2, CheckCircle, AlertCircle, Settings, Eye, EyeOff, RefreshCw, DoorOpen } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useProperty } from "@/lib/hooks";
import PropertyRoomsInventory from "./components/PropertyRoomsInventory";

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
  const [activeTab, setActiveTab] = useState<"overview" | "configuration" | "rooms">("overview");
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [initialConfig, setInitialConfig] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tabParam = new URLSearchParams(window.location.search).get("tab");
      if (tabParam === "rooms" || tabParam === "configuration" || tabParam === "overview") {
        setActiveTab(tabParam);
      }
    }
  }, []);

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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-text-faint)" }} />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-text-faint)" }} />
        <p style={{ color: "var(--color-text-muted)" }}>Property not found</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/dashboard/admin/properties")}>Back to Properties</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dashboard/admin/properties")} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>{property.name}</h1>
            <Badge variant={property.is_active ? "teal" : "red"}>{property.is_active ? "Active" : "Inactive"}</Badge>
            <Badge variant="gray">{VERTICAL_LABELS[property.vertical_type] || property.vertical_type}</Badge>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Code: {property.code} &middot; {BOOKING_LABELS[property.booking_model] || property.booking_model}</p>
        </div>
        <button onClick={() => mutate()} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: "var(--color-text-muted)" }}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{ background: feedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.1)" : "rgba(var(--color-danger-rgb),0.08)", color: feedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)", border: `1px solid ${feedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.2)" : "rgba(var(--color-danger-rgb),0.2)"}` }}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      <div className="flex items-center gap-1 border-b" style={{ borderColor: "var(--color-border)" }}>
        {(["overview", "configuration", "rooms"] as const).map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); router.replace(`/dashboard/admin/properties/${id}?tab=${tab}`, { scroll: false }); }}
            className="px-4 py-2.5 text-sm font-medium capitalize transition-colors relative flex items-center gap-1.5"
            style={{ color: activeTab === tab ? "var(--color-navy)" : "var(--color-text-muted)", borderBottom: activeTab === tab ? "2px solid var(--color-navy)" : "2px solid transparent" }}>
            {tab === "overview" && <Building2 className="w-3.5 h-3.5" />}
            {tab === "configuration" && <Settings className="w-3.5 h-3.5" />}
            {tab === "rooms" && <DoorOpen className="w-3.5 h-3.5" />}
            {tab === "rooms" ? "Rooms & Inventory" : tab}
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
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Name</span>
                  <p style={{ color: "var(--color-text)" }}>{property.name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Code</span>
                  <p style={{ color: "var(--color-text)" }}>{property.code}</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Vertical</span>
                  <p style={{ color: "var(--color-text)" }}>{VERTICAL_LABELS[property.vertical_type] || property.vertical_type}</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Booking Model</span>
                  <p style={{ color: "var(--color-text)" }}>{BOOKING_LABELS[property.booking_model] || property.booking_model}</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Check-in / Check-out</span>
                  <p style={{ color: "var(--color-text)" }}>{property.check_in_time?.slice(0, 5)} / {property.check_out_time?.slice(0, 5)}</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Star Rating</span>
                  <p style={{ color: "var(--color-text)" }}>
                    {property.star_rating && Array.from({ length: property.star_rating }).map((_, i) => (
                      <span key={i} style={{ color: "var(--color-warning)" }}>&#9733;</span>
                    ))}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Address</span>
                  <p style={{ color: "var(--color-text)" }}>{[property.address, property.city, property.state, property.country].filter(Boolean).join(", ") || "—"}</p>
                </div>
                {property.phone && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Phone</span>
                    <p style={{ color: "var(--color-text)" }}>{property.phone}</p>
                  </div>
                )}
                {property.email && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Email</span>
                    <p style={{ color: "var(--color-text)" }}>{property.email}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Units</span>
                  <p style={{ color: "var(--color-text)" }}>{property.units?.length || 0} total</p>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Buildings</span>
                  <p style={{ color: "var(--color-text)" }}>{property.buildings?.length || 0}</p>
                </div>
              </div>
            </Card>

            {property.buildings?.length > 0 && (
              <Card>
                <CardHeader title="Buildings" />
                <div className="space-y-2">
                  {property.buildings.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                      <div>
                        <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{b.name}</span>
                        <code className="ml-2 text-[10px] font-mono" style={{ color: "var(--color-text-faint)" }}>{b.code}</code>
                      </div>
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{b.floors} floors</span>
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
                    <span style={{ color: "var(--color-text)" }}>{FEATURE_ICONS[key] || "•"} {feat.label || key}</span>
                    <Badge variant={feat.enabled ? "teal" : "gray"}>{feat.enabled ? "On" : "Off"}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-light)" }}>
                <button onClick={() => setActiveTab("configuration")}
                  className="w-full text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(var(--color-navy-rgb),0.08)", color: "var(--color-navy)" }}>
                  <Settings className="w-3 h-3" /> Configure Features
                </button>
              </div>
            </Card>

            {property.region_name && (
              <Card>
                <CardHeader title="Region" />
                <p className="text-sm" style={{ color: "var(--color-text)" }}>
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
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-faint)" }}>{group.label}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.features.map((key) => {
                      const feat = config?.features?.[key] || { enabled: false, label: key };
                      return (
                        <button key={key} onClick={() => toggleFeature(key)}
                          className="flex items-center justify-between p-3 rounded-lg text-sm transition-all text-left"
                          style={{
                            background: feat.enabled ? "rgba(var(--color-primary-dark-rgb),0.08)" : "var(--color-light)",
                            border: `1px solid ${feat.enabled ? "rgba(var(--color-primary-dark-rgb),0.2)" : "var(--color-border)"}`,
                          }}>
                          <div className="flex items-center gap-2">
                            <span className="text-base">{FEATURE_ICONS[key] || "•"}</span>
                            <div>
                              <span className="font-medium" style={{ color: feat.enabled ? "var(--color-text)" : "var(--color-text-muted)" }}>{feat.label || key}</span>
                              <p className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>{key.replace(/_/g, " ")}</p>
                            </div>
                          </div>
                          {feat.enabled ? (
                            <Eye className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                          ) : (
                            <EyeOff className="w-4 h-4" style={{ color: "var(--color-text-faint)" }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {hasConfigChanges && (
              <div className="mt-6 pt-4 flex justify-end gap-2" style={{ borderTop: "1px solid var(--color-light)" }}>
                <Button variant="outline" size="sm" onClick={() => { setConfig(JSON.parse(initialConfig!)); }}>Reset</Button>
                <Button variant="primary" size="sm" onClick={saveConfig} disabled={saving}>
                  {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : <><Save className="w-3.5 h-3.5 mr-1" /> Save Configuration</>}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "rooms" && (
        <PropertyRoomsInventory propertyId={id} property={property} />
      )}
    </div>
  );
}
