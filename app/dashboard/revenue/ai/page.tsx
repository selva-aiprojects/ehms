"use client";

import { useState } from "react";
import {
  Brain, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Target, ShieldAlert, Percent, DollarSign, Clock, BarChart3, Users,
  ChevronRight, Zap, RefreshCw, Star, Eye,
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useJourney } from "@/components/providers/JourneyProvider";
import {
  useAiRecommendations,
  useAiForecasts,
  useAiActions,
  useCompetitorRates,
  useAiAuditTrail,
} from "@/lib/hooks";
import { useApplyAiRecommendation, useGenerateForecast } from "@/lib/hooks/mutations";
import toast from "react-hot-toast";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function demandBadge(level: "High" | "Normal" | "Low") {
  if (level === "High") return <Badge variant="red">High Demand</Badge>;
  if (level === "Low") return <Badge variant="teal">Low Demand</Badge>;
  return <Badge variant="amber">Normal</Badge>;
}

function confidenceColor(score: number) {
  if (score >= 90) return "var(--color-success)";
  if (score >= 75) return "var(--color-warning)";
  return "var(--color-danger)";
}

function actionTypeIcon(type: string) {
  switch (type) {
    case "rate_increase": return <TrendingUp className="w-4 h-4" style={{ color: "var(--color-success)" }} />;
    case "rate_decrease": return <TrendingDown className="w-4 h-4" style={{ color: "var(--color-danger)" }} />;
    case "stop_sell": return <ShieldAlert className="w-4 h-4" style={{ color: "var(--color-danger)" }} />;
    case "min_length_of_stay": return <Clock className="w-4 h-4" style={{ color: "#8B5CF6" }} />;
    case "promotion": return <Zap className="w-4 h-4" style={{ color: "var(--color-warning)" }} />;
    case "close_group": return <Target className="w-4 h-4" style={{ color: "#6366F1" }} />;
    default: return <AlertTriangle className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />;
  }
}

function urgencyBadge(urgency: string) {
  if (urgency === "immediate") return <Badge variant="red">Immediate</Badge>;
  if (urgency === "this_week") return <Badge variant="amber">This Week</Badge>;
  return <Badge variant="gray">This Month</Badge>;
}

function impactBadge(impact: string) {
  if (impact === "high") return <Badge variant="red">High Impact</Badge>;
  if (impact === "medium") return <Badge variant="amber">Medium</Badge>;
  return <Badge variant="gray">Low</Badge>;
}

function occRowColor(occ: number) {
  if (occ >= 85) return "rgba(var(--color-danger-rgb),0.06)";
  if (occ >= 65) return "rgba(var(--color-warning-rgb),0.06)";
  return "rgba(var(--color-success-rgb),0.06)";
}

export default function RevenueAiPage() {
  const { selectedPropertyId } = useJourney();
  const propId = selectedPropertyId || undefined;

  const { recommendations, isLoading: loadingRecs, mutate: mutateRecs } = useAiRecommendations(propId);
  const { forecasts, isLoading: loadingForecast, mutate: mutateForecast } = useAiForecasts(propId);
  const { actions, isLoading: loadingActions } = useAiActions(propId);
  const { competitors, isLoading: loadingCompetitors } = useCompetitorRates(propId);
  const { auditTrail, isLoading: loadingAudit } = useAiAuditTrail(propId);

  const { trigger: applyRec, isMutating: applyingRec } = useApplyAiRecommendation();
  const { trigger: genForecast, isMutating: generatingForecast } = useGenerateForecast();

  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);

  const isLoading = loadingRecs || loadingForecast || loadingActions;

  async function handleApply(rec: any) {
    try {
      await applyRec({
        property_id: propId,
        ratePlanId: rec.ratePlanId,
        originalRate: rec.baseRate,
        recommendedRate: rec.recommendedRate,
        applied: true,
        factors: rec.breakdown,
        confidenceScore: rec.confidenceScore,
        notes: "Applied from AI Revenue Manager dashboard",
      } as any);
      toast.success(`Rate updated to ${formatCurrency(rec.recommendedRate)}`);
      mutateRecs();
    } catch {
      toast.error("Failed to apply recommendation");
    }
  }

  async function handleGenerateForecast() {
    if (!propId) {
      toast.error("Select a property first");
      return;
    }
    try {
      await genForecast({ property_id: propId, daysAhead: 14 } as any);
      toast.success("Forecast generated");
      mutateForecast();
    } catch {
      toast.error("Failed to generate forecast");
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-primary)" }} />
        <span className="ml-2 text-sm" style={{ color: "var(--color-text-muted)" }}>Loading AI Revenue Manager...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb),0.12)" }}>
            <Brain className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>AI Revenue Manager</h1>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Smart rate optimization & revenue intelligence</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateForecast}
          disabled={generatingForecast}
        >
          {generatingForecast ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Generate Forecast
        </Button>
      </div>

      {/* Section 1: Rate Recommendations */}
      <Card>
        <CardHeader
          title="Rate Recommendations"
          subtitle="AI-optimized rates based on demand, occupancy & market conditions"
          action={
            <div className="flex items-center gap-2">
              <Badge variant="teal">{recommendations.length} plans</Badge>
            </div>
          }
        />
        {recommendations.length === 0 ? (
          <div className="text-center py-10">
            <Brain className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-border-strong)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No rate plans configured. Add rate plans to get AI recommendations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommendations.map((rec: any) => {
              const lift = rec.recommendedRate - rec.baseRate;
              const isExpanded = expandedBreakdown === rec.ratePlanId;
              return (
                <div
                  key={rec.ratePlanId}
                  className="rounded-xl p-4 transition-all hover:shadow-md"
                  style={{ border: "1px solid var(--color-border)", background: "var(--color-light)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{rec.name}</p>
                      <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>{rec.unitType}</p>
                    </div>
                    {demandBadge(rec.demandLevel)}
                  </div>

                  <div className="flex items-baseline gap-3 mb-3">
                    <div>
                      <p className="text-[10px] uppercase" style={{ color: "var(--color-text-faint)" }}>Current</p>
                      <p className="text-lg font-bold" style={{ color: "var(--color-text-muted)" }}>{formatCurrency(rec.baseRate)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 mt-4" style={{ color: "var(--color-text-faint)" }} />
                    <div>
                      <p className="text-[10px] uppercase" style={{ color: "var(--color-text-faint)" }}>Recommended</p>
                      <p className="text-lg font-bold" style={{ color: rec.recommendedRate > rec.baseRate ? "var(--color-success)" : rec.recommendedRate < rec.baseRate ? "var(--color-danger)" : "var(--color-navy)" }}>
                        {formatCurrency(rec.recommendedRate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: confidenceColor(rec.confidenceScore) }}
                      />
                      <span className="text-[11px] font-medium" style={{ color: confidenceColor(rec.confidenceScore) }}>
                        {rec.confidenceScore}% confidence
                      </span>
                    </div>
                    <span className="text-[11px]" style={{ color: lift >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                      {lift >= 0 ? "+" : ""}{formatCurrency(lift)} / room
                    </span>
                    {rec.projectedRevenueLiftDaily > 0 && (
                      <span className="text-[11px] font-medium" style={{ color: "var(--color-primary)" }}>
                        +{formatCurrency(rec.projectedRevenueLiftDaily)}/day
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedBreakdown(isExpanded ? null : rec.ratePlanId)}
                    className="text-[11px] font-medium mb-2 underline"
                    style={{ color: "var(--color-info)" }}
                  >
                    {isExpanded ? "Hide breakdown" : "View factors"}
                  </button>

                  {isExpanded && (
                    <div className="space-y-1.5 mb-3 p-2 rounded-lg" style={{ background: "var(--color-light)" }}>
                      {rec.breakdown.map((b: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span style={{ color: "var(--color-text)" }}>{b.factor}</span>
                          <span className="font-medium" style={{ color: b.multiplier > 0 ? "var(--color-success)" : b.multiplier < 0 ? "var(--color-danger)" : "var(--color-text-muted)" }}>
                            {b.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleApply(rec)}
                    disabled={applyingRec}
                  >
                    {applyingRec ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Apply Rate
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Section 2 & 3: Forecast + Actions side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Forecast */}
        <Card>
          <CardHeader
            title="Revenue Forecast"
            subtitle="14-day predictive outlook"
            action={
              <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                {forecasts.length} days
              </span>
            }
          />
          {forecasts.length === 0 ? (
            <div className="text-center py-10">
              <BarChart3 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-border-strong)" }} />
              <p className="text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>No forecast data yet</p>
              <Button variant="outline" size="sm" onClick={handleGenerateForecast} disabled={generatingForecast}>
                Generate Forecast
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--color-text-muted)" }}>Date</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--color-text-muted)" }}>Occupancy</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--color-text-muted)" }}>ADR</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--color-text-muted)" }}>RevPAR</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--color-text-muted)" }}>Conf</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.slice(0, 14).map((f: any) => (
                    <tr
                      key={f.date}
                      style={{
                        borderBottom: "1px solid var(--color-light)",
                        background: occRowColor(f.predictedOccupancy),
                      }}
                    >
                      <td className="py-2 px-2 font-medium" style={{ color: "var(--color-navy)" }}>
                        {new Date(f.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                      </td>
                      <td className="text-right py-2 px-2" style={{ color: "var(--color-text)" }}>
                        {Number(f.predictedOccupancy).toFixed(1)}%
                      </td>
                      <td className="text-right py-2 px-2" style={{ color: "var(--color-text)" }}>
                        {formatCurrency(Number(f.predictedADR))}
                      </td>
                      <td className="text-right py-2 px-2 font-medium" style={{ color: "var(--color-navy)" }}>
                        {formatCurrency(Number(f.predictedRevPAR))}
                      </td>
                      <td className="text-right py-2 px-2">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{
                            background: `${confidenceColor(f.confidence)}15`,
                            color: confidenceColor(f.confidence),
                          }}
                        >
                          {f.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Action Center */}
        <Card>
          <CardHeader
            title="Action Center"
            subtitle="Priority recommendations"
            action={
              <Badge variant="navy">{actions.length} actions</Badge>
            }
          />
          {actions.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-success)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>All clear! No urgent actions needed.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {actions.map((action: any) => (
                <div
                  key={action.id}
                  className="rounded-lg p-3 transition-all hover:shadow-sm"
                  style={{ border: "1px solid var(--color-border)", background: "var(--color-light)" }}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--color-light)" }}>
                      {actionTypeIcon(action.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-xs font-semibold" style={{ color: "var(--color-navy)" }}>{action.title}</p>
                        {urgencyBadge(action.urgency)}
                        {impactBadge(action.impact)}
                      </div>
                      <p className="text-[11px] mb-1.5" style={{ color: "var(--color-text-muted)" }}>{action.description}</p>
                      <div className="flex items-center gap-3">
                        {action.estimatedImpact > 0 && (
                          <span className="text-[11px] font-medium" style={{ color: "var(--color-success)" }}>
                            Est. +{formatCurrency(action.estimatedImpact)}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>
                          Target: {action.targetDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Section 4: Competitors + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitor Analysis */}
        <Card>
          <CardHeader
            title="Competitor Analysis"
            subtitle="Market rate intelligence"
            action={
              <Badge variant="gray">{competitors.length} competitors</Badge>
            }
          />
          {competitors.length === 0 ? (
            <div className="text-center py-10">
              <Eye className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-border-strong)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No competitor data. Add competitors to track market rates.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--color-text-muted)" }}>Competitor</th>
                    <th className="text-center py-2 px-2 font-medium" style={{ color: "var(--color-text-muted)" }}>Rating</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--color-text-muted)" }}>Distance</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: "var(--color-text-muted)" }}>Rate</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--color-text-muted)" }}>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c: any) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--color-light)" }}>
                      <td className="py-2 px-2 font-medium" style={{ color: "var(--color-navy)" }}>{c.competitor_name}</td>
                      <td className="text-center py-2 px-2">
                        <span className="inline-flex items-center gap-0.5" style={{ color: "var(--color-warning)" }}>
                          <Star className="w-3 h-3 fill-current" />
                          {c.competitor_rating || "N/A"}
                        </span>
                      </td>
                      <td className="text-right py-2 px-2" style={{ color: "var(--color-text-muted)" }}>
                        {c.distance_km ? `${c.distance_km} km` : "-"}
                      </td>
                      <td className="text-right py-2 px-2 font-medium" style={{ color: "var(--color-navy)" }}>
                        {formatCurrency(Number(c.rate))}
                      </td>
                      <td className="py-2 px-2" style={{ color: "var(--color-text-faint)" }}>{c.source || "manual"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Audit Trail */}
        <Card>
          <CardHeader
            title="Rate Change Audit"
            subtitle="History of applied AI rate changes"
          />
          {auditTrail.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-border-strong)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No rate changes applied yet. Apply a recommendation to see history.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {auditTrail.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{ background: "var(--color-light)", border: "1px solid var(--color-light)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(var(--color-primary-rgb),0.12)" }}
                  >
                    <DollarSign className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: "var(--color-navy)" }}>
                        {formatCurrency(Number(entry.original_rate))} &rarr; {formatCurrency(Number(entry.applied_rate))}
                      </span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          background: Number(entry.applied_rate) > Number(entry.original_rate)
                            ? "rgba(var(--color-success-rgb),0.12)"
                            : "rgba(var(--color-danger-rgb),0.10)",
                          color: Number(entry.applied_rate) > Number(entry.original_rate) ? "var(--color-success)" : "var(--color-danger)",
                        }}
                      >
                        {Number(entry.applied_rate) > Number(entry.original_rate) ? "+" : ""}
                        {((Number(entry.applied_rate) - Number(entry.original_rate)) / Number(entry.original_rate) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>
                      {entry.applied_by} &middot; {new Date(entry.applied_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
