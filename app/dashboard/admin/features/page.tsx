"use client";

import { useState, useEffect } from "react";
import { 
  Zap, AlertCircle, CheckCircle, Loader2, RefreshCw, Lock, Unlock,
  ChevronDown, ChevronRight, Award, Package, Cpu, Building2, 
  Server, Shield, AlertTriangle, Clock, User, GitBranch
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

interface FeatureFlag {
  id: string;
  flag_key: string;
  name: string;
  description: string;
  category: string;
  status: string;
  default_enabled: boolean;
  is_enabled?: boolean;
  blocking_flags?: string[];
  conflicting_flags?: string[];
  can_enable?: boolean;
  reason?: string;
}

interface FeatureCheckResult {
  flag: string;
  is_enabled: boolean;
  can_enable: boolean;
  blocking_flags: string[];
  conflicting_flags: string[];
  reason: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  hospitality: { label: "Hospitality Core", icon: Building2, color: "#3B82F6" },
  commercial: { label: "Commercial", icon: Building2, color: "#10B981" },
  industrial: { label: "Industrial & Logistics", icon: Package, color: "#F59E0B" },
  land: { label: "Land Promotion", icon: Server, color: "#8B5CF6" },
  admin: { label: "PropOS Infrastructure", icon: Cpu, color: "#6366F1" },
  ai_agents: { label: "AI Agents", icon: Zap, color: "#EC4899" },
  maintenance: { label: "Maintenance", icon: Award, color: "#14B8A6" },
};

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>("hospitality");
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [scope, setScope] = useState<"global" | "property">( "global");
  const [scopeId, setScopeId] = useState("");

  async function loadFeatures() {
    setLoading(true);
    try {
      const res = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-all" }),
      });
      const data = await res.json();
      if (data.features) {
        setFeatures(data.features);
      } else if (data.error) {
        setActionFeedback({ type: "error", message: data.error });
      }
    } catch (error) {
      setActionFeedback({ type: "error", message: "Failed to load features" });
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFeatures();
  }, []);

  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  async function handleToggle(flagKey: string, shouldEnable: boolean) {
    setToggleLoading(flagKey);
    try {
      const payload: any = {
        flag: flagKey,
        scope,
        enable: shouldEnable,
      };
      if (scope === "property" && scopeId) {
        payload.property_id = scopeId;
      }

      const res = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: shouldEnable ? "enable" : "disable", ...payload }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({ type: "success", message: data.message });
        loadFeatures();
      } else {
        setActionFeedback({ type: "error", message: data.message || `Failed to ${shouldEnable ? "enable" : "disable"} feature` });
      }
    } catch (error) {
      setActionFeedback({ type: "error", message: "Network error" });
    }
    setToggleLoading(null);
  }

  const groupedFeatures = features.reduce((acc: Record<string, FeatureFlag[]>, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  const categoryOrder = ["hospitality", "admin", "commercial", "industrial", "land", "ai_agents", "maintenance"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-navy)" }}>Feature Flags & Modules</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Safely enable/disable features with dependency management</p>
        </div>
        <Button onClick={loadFeatures} disabled={loading} size="sm">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Feedback Alert */}
      {actionFeedback && (
        <div
          className="rounded-lg px-4 py-3 flex items-start gap-3 text-sm"
          style={{
            background: actionFeedback.type === "success" ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
            color: actionFeedback.type === "success" ? "#059669" : "#DC2626",
          }}
        >
          {actionFeedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>{actionFeedback.message}</div>
        </div>
      )}

      {/* Scope Selector */}
      <Card>
        <CardHeader title="Configuration Scope" subtitle="Choose where to apply feature toggles" />
        <div className="px-6 pb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="scope-global"
              name="scope"
              value="global"
              checked={scope === "global"}
              onChange={() => setScope("global")}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="scope-global" className="cursor-pointer text-sm font-medium" style={{ color: "var(--color-text)" }}>
              Global
            </label>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>(all properties)</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="scope-property"
              name="scope"
              value="property"
              checked={scope === "property"}
              onChange={() => setScope("property")}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="scope-property" className="cursor-pointer text-sm font-medium" style={{ color: "var(--color-text)" }}>
              Property-Specific
            </label>
            {scope === "property" && (
              <input
                type="text"
                placeholder="Property ID"
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                className="ml-2 px-2 py-1 text-sm rounded border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Features by Category */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-primary)" }} />
        </div>
      ) : (
        <div className="space-y-4">
          {categoryOrder.map((category) => {
            const categoryFeatures = groupedFeatures[category] || [];
            if (categoryFeatures.length === 0) return null;

            const config = CATEGORY_CONFIG[category] || { label: category, icon: Zap, color: "#6B7280" };
            const Icon = config.icon;
            const isExpanded = expandedCategory === category;

            return (
              <Card key={category}>
                <button
                  onClick={() => setExpandedCategory(isExpanded ? "" : category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-opacity-80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${config.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold" style={{ color: "var(--color-navy)" }}>
                        {config.label}
                      </h3>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {categoryFeatures.length} feature{categoryFeatures.length !== 1 ? "s" : ""} · {categoryFeatures.filter((f) => f.default_enabled || f.is_enabled).length} enabled
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
                  ) : (
                    <ChevronRight className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t" style={{ borderColor: "var(--color-border)" }}>
                    {categoryFeatures.map((feature, idx) => {
                      const isHospitality = category === "hospitality";
                      const isEnabled = feature.is_enabled ?? feature.default_enabled;
                      const canToggle = !isHospitality || scope !== "global";
                      const hasBlockers = feature.blocking_flags && feature.blocking_flags.length > 0;
                      const hasConflicts = feature.conflicting_flags && feature.conflicting_flags.length > 0;

                      return (
                        <div
                          key={feature.id}
                          className={`px-6 py-4 flex items-start justify-between ${idx !== categoryFeatures.length - 1 ? "border-b" : ""}`}
                          style={{ borderColor: "var(--color-light)" }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm" style={{ color: "var(--color-navy)" }}>
                                {feature.name}
                              </h4>
                              {isHospitality && (
                                <Badge variant="teal" className="text-[10px]">
                                  <Lock className="w-3 h-3 mr-1" /> Core
                                </Badge>
                              )}
                              {feature.status === "planning" && (
                                <Badge variant="amber" className="text-[10px]">
                                  Planning
                                </Badge>
                              )}
                              {isEnabled && (
                                <Badge variant="teal" className="text-[10px]">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                              {feature.description}
                            </p>

                            {/* Dependency Info */}
                            {(hasBlockers || hasConflicts) && (
                              <div className="mt-2 space-y-1">
                                {hasBlockers && (
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-3 h-3 mt-0.5" style={{ color: "#F59E0B" }} />
                                    <span className="text-[11px]" style={{ color: "#F59E0B" }}>
                                      Requires: {(feature.blocking_flags || []).join(", ")}
                                    </span>
                                  </div>
                                )}
                                {hasConflicts && (
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-3 h-3 mt-0.5" style={{ color: "#EF4444" }} />
                                    <span className="text-[11px]" style={{ color: "#EF4444" }}>
                                      Conflicts with: {(feature.conflicting_flags || []).join(", ")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            <div className="text-right">
                              <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>
                                {isEnabled ? "On" : "Off"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleToggle(feature.flag_key, !isEnabled)}
                              disabled={toggleLoading === feature.flag_key || (isHospitality && scope === "global")}
                              className={`relative w-12 h-6 rounded-full transition-all ${
                                toggleLoading === feature.flag_key ? "opacity-50 cursor-wait" : ""
                              } ${isHospitality && scope === "global" ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                              style={{
                                background: isEnabled ? "var(--color-primary)" : "var(--color-light)",
                              }}
                            >
                              {toggleLoading === feature.flag_key ? (
                                <Loader2 className="w-3 h-3 animate-spin absolute left-1.5 top-1.5" style={{ color: "var(--color-white)" }} />
                              ) : (
                                <div
                                  className="w-5 h-5 rounded-full transition-transform flex items-center justify-center"
                                  style={{
                                    background: "var(--color-white)",
                                    transform: isEnabled ? "translateX(24px)" : "translateX(2px)",
                                  }}
                                >
                                  {isHospitality && scope === "global" && (
                                    <Lock className="w-2.5 h-2.5" style={{ color: "var(--color-text-faint)" }} />
                                  )}
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Safety Notes */}
      <Card>
        <CardHeader title="Safety Guidelines" subtitle="Keep the platform stable" />
        <div className="px-6 pb-6 space-y-3">
          <div className="flex gap-3 text-sm">
            <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
            <p style={{ color: "var(--color-text-muted)" }}>
              <strong>Hospitality Core Locked:</strong> Hospitality base modules are protected at the global scope to ensure existing clients remain unaffected.
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
            <p style={{ color: "var(--color-text-muted)" }}>
              <strong>Dependency Validation:</strong> The system prevents enabling features without their required dependencies. Check blockage messages above.
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <GitBranch className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#10B981" }} />
            <p style={{ color: "var(--color-text-muted)" }}>
              <strong>Scope Matters:</strong> Toggle at global scope for all properties, or configure per-property. Global hospitality is locked for safety.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
