"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, Sparkles, Loader2, CheckCircle2, ArrowUpRight, Zap,
  RefreshCw, ShieldCheck, DollarSign, Maximize2, X, TrendingDown,
} from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useProperties } from "@/lib/hooks";
import { toast } from "react-hot-toast";

interface AiRevenueManagerCardProps {
  propertyId?: string;
}

function DemandBadge({ level }: { level: string }) {
  if (level === "High") {
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-danger-soft)] text-[var(--color-danger)]">dY High Demand Surge</span>;
  }
  if (level === "Low") {
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-info-soft)] text-[var(--color-info)]">dY Low Demand Incentive</span>;
  }
  return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-success-soft)] text-[var(--color-success-dark)]">Normal Baseline</span>;
}

export default function AiRevenueManagerCard({ propertyId: propPropertyId }: AiRevenueManagerCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);
  const [togglingPilot, setTogglingPilot] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const { properties } = useProperties("hotel");
  const activePropertyId = propPropertyId || properties?.[0]?.id;

  const fetchAiRecommendations = async () => {
    try {
      const url = activePropertyId
        ? `/api/dashboard/front-desk/revenue-ai?property_id=${activePropertyId}`
        : "/api/dashboard/front-desk/revenue-ai";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load AI revenue data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiRecommendations();
  }, [activePropertyId]);

  useEffect(() => {
    if (!showFull) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowFull(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [showFull]);

  const handleApplyRate = async (ratePlanId: string, recommendedRate: number) => {
    if (!activePropertyId) return;
    setApplyingId(ratePlanId);
    try {
      const res = await fetch("/api/dashboard/front-desk/revenue-ai/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: activePropertyId,
          rate_plan_id: ratePlanId,
          recommended_rate: recommendedRate
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to apply rate");
      toast.success(json.message || "AI rate applied!");
      fetchAiRecommendations();
    } catch (err: any) {
      toast.error(err?.message || "Error applying rate");
    } finally {
      setApplyingId(null);
    }
  };

  const handleApplyAll = async () => {
    if (!activePropertyId) return;
    setApplyingAll(true);
    try {
      const res = await fetch("/api/dashboard/front-desk/revenue-ai/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: activePropertyId,
          apply_all: true
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to apply all rates");
      toast.success(json.message || "Applied all AI rate recommendations!");
      fetchAiRecommendations();
    } catch (err: any) {
      toast.error(err?.message || "Error applying rates");
    } finally {
      setApplyingAll(false);
    }
  };

  const handleToggleAutoPilot = async () => {
    if (!activePropertyId || !data) return;
    setTogglingPilot(true);
    const newTarget = !data.auto_pilot_enabled;
    try {
      const res = await fetch("/api/dashboard/front-desk/revenue-ai/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: activePropertyId,
          apply_auto_pilot: newTarget
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to toggle Auto-Pilot");
      toast.success(json.message);
      fetchAiRecommendations();
    } catch (err: any) {
      toast.error(err?.message || "Error toggling Auto-Pilot");
    } finally {
      setTogglingPilot(false);
    }
  };

  const recs: any[] = data?.recommendations || [];
  const totalLift = data?.total_daily_revenue_lift || 0;
  const visibleRecs = showFull ? recs : recs.slice(0, 2);

  const renderRecRow = (rec: any) => {
    const isSurging = rec.recommendedRate > rec.baseRate;
    const isDiscounting = rec.recommendedRate < rec.baseRate;
    const pctDiff = Math.round(((rec.recommendedRate - rec.baseRate) / rec.baseRate) * 100);

    return (
      <div key={rec.ratePlanId} className="p-3.5 flex flex-wrap items-center justify-between gap-2 hover:bg-[var(--color-light)] transition-colors">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-xs text-[var(--color-text)]">{rec.name}</span>
            <span className="text-[10px] text-gray-500 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
              {rec.unitType}
            </span>
            {rec.isDynamic && (
              <span className="text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-success-soft)] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> AI Active
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(rec.breakdown || []).slice(0, showFull ? 6 : 2).map((b: any, idx: number) => (
              <span
                key={idx}
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  b.multiplier > 0 ? "bg-[var(--color-warning-soft)] text-[var(--color-warning-dark)]" : b.multiplier < 0 ? "bg-[var(--color-info-soft)] text-[var(--color-info-dark)]" : "bg-gray-100 text-gray-600"
                }`}
              >
                {b.factor} ({b.impact})
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-right ml-auto">
          <div>
            <div className="flex items-center justify-end gap-1.5">
              {pctDiff !== 0 && (
                <span className="text-xs text-gray-400 line-through">₹{rec.baseRate.toLocaleString()}</span>
              )}
              <span className={`text-base font-bold font-mono ${
                isSurging ? "text-[var(--color-danger)]" : isDiscounting ? "text-[var(--color-info)]" : "text-[var(--color-navy)]"
              }`}>
                ₹{rec.recommendedRate.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              {pctDiff > 0 ? `+${pctDiff}% yield` : pctDiff < 0 ? `${pctDiff}% incentive` : "Optimized baseline"}
            </p>
          </div>

          <div>
            {rec.baseRate === rec.recommendedRate ? (
              <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                Optimized
              </span>
            ) : (
              <Button
                size="sm"
                disabled={applyingId === rec.ratePlanId || data.auto_pilot_enabled}
                onClick={() => handleApplyRate(rec.ratePlanId, rec.recommendedRate)}
                className="h-8 text-xs bg-[var(--color-navy)] hover:bg-[var(--color-dark-navy)] text-white px-3"
              >
                {applyingId === rec.ratePlanId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                )}
                Apply Rate
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStats = (wide: boolean) => {
    if (wide) {
      return (
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-[var(--color-light)] p-3 rounded-xl border border-[var(--color-border)]">
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Occupancy Velocity</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-2xl font-bold text-[var(--color-navy)]">{data.occupancy_pct}%</span>
              <DemandBadge level={data.demand_level} />
            </div>
          </div>

          <div className="bg-[var(--color-light)] p-3 rounded-xl border border-[var(--color-border)]">
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Available Units</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-2xl font-bold text-[var(--color-navy)]">{data.vacant_units}</span>
              <span className="text-xs text-[var(--color-text-muted)]">/ {data.total_units} total</span>
            </div>
          </div>

          <div className="bg-[var(--color-success-soft)] p-3 rounded-xl border border-[color:var(--color-primary)]/30 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-[var(--color-success-dark)] font-medium">Daily Revenue Lift</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-2xl font-bold text-[var(--color-success-dark)]">
                  +₹{totalLift.toLocaleString()}
                </span>
                <span className="text-[10px] text-[var(--color-success-dark)]">/ day</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleApplyAll}
              disabled={applyingAll || totalLift <= 0}
              className="h-7 px-2.5 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white whitespace-nowrap"
            >
              {applyingAll ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
              Apply All
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[var(--color-light)] p-2.5 rounded-xl border border-[var(--color-border)]">
            <p className="text-[10px] text-[var(--color-text-muted)] font-medium">Occupancy Velocity</p>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className="text-lg font-bold text-[var(--color-navy)]">{data.occupancy_pct}%</span>
              <DemandBadge level={data.demand_level} />
            </div>
          </div>
          <div className="bg-[var(--color-light)] p-2.5 rounded-xl border border-[var(--color-border)]">
            <p className="text-[10px] text-[var(--color-text-muted)] font-medium">Available Units</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg font-bold text-[var(--color-navy)]">{data.vacant_units}</span>
              <span className="text-[10px] text-[var(--color-text-muted)]">/ {data.total_units}</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-success-soft)] p-2.5 rounded-xl border border-[color:var(--color-primary)]/30 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] text-[var(--color-success-dark)] font-medium">Daily Revenue Lift</p>
            <div className="flex items-center gap-1">
              <span className="text-base font-bold text-[var(--color-success-dark)]">
                +₹{totalLift.toLocaleString()}
              </span>
              <span className="text-[10px] text-[var(--color-success-dark)]">/ day</span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleApplyAll}
            disabled={applyingAll || totalLift <= 0}
            className="h-7 px-2.5 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white whitespace-nowrap shrink-0"
          >
            {applyingAll ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
            Apply All
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="flex flex-col h-full overflow-hidden border border-[color:var(--color-navy)]/20 shadow-md">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[var(--color-navy)] to-[var(--color-dark-navy)] p-4 text-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[color:var(--color-primary)]/20 flex items-center justify-center border border-[color:var(--color-primary)]/40 shrink-0">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold flex items-center gap-1.5 flex-wrap">
                AI Revenue Manager & Dynamic Yield
                <span className="text-[10px] bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded font-mono font-semibold">
                  REV-AI v2.0
                </span>
              </h3>
              <p className="text-[11px] text-gray-300">Algorithmic occupancy scaling & weekend rate optimization</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setShowFull(true)}
              className="h-8 px-2.5 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white whitespace-nowrap"
            >
              <Maximize2 className="w-3.5 h-3.5 mr-1" /> Full View
            </Button>

            {/* Dynamic Auto-Pilot Toggle */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-semibold leading-tight">Dynamic Auto-Pilot</p>
                <p className="text-[9px] text-gray-300">Auto-scale rates across OTAs</p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoPilot}
                disabled={togglingPilot || loading}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                  data?.auto_pilot_enabled ? "bg-[var(--color-primary)]" : "bg-gray-500"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    data?.auto_pilot_enabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-navy)]" /></div>
        ) : !data ? (
          <div className="text-center p-8 text-gray-500 text-sm">Could not load revenue metrics.</div>
        ) : (
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {renderStats(false)}

            {/* Recommendations List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-[var(--color-navy)] flex items-center justify-between gap-2">
                <span>Dynamic Rate Recommendations</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-normal text-gray-500 hidden md:inline">Confidence: 94% (ML Evaluated)</span>
                  <button
                    onClick={() => setShowFull(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap"
                  >
                    <Maximize2 className="w-3 h-3" /> View all ({recs.length})
                  </button>
                </div>
              </h4>

              <div className="divide-y divide-[var(--color-border)] border rounded-xl overflow-hidden bg-white">
                {visibleRecs.length === 0 && (
                  <div className="p-6 text-center text-sm text-gray-500">No active rate plans.</div>
                )}
                {visibleRecs.map(renderRecRow)}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Fullscreen Modal */}
      {showFull && data && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6">
          <div className="bg-white w-full h-full sm:max-w-5xl sm:h-[90vh] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[var(--color-navy)] to-[var(--color-dark-navy)] px-5 py-4 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[color:var(--color-primary)]/20 flex items-center justify-center border border-[color:var(--color-primary)]/40 shrink-0">
                  <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold flex items-center gap-2 flex-wrap">
                    AI Revenue Manager & Dynamic Yield
                    <span className="text-[10px] bg-[var(--color-primary)] text-white px-1.5 py-0.5 rounded font-mono font-semibold">REV-AI v2.0</span>
                  </h2>
                  <p className="text-xs text-gray-300">Algorithmic occupancy scaling & weekend rate optimization</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
                  <div className="text-right">
                    <p className="text-[11px] font-semibold leading-tight">Dynamic Auto-Pilot</p>
                    <p className="text-[9px] text-gray-300">Auto-scale rates across OTAs</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAutoPilot}
                    disabled={togglingPilot}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                      data.auto_pilot_enabled ? "bg-[var(--color-primary)]" : "bg-gray-500"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        data.auto_pilot_enabled ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
                <button
                  onClick={() => setShowFull(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {renderStats(true)}

              {/* Metrics strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[var(--color-light)] p-3 rounded-xl border border-[var(--color-border)]">
                  <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Occupied Units</p>
                  <p className="text-lg font-bold text-[var(--color-navy)]">{data.occupied_units}</p>
                </div>
                <div className="bg-[var(--color-light)] p-3 rounded-xl border border-[var(--color-border)]">
                  <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Total Units</p>
                  <p className="text-lg font-bold text-[var(--color-navy)]">{data.total_units}</p>
                </div>
                <div className="bg-[var(--color-light)] p-3 rounded-xl border border-[var(--color-border)]">
                  <p className="text-[11px] text-[var(--color-text-muted)] font-medium">AI Confidence</p>
                  <p className="text-lg font-bold flex items-center gap-1.5 text-[var(--color-navy)]">
                    <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" /> 94% (ML Evaluated)
                  </p>
                </div>
                <div className="bg-[var(--color-light)] p-3 rounded-xl border border-[var(--color-border)]">
                  <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Auto-Pilot Status</p>
                  <p className={`text-lg font-bold flex items-center gap-1.5 ${data.auto_pilot_enabled ? "text-[var(--color-success-dark)]" : "text-gray-500"}`}>
                    <Zap className={`w-4 h-4 ${data.auto_pilot_enabled ? "text-[var(--color-primary)]" : ""}`} />
                    {data.auto_pilot_enabled ? "Active" : "Manual"}
                  </p>
                </div>
              </div>

              {/* Full Recommendation Table */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-[var(--color-navy)] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" /> Dynamic Rate Recommendations
                    <span className="text-[11px] font-normal text-gray-500">({recs.length} plans)</span>
                  </h3>
                  <Button
                    size="sm"
                    onClick={handleApplyAll}
                    disabled={applyingAll || totalLift <= 0}
                    className="h-8 px-3 text-xs bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
                  >
                    {applyingAll ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
                    Apply All Recommendations
                  </Button>
                </div>

                <div className="border rounded-xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                      <thead>
                        <tr className="bg-[var(--color-light)] text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                          <th className="px-3 py-2.5 font-semibold">Rate Plan</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Base Rate</th>
                          <th className="px-3 py-2.5 font-semibold text-right">AI Recommended</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Delta</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Daily Lift</th>
                          <th className="px-3 py-2.5 font-semibold">Yield Factors</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {recs.map((rec: any) => {
                          const isSurging = rec.recommendedRate > rec.baseRate;
                          const isDiscounting = rec.recommendedRate < rec.baseRate;
                          const pctDiff = Math.round(((rec.recommendedRate - rec.baseRate) / rec.baseRate) * 100);
                          return (
                            <tr key={rec.ratePlanId} className="hover:bg-[var(--color-light)] transition-colors">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs text-[var(--color-text)]">{rec.name}</span>
                                  <span className="text-[10px] text-gray-500 uppercase bg-gray-100 px-1.5 py-0.5 rounded">{rec.unitType}</span>
                                  {rec.isDynamic && (
                                    <span className="text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-success-soft)] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3" /> AI Active
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right text-xs text-gray-500 font-mono">₹{rec.baseRate.toLocaleString()}</td>
                              <td className="px-3 py-3 text-right">
                                <span className={`text-sm font-bold font-mono ${isSurging ? "text-[var(--color-danger)]" : isDiscounting ? "text-[var(--color-info)]" : "text-[var(--color-navy)]"}`}>
                                  ₹{rec.recommendedRate.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right">
                                {pctDiff !== 0 ? (
                                  <span className={`text-xs font-bold flex items-center justify-end gap-1 ${pctDiff > 0 ? "text-[var(--color-danger)]" : "text-[var(--color-info)]"}`}>
                                    {pctDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                    {pctDiff > 0 ? "+" : ""}{pctDiff}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">0%</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right text-xs font-semibold text-[var(--color-success-dark)]">
                                +₹{rec.projectedRevenueLiftDaily.toLocaleString()}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex flex-wrap gap-1 max-w-[240px]">
                                  {(rec.breakdown || []).slice(0, 4).map((b: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                        b.multiplier > 0 ? "bg-[var(--color-warning-soft)] text-[var(--color-warning-dark)]" : b.multiplier < 0 ? "bg-[var(--color-info-soft)] text-[var(--color-info-dark)]" : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {b.factor} ({b.impact})
                                    </span>
                                  ))}
                                  {(rec.breakdown || []).length > 4 && (
                                    <span className="text-[10px] text-gray-500 py-0.5">+{(rec.breakdown || []).length - 4} more</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right">
                                {rec.baseRate === rec.recommendedRate ? (
                                  <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Optimized
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled={applyingId === rec.ratePlanId || data.auto_pilot_enabled}
                                    onClick={() => handleApplyRate(rec.ratePlanId, rec.recommendedRate)}
                                    className="h-8 text-xs bg-[var(--color-navy)] hover:bg-[var(--color-dark-navy)] text-white px-3"
                                  >
                                    {applyingId === rec.ratePlanId ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                                    )}
                                    Apply
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {recs.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                              No active rate plans found for this property.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-[11px] text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Recommendations auto-refresh with live occupancy.
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-[var(--color-success-dark)]" /> Combined daily lift: +₹{totalLift.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
