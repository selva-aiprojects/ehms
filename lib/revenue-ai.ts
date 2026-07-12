export interface AiRateBreakdown {
  factor: string;
  impact: string;
  multiplier: number;
}

export interface AiRateRecommendation {
  ratePlanId: string;
  unitType: string;
  name: string;
  baseRate: number;
  recommendedRate: number;
  demandLevel: "High" | "Normal" | "Low";
  occupancyPct: number;
  confidenceScore: number;
  breakdown: AiRateBreakdown[];
  projectedRevenueLiftDaily: number;
  isDynamic: boolean;
}

export function calculateAiRateRecommendation(
  ratePlan: any,
  occupancyPct: number,
  targetDate: Date = new Date(),
  vacantCount: number = 5
): AiRateRecommendation {
  const baseRate = Number(ratePlan.base_rate || 3500);
  const breakdown: AiRateBreakdown[] = [];
  let totalMultiplier = 0;
  let demandLevel: "High" | "Normal" | "Low" = "Normal";

  // 1. Occupancy Velocity Scaling
  if (occupancyPct >= 80) {
    totalMultiplier += 0.25;
    demandLevel = "High";
    breakdown.push({
      factor: `High Occupancy Surge (${Math.round(occupancyPct)}% full)`,
      impact: "+25%",
      multiplier: 0.25
    });
  } else if (occupancyPct >= 65) {
    totalMultiplier += 0.12;
    demandLevel = "High";
    breakdown.push({
      factor: `Moderate Occupancy Surge (${Math.round(occupancyPct)}% full)`,
      impact: "+12%",
      multiplier: 0.12
    });
  } else if (occupancyPct <= 28) {
    totalMultiplier -= 0.15;
    demandLevel = "Low";
    breakdown.push({
      factor: `Low Occupancy Incentive (${Math.round(occupancyPct)}% full)`,
      impact: "-15%",
      multiplier: -0.15
    });
  } else {
    breakdown.push({
      factor: `Standard Occupancy Baseline (${Math.round(occupancyPct)}% full)`,
      impact: "0%",
      multiplier: 0
    });
  }

  // 2. Day-of-Week & Weekend Modifiers
  const day = targetDate.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
  if (day === 5 || day === 6 || day === 0) {
    totalMultiplier += 0.15;
    if (demandLevel === "Normal") demandLevel = "High";
    breakdown.push({
      factor: `Weekend Demand Lift (${day === 5 ? "Friday" : day === 6 ? "Saturday" : "Sunday"})`,
      impact: "+15%",
      multiplier: 0.15
    });
  }

  // 3. Check custom rules inside ratePlan.rules if present
  if (ratePlan.rules && typeof ratePlan.rules === "object") {
    if (ratePlan.rules.special_event_surge) {
      const eventSurge = Number(ratePlan.rules.special_event_surge) || 0;
      if (eventSurge > 0) {
        totalMultiplier += eventSurge;
        breakdown.push({
          factor: "Configured Special Event Surge",
          impact: `+${Math.round(eventSurge * 100)}%`,
          multiplier: eventSurge
        });
      }
    }
  }

  // Calculate recommended rate (rounded to nearest 50 INR/unit)
  const rawRecommended = baseRate * (1 + totalMultiplier);
  const recommendedRate = Math.max(Math.round(rawRecommended / 50) * 50, Math.round(baseRate * 0.7));

  // Projected daily revenue lift if all remaining vacant rooms in this category are booked at recommended rate
  const rateDiff = recommendedRate - baseRate;
  const projectedRevenueLiftDaily = Math.round(rateDiff * Math.max(1, vacantCount));

  // Confidence score calculation
  const confidenceScore = occupancyPct > 85 ? 98 : occupancyPct > 60 ? 94 : occupancyPct < 25 ? 91 : 95;

  return {
    ratePlanId: ratePlan.id,
    unitType: ratePlan.unit_type || "room",
    name: ratePlan.name || "Standard Rate Plan",
    baseRate,
    recommendedRate,
    demandLevel,
    occupancyPct: Math.round(occupancyPct),
    confidenceScore,
    breakdown,
    projectedRevenueLiftDaily,
    isDynamic: Boolean(ratePlan.is_dynamic)
  };
}
