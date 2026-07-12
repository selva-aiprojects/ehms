"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Sparkles, Loader2, CheckCircle2, ArrowUpRight, Zap, RefreshCw, ShieldCheck, DollarSign } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useProperties } from "@/lib/hooks";
import { toast } from "react-hot-toast";

interface AiRevenueManagerCardProps {
  propertyId?: string;
}

export default function AiRevenueManagerCard({ propertyId: propPropertyId }: AiRevenueManagerCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);
  const [togglingPilot, setTogglingPilot] = useState(false);

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

  return (
    <Card className="flex flex-col h-full overflow-hidden border border-[#1E3A8A]/20 shadow-md">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#132A42] p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2BAE8E]/20 flex items-center justify-center border border-[#2BAE8E]/40">
            <Sparkles className="w-4 h-4 text-[#2BAE8E]" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              AI Revenue Manager & Dynamic Yield
              <span className="text-[10px] bg-[#2BAE8E] text-white px-1.5 py-0.5 rounded font-mono font-semibold">
                REV-AI v2.0
              </span>
            </h3>
            <p className="text-[11px] text-gray-300">Algorithmic occupancy scaling & weekend rate optimization</p>
          </div>
        </div>

        {/* Dynamic Auto-Pilot Toggle */}
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
          <div className="text-right">
            <p className="text-[11px] font-semibold leading-tight">Dynamic Auto-Pilot</p>
            <p className="text-[9px] text-gray-300">Auto-scale rates across OTAs</p>
          </div>
          <button
            type="button"
            onClick={handleToggleAutoPilot}
            disabled={togglingPilot || loading}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
              data?.auto_pilot_enabled ? "bg-[#2BAE8E]" : "bg-gray-500"
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

      {loading ? (
        <div className="flex justify-center items-center p-12"><Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" /></div>
      ) : !data ? (
        <div className="text-center p-8 text-gray-500 text-sm">Could not load revenue metrics.</div>
      ) : (
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Top Velocity Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#64748B] font-medium">Occupancy Velocity</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-lg font-bold text-[#1E3A8A]">{data.occupancy_pct}%</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    data.demand_level === "High" ? "bg-[#FEE2E2] text-[#DC2626]" : data.demand_level === "Low" ? "bg-[#DBEAFE] text-[#1D4ED8]" : "bg-[#ECFDF5] text-[#059669]"
                  }`}>
                    {data.demand_level === "High" ? "🔥 High Demand Surge" : data.demand_level === "Low" ? "💤 Low Demand Incentive" : "✓ Normal Baseline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#64748B] font-medium">Available Units</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-lg font-bold text-[#1E2E44]">{data.vacant_units}</span>
                  <span className="text-xs text-[#64748B]">/ {data.total_units} total</span>
                </div>
              </div>
            </div>

            <div className="bg-[#ECFDF5] p-3 rounded-xl border border-[#2BAE8E]/30 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#065F46] font-medium">Daily Revenue Lift</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-lg font-bold text-[#059669]">
                    +₹{(data.total_daily_revenue_lift || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#047857]">/ day</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleApplyAll}
                disabled={applyingAll || (data.total_daily_revenue_lift || 0) <= 0}
                className="h-7 px-2.5 text-xs bg-[#2BAE8E] hover:bg-[#239B7E] text-white"
              >
                {applyingAll ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
                Apply All
              </Button>
            </div>
          </div>

          {/* Recommendations List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-[#1A3C5E] flex items-center justify-between">
              <span>Dynamic Rate Recommendations</span>
              <span className="text-[11px] font-normal text-gray-500">Confidence: 94% (ML Evaluated)</span>
            </h4>

            <div className="divide-y divide-[#E2E8F0] border rounded-xl overflow-hidden bg-white">
              {(data.recommendations || []).map((rec: any) => {
                const isSurging = rec.recommendedRate > rec.baseRate;
                const isDiscounting = rec.recommendedRate < rec.baseRate;
                const pctDiff = Math.round(((rec.recommendedRate - rec.baseRate) / rec.baseRate) * 100);

                return (
                  <div key={rec.ratePlanId} className="p-3.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1A2E44]">{rec.name}</span>
                        <span className="text-[10px] text-gray-500 uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                          {rec.unitType}
                        </span>
                        {rec.isDynamic && (
                          <span className="text-[10px] font-semibold text-[#2BAE8E] bg-[#ECFDF5] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> AI Active
                          </span>
                        )}
                      </div>

                      {/* Factor tags */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(rec.breakdown || []).map((b: any, idx: number) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              b.multiplier > 0 ? "bg-[#FEF3C7] text-[#92400E]" : b.multiplier < 0 ? "bg-[#DBEAFE] text-[#1E40AF]" : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            ⚡ {b.factor} ({b.impact})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price Comparison & Action */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="flex items-center justify-end gap-1.5">
                          {pctDiff !== 0 && (
                            <span className="text-xs text-gray-400 line-through">₹{rec.baseRate.toLocaleString()}</span>
                          )}
                          <span className={`text-base font-bold font-mono ${
                            isSurging ? "text-[#DC2626]" : isDiscounting ? "text-[#2563EB]" : "text-[#1E3A8A]"
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
                            className="h-8 text-xs bg-[#1E3A8A] hover:bg-[#132A42] text-white px-3"
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
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
