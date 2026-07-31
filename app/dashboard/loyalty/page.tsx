"use client";

import { useState } from "react";
import { Trophy, Loader2, Star, Award, Gift } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useLoyaltyTiers, useGuests } from "@/lib/hooks";
import { useAdjustLoyaltyPoints } from "@/lib/hooks/mutations";
import { useJourney } from "@/components/providers/JourneyProvider";

const TIER_ICONS: Record<string, any> = {
  silver: Star,
  gold: Award,
  platinum: Trophy,
};

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  silver: { bg: "var(--color-light)", text: "var(--color-text-muted)", border: "var(--color-border-strong)" },
  gold: { bg: "var(--color-warning-soft)", text: "var(--color-warning)", border: "var(--color-warning)" },
  platinum: { bg: "#F5F3FF", text: "#7C3AED", border: "#C4B5FD" },
};

export default function LoyaltyPage() {
  const { selectedPropertyId } = useJourney();
  const { tiers, isLoading } = useLoyaltyTiers(selectedPropertyId || undefined);
  const { guests } = useGuests();
  const { trigger: adjustPoints, isMutating } = useAdjustLoyaltyPoints();

  const [selectedGuest, setSelectedGuest] = useState("");
  const [points, setPoints] = useState(0);
  const [description, setDescription] = useState("");

  const handleAdjustPoints = async (type: "earned" | "bonus" | "redeemed") => {
    if (!selectedGuest || points === 0) return;
    await adjustPoints({
      guest_id: selectedGuest,
      points: Math.abs(points),
      type,
      description: description || `Manual ${type} adjustment`,
    });
    setSelectedGuest("");
    setPoints(0);
    setDescription("");
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-info)" }} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--color-warning-rgb),0.10)" }}>
          <Trophy className="w-5 h-5" style={{ color: "var(--color-warning)" }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>Loyalty Program</h1>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Manage tiers, points, and guest rewards</p>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.length > 0 ? tiers.map((tier: any) => {
          const Icon = TIER_ICONS[tier.name.toLowerCase()] || Star;
          const colors = TIER_COLORS[tier.name.toLowerCase()] || TIER_COLORS.silver;
          return (
            <Card key={tier.id}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                  <Icon className="w-6 h-6" style={{ color: colors.text }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold" style={{ color: "var(--color-navy)" }}>{tier.name}</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-faint)" }}>
                    {tier.min_stays}+ stays • ₹{(Number(tier.min_spend) / 1000).toFixed(0)}K+ spend
                  </p>
                </div>
                <Badge variant={Number(tier.discount_pct) > 0 ? "teal" : "gray"}>
                  {Number(tier.discount_pct)}% off
                </Badge>
              </div>
              {tier.benefits && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {(Array.isArray(tier.benefits) ? tier.benefits : []).map((b: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--color-light)", color: "var(--color-text-muted)" }}>
                      {b}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-medium" style={{ color: "var(--color-text-faint)" }}>Points multiplier:</span>
                <Badge variant="navy">{Number(tier.points_multiplier)}x</Badge>
              </div>
            </Card>
          );
        }) : (
          <Card className="col-span-3">
            <div className="py-8 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-border-strong)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-faint)" }}>No loyalty tiers configured. Run the migration to seed default tiers.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Points Adjustment */}
      <Card>
        <CardHeader title="Adjust Guest Points" subtitle="Award or redeem loyalty points manually" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Guest</label>
            <select value={selectedGuest} onChange={(e) => setSelectedGuest(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }}>
              <option value="">Select guest...</option>
              {(guests || []).map((g: any) => (
                <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Points</label>
            <input type="number" value={points || ""} onChange={(e) => setPoints(parseInt(e.target.value) || 0)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }} placeholder="e.g. 500" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "var(--color-border)" }} placeholder="e.g. Birthday bonus" />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => handleAdjustPoints("earned")} disabled={!selectedGuest || points === 0 || isMutating}>
              {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gift className="w-4 h-4" /> Award</>}
            </Button>
            <Button variant="outline" onClick={() => handleAdjustPoints("redeemed")} disabled={!selectedGuest || points === 0 || isMutating}>
              Redeem
            </Button>
          </div>
        </div>
      </Card>

      {/* Top Members */}
      <Card>
        <CardHeader title="Top Loyalty Members" subtitle="Guests with the highest points" />
        {guests && guests.length > 0 ? (
          <div className="space-y-2">
            {guests
              .filter((g: any) => Number(g.loyalty_points) > 0)
              .sort((a: any, b: any) => Number(b.loyalty_points) - Number(a.loyalty_points))
              .slice(0, 10)
              .map((guest: any, i: number) => (
                <div key={guest.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: "var(--color-light)" }}>
                  <span className="text-xs font-bold w-6 text-center" style={{ color: i < 3 ? "var(--color-warning)" : "var(--color-text-faint)" }}>
                    #{i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: "var(--color-navy)" }}>{guest.first_name} {guest.last_name}</p>
                    <p className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>{guest.total_stays || 0} stays</p>
                  </div>
                  <Badge variant={Number(guest.loyalty_points) >= 1000 ? "amber" : "gray"}>
                    {Number(guest.loyalty_points).toLocaleString()} pts
                  </Badge>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-xs text-center py-8" style={{ color: "var(--color-text-faint)" }}>No loyalty members yet</p>
        )}
      </Card>
    </div>
  );
}
