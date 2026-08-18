"use client";

import { useState } from "react";
import { Tag, Loader2, Plus, Trash2 } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { usePricingRules, usePricingSeasons } from "@/lib/hooks";
import { useCreatePricingRule, useCreatePricingSeason } from "@/lib/hooks/mutations";
import { useJourney } from "@/components/providers/JourneyProvider";

const RULE_TYPES = [
  { value: "occupancy", label: "Occupancy-Based" },
  { value: "day_of_week", label: "Day of Week" },
  { value: "season", label: "Season" },
  { value: "length_of_stay", label: "Length of Stay" },
  { value: "last_minute", label: "Last Minute" },
  { value: "festival", label: "Festival/Event" },
  { value: "minimum_stay", label: "Minimum Stay" },
];

const SEASON_COLORS = ["var(--color-info)", "var(--color-success)", "var(--color-warning)", "var(--color-danger)", "#8B5CF6", "#EC4899"];

export default function PricingPage() {
  const { selectedPropertyId } = useJourney();
  const [tab, setTab] = useState<"rules" | "seasons">("rules");
  const [showForm, setShowForm] = useState(false);

  const { rules, isLoading: loadingRules } = usePricingRules(selectedPropertyId || undefined);
  const { seasons, isLoading: loadingSeasons } = usePricingSeasons(selectedPropertyId || undefined);
  const { trigger: createRule, isMutating: creatingRule } = useCreatePricingRule();
  const { trigger: createSeason, isMutating: creatingSeason } = useCreatePricingSeason();

  // Rule form state
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState("occupancy");
  const [ruleConditions, setRuleConditions] = useState("{}");
  const [ruleAdjustments, setRuleAdjustments] = useState('{"multiplier": 1.1}');
  const [rulePriority, setRulePriority] = useState(0);

  // Season form state
  const [seasonName, setSeasonName] = useState("");
  const [seasonStart, setSeasonStart] = useState("");
  const [seasonEnd, setSeasonEnd] = useState("");
  const [seasonMultiplier, setSeasonMultiplier] = useState(1.0);
  const [seasonColor, setSeasonColor] = useState(SEASON_COLORS[0]);

  const handleCreateRule = async () => {
    if (!ruleName || !selectedPropertyId) return;
    try {
      await createRule({
        property_id: selectedPropertyId,
        name: ruleName,
        rule_type: ruleType,
        conditions: JSON.parse(ruleConditions),
        adjustments: JSON.parse(ruleAdjustments),
        priority: rulePriority,
      });
      setShowForm(false);
      setRuleName("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSeason = async () => {
    if (!seasonName || !seasonStart || !seasonEnd || !selectedPropertyId) return;
    try {
      await createSeason({
        property_id: selectedPropertyId,
        name: seasonName,
        start_date: seasonStart,
        end_date: seasonEnd,
        multiplier: seasonMultiplier,
        color: seasonColor,
      });
      setShowForm(false);
      setSeasonName("");
    } catch (e) {
      console.error(e);
    }
  };

  const isLoading = loadingRules || loadingSeasons;

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-warning-rgb),0.10)" }}>
            <Tag className="w-5 h-5" style={{ color: "var(--color-warning)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Dynamic Pricing</h1>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Manage pricing rules and seasonal rates</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          {tab === "rules" ? "New Rule" : "New Season"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--color-light)", width: "fit-content" }}>
        {(["rules", "seasons"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setShowForm(false); }}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${tab === t ? "bg-white shadow-sm" : ""}`}
            style={{ color: tab === t ? "var(--color-navy)" : "var(--color-text-muted)" }}
          >
            {t === "rules" ? "Pricing Rules" : "Seasons"}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader title={tab === "rules" ? "Create Pricing Rule" : "Create Season"} action={
            <button onClick={() => setShowForm(false)} className="text-xs cursor-pointer" style={{ color: "var(--color-text-muted)" }}>Cancel</button>
          } />
          {tab === "rules" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Rule Name</label>
                <input value={ruleName} onChange={(e) => setRuleName(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }} placeholder="e.g. Weekend Surge" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Rule Type</label>
                <select value={ruleType} onChange={(e) => setRuleType(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }}>
                  {RULE_TYPES.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Priority</label>
                <input type="number" value={rulePriority} onChange={(e) => setRulePriority(parseInt(e.target.value))} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Conditions (JSON)</label>
                <textarea value={ruleConditions} onChange={(e) => setRuleConditions(e.target.value)} className="w-full text-xs font-mono border rounded-lg px-3 py-2" rows={3} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Adjustments (JSON)</label>
                <textarea value={ruleAdjustments} onChange={(e) => setRuleAdjustments(e.target.value)} className="w-full text-xs font-mono border rounded-lg px-3 py-2" rows={3} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreateRule} disabled={creatingRule || !ruleName}>
                  {creatingRule ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Rule"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Season Name</label>
                <input value={seasonName} onChange={(e) => setSeasonName(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }} placeholder="e.g. Peak Season" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Start Date</label>
                <input type="date" value={seasonStart} onChange={(e) => setSeasonStart(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>End Date</label>
                <input type="date" value={seasonEnd} onChange={(e) => setSeasonEnd(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Rate Multiplier</label>
                <input type="number" step="0.1" min="0.5" max="5.0" value={seasonMultiplier} onChange={(e) => setSeasonMultiplier(parseFloat(e.target.value))} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleCreateSeason} disabled={creatingSeason || !seasonName}>
                  {creatingSeason ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Season"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Data */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-info)" }} />
        </div>
      ) : tab === "rules" ? (
        <Card padding={false}>
          {rules.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-border-strong)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>No pricing rules yet. Create your first rule to enable dynamic pricing.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--color-light)" }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Name</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Type</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Priority</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Adjustments</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {rules.map((rule: any) => (
                  <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "var(--color-navy)" }}>{rule.name}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="navy">{RULE_TYPES.find((r) => r.value === rule.rule_type)?.label || rule.rule_type}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--color-text-muted)" }}>{rule.priority}</td>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
                      {JSON.stringify(rule.adjustments)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={rule.is_active ? "teal" : "gray"}>{rule.is_active ? "Active" : "Inactive"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ) : (
        <Card padding={false}>
          {seasons.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-border-strong)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>No seasons defined. Create seasons to apply rate multipliers for specific date ranges.</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {seasons.map((season: any) => (
                <div key={season.id} className="flex items-center gap-4 p-3 rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ background: season.color || "var(--color-info)" }} />
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: "var(--color-navy)" }}>{season.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>
                      {season.start_date} to {season.end_date}
                    </p>
                  </div>
                  <Badge variant={Number(season.multiplier) >= 1 ? "amber" : "teal"}>
                    {Number(season.multiplier) >= 1 ? "+" : ""}{Math.round((Number(season.multiplier) - 1) * 100)}%
                  </Badge>
                  <span className="text-xs font-medium" style={{ color: "var(--color-navy)" }}>
                    {Number(season.multiplier)}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
