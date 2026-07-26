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

export interface AiRevenueForecast {
  date: string;
  predictedOccupancy: number;
  predictedADR: number;
  predictedRevPAR: number;
  confidence: number;
}

export interface AiCompetitorRate {
  competitorName: string;
  rate: number;
  rating: number;
  distance?: number;
}

export interface AiActionRecommendation {
  id: string;
  type: "rate_increase" | "rate_decrease" | "stop_sell" | "min_length_of_stay" | "promotion" | "close_group";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  urgency: "immediate" | "this_week" | "this_month";
  targetDate: string;
  estimatedImpact: number;
  parameters: Record<string, any>;
}

export function calculateAiRateRecommendation(
  ratePlan: any,
  occupancyPct: number,
  targetDate: Date = new Date(),
  vacantCount: number = 5,
  options?: {
    avgLOS?: number;
    competitorAvgRate?: number;
    cancellationRate?: number;
  }
): AiRateRecommendation {
  const baseRate = Number(ratePlan.base_rate || 3500);
  const breakdown: AiRateBreakdown[] = [];
  let totalMultiplier = 0;
  let demandLevel: "High" | "Normal" | "Low" = "Normal";

  if (occupancyPct >= 80) {
    totalMultiplier += 0.25;
    demandLevel = "High";
    breakdown.push({
      factor: `High Occupancy Surge (${Math.round(occupancyPct)}% full)`,
      impact: "+25%",
      multiplier: 0.25,
    });
  } else if (occupancyPct >= 65) {
    totalMultiplier += 0.12;
    demandLevel = "High";
    breakdown.push({
      factor: `Moderate Occupancy Surge (${Math.round(occupancyPct)}% full)`,
      impact: "+12%",
      multiplier: 0.12,
    });
  } else if (occupancyPct <= 28) {
    totalMultiplier -= 0.15;
    demandLevel = "Low";
    breakdown.push({
      factor: `Low Occupancy Incentive (${Math.round(occupancyPct)}% full)`,
      impact: "-15%",
      multiplier: -0.15,
    });
  } else {
    breakdown.push({
      factor: `Standard Occupancy Baseline (${Math.round(occupancyPct)}% full)`,
      impact: "0%",
      multiplier: 0,
    });
  }

  const day = targetDate.getDay();
  if (day === 5 || day === 6 || day === 0) {
    totalMultiplier += 0.15;
    if (demandLevel === "Normal") demandLevel = "High";
    breakdown.push({
      factor: `Weekend Demand Lift (${day === 5 ? "Friday" : day === 6 ? "Saturday" : "Sunday"})`,
      impact: "+15%",
      multiplier: 0.15,
    });
  }

  if (ratePlan.rules && typeof ratePlan.rules === "object") {
    if (ratePlan.rules.special_event_surge) {
      const eventSurge = Number(ratePlan.rules.special_event_surge) || 0;
      if (eventSurge > 0) {
        totalMultiplier += eventSurge;
        breakdown.push({
          factor: "Configured Special Event Surge",
          impact: `+${Math.round(eventSurge * 100)}%`,
          multiplier: eventSurge,
        });
      }
    }
  }

  const avgLOS = options?.avgLOS;
  if (avgLOS !== undefined) {
    if (avgLOS > 3) {
      totalMultiplier -= 0.05;
      breakdown.push({
        factor: `Length of Stay Discount (avg ${avgLOS.toFixed(1)} nights)`,
        impact: "-5%",
        multiplier: -0.05,
      });
    } else if (avgLOS < 1.5) {
      totalMultiplier += 0.08;
      breakdown.push({
        factor: `Short Stay Premium (avg ${avgLOS.toFixed(1)} nights)`,
        impact: "+8%",
        multiplier: 0.08,
      });
    }
  }

  const dateOfMonth = targetDate.getDate();
  if (dateOfMonth >= 25 && dateOfMonth <= 31) {
    totalMultiplier += 0.07;
    breakdown.push({
      factor: "Month-End Business Travel Surge",
      impact: "+7%",
      multiplier: 0.07,
    });
  }

  const competitorAvgRate = options?.competitorAvgRate;
  if (competitorAvgRate && competitorAvgRate > 0) {
    const rateRatio = baseRate / competitorAvgRate;
    if (rateRatio > 1.2) {
      totalMultiplier -= 0.10;
      if (demandLevel === "High") demandLevel = "Normal";
      breakdown.push({
        factor: "Competitor Cap (rate >20% above market)",
        impact: "-10%",
        multiplier: -0.10,
      });
    } else if (rateRatio < 0.85) {
      totalMultiplier += 0.10;
      if (demandLevel !== "High") demandLevel = "High";
      breakdown.push({
        factor: "Competitor Boost (rate >15% below market)",
        impact: "+10%",
        multiplier: 0.10,
      });
    }
  }

  const cancellationRate = options?.cancellationRate;
  if (cancellationRate !== undefined && cancellationRate > 30) {
    totalMultiplier += 0.05;
    breakdown.push({
      factor: `Cancellation Recovery Premium (${Math.round(cancellationRate)}% cancel rate)`,
      impact: "+5%",
      multiplier: 0.05,
    });
  }

  const rawRecommended = baseRate * (1 + totalMultiplier);
  const recommendedRate = Math.max(Math.round(rawRecommended / 50) * 50, Math.round(baseRate * 0.7));

  const rateDiff = recommendedRate - baseRate;
  const projectedRevenueLiftDaily = Math.round(rateDiff * Math.max(1, vacantCount));

  let confidenceScore = 95;
  if (occupancyPct > 85) confidenceScore = 98;
  else if (occupancyPct > 60) confidenceScore = 94;
  else if (occupancyPct < 25) confidenceScore = 91;
  const factorsUsed = breakdown.filter((b) => b.multiplier !== 0).length;
  if (factorsUsed >= 4) confidenceScore = Math.min(confidenceScore + 1, 99);

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
    isDynamic: Boolean(ratePlan.is_dynamic),
  };
}

export function generateRevenueForecast(
  historicalData: Array<{ date: string; occupancy: number; adr: number; revenue: number }>,
  daysAhead: number = 14
): AiRevenueForecast[] {
  if (historicalData.length === 0) {
    const today = new Date();
    const forecast: AiRevenueForecast[] = [];
    for (let i = 1; i <= daysAhead; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      forecast.push({
        date: d.toISOString().slice(0, 10),
        predictedOccupancy: 65,
        predictedADR: 3500,
        predictedRevPAR: 2275,
        confidence: 50,
      });
    }
    return forecast;
  }

  const sorted = [...historicalData].sort((a, b) => a.date.localeCompare(b.date));

  const recent28 = sorted.slice(-28);
  const avgOccupancy = recent28.reduce((s, d) => s + d.occupancy, 0) / recent28.length;
  const avgADR = recent28.reduce((s, d) => s + d.adr, 0) / recent28.length;

  const dowOccupancy: number[] = new Array(7).fill(0);
  const dowCount: number[] = new Array(7).fill(0);
  const dowADR: number[] = new Array(7).fill(0);

  for (const d of sorted) {
    const dow = new Date(d.date).getDay();
    dowOccupancy[dow] += d.occupancy;
    dowADR[dow] += d.adr;
    dowCount[dow]++;
  }

  for (let i = 0; i < 7; i++) {
    if (dowCount[i] > 0) {
      dowOccupancy[i] /= dowCount[i];
      dowADR[i] /= dowCount[i];
    } else {
      dowOccupancy[i] = avgOccupancy;
      dowADR[i] = avgADR;
    }
  }

  const recentTrendOccupancy = sorted.length >= 7
    ? sorted.slice(-7).reduce((s, d) => s + d.occupancy, 0) / 7 - avgOccupancy
    : 0;
  const recentTrendADR = sorted.length >= 7
    ? sorted.slice(-7).reduce((s, d) => s + d.adr, 0) / 7 - avgADR
    : 0;

  const today = new Date();
  const forecast: AiRevenueForecast[] = [];

  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const dateStr = d.toISOString().slice(0, 10);

    const predictedOccupancy = Math.min(100, Math.max(0,
      dowOccupancy[dow] + recentTrendOccupancy * (i / 7)
    ));
    const predictedADR = Math.max(0,
      dowADR[dow] + recentTrendADR * (i / 7)
    );
    const predictedRevPAR = (predictedOccupancy / 100) * predictedADR;

    let confidence = 85;
    if (i <= 3) confidence = 92;
    else if (i <= 7) confidence = 85;
    else if (i <= 14) confidence = 75;
    else confidence = 60;

    if (sorted.length < 14) confidence = Math.max(confidence - 15, 40);

    forecast.push({
      date: dateStr,
      predictedOccupancy: Math.round(predictedOccupancy * 100) / 100,
      predictedADR: Math.round(predictedADR),
      predictedRevPAR: Math.round(predictedRevPAR),
      confidence,
    });
  }

  return forecast;
}

export function calculateActionRecommendations(
  currentOccupancy: number,
  upcomingBookings: number,
  avgRate: number,
  competitorRates: AiCompetitorRate[],
  historicalCancellationRate: number,
  targetDate: Date
): AiActionRecommendation[] {
  const actions: AiActionRecommendation[] = [];
  const targetStr = targetDate.toISOString().slice(0, 10);

  if (currentOccupancy > 85 && avgRate > 3000) {
    actions.push({
      id: `mls-${Date.now()}`,
      type: "min_length_of_stay",
      title: "Enforce Minimum Length of Stay",
      description: `Occupancy at ${Math.round(currentOccupancy)}% with strong rates. Enforce 2-night minimum for peak dates to maximize RevPAR and reduce turnover costs.`,
      impact: "high",
      urgency: "immediate",
      targetDate: targetStr,
      estimatedImpact: Math.round(avgRate * 0.15 * upcomingBookings),
      parameters: { minNights: 2, reason: "high_occupancy_peak" },
    });
  }

  if (currentOccupancy < 40) {
    actions.push({
      id: `promo-${Date.now()}`,
      type: "promotion",
      title: "Launch Promotional Campaign",
      description: `Occupancy at only ${Math.round(currentOccupancy)}%. Recommend promotional rates to stimulate demand and improve base occupancy.`,
      impact: "high",
      urgency: "this_week",
      targetDate: targetStr,
      estimatedImpact: Math.round(avgRate * 0.20 * 10),
      parameters: { discountPct: 15, campaignDuration: 7 },
    });
  }

  if (competitorRates.length > 0) {
    const avgCompetitorRate = competitorRates.reduce((s, c) => s + c.rate, 0) / competitorRates.length;
    const undercutby = ((avgRate - avgCompetitorRate) / avgCompetitorRate) * 100;

    if (undercutby > 15) {
      const cheapest = competitorRates.reduce((min, c) => c.rate < min.rate ? c : min, competitorRates[0]);
      actions.push({
        id: `decr-${Date.now()}`,
        type: "rate_decrease",
        title: "Competitive Rate Adjustment",
        description: `Our average rate (${Math.round(avgRate)}) is ${Math.round(undercutby)}% above market avg (${Math.round(avgCompetitorRate)}). Adjust to stay competitive with ${cheapest.competitorName} at ${cheapest.rate}.`,
        impact: "high",
        urgency: "immediate",
        targetDate: targetStr,
        estimatedImpact: Math.round(-(avgRate * 0.10)),
        parameters: { targetRate: Math.round(avgCompetitorRate * 1.05), competitorRef: cheapest.competitorName },
      });
    }
  }

  if (historicalCancellationRate > 30) {
    actions.push({
      id: `stop-${Date.now()}`,
      type: "stop_sell",
      title: "Stop Sell on Select Channels",
      description: `Cancellation rate at ${Math.round(historicalCancellationRate)}% is critically high. Consider stop-sell to protect inventory and reduce overbooking risk.`,
      impact: "medium",
      urgency: "immediate",
      targetDate: targetStr,
      estimatedImpact: Math.round(avgRate * 5),
      parameters: { channels: ["ota"], reason: "high_cancellation" },
    });
  }

  const dayOfMonth = targetDate.getDate();
  if (dayOfMonth >= 25 && dayOfMonth <= 31) {
    actions.push({
      id: `inc-${Date.now()}`,
      type: "rate_increase",
      title: "Month-End Rate Premium",
      description: `Target date falls in month-end window (${targetStr}). Business travel surge expected. Apply 7-10% rate premium.`,
      impact: "medium",
      urgency: "this_month",
      targetDate: targetStr,
      estimatedImpact: Math.round(avgRate * 0.08 * upcomingBookings),
      parameters: { premiumPct: 8 },
    });
  }

  const dow = targetDate.getDay();
  if ((dow === 5 || dow === 6) && currentOccupancy > 75) {
    actions.push({
      id: `cg-${Date.now()}`,
      type: "close_group",
      title: "Close OTA Allocation for Weekend",
      description: `Weekend demand strong with ${Math.round(currentOccupancy)}% occupancy. Close group/OTA allocation to prioritize high-rate direct bookings.`,
      impact: "medium",
      urgency: "this_week",
      targetDate: targetStr,
      estimatedImpact: Math.round(avgRate * 0.12 * 5),
      parameters: { closeChannels: ["ota_group"], prioritizeDirect: true },
    });
  }

  return actions;
}
