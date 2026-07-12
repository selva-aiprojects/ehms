/**
 * lib/pricing.ts
 * Flexible check-in/out and micro-stay pricing calculator
 */
export function calculateBookingPrice(
  bookingModel: "nightly" | "hourly" | "lease" | "membership",
  baseRate: number,
  checkIn: Date,
  checkOut: Date
): { totalAmount: number; hours: number; nights: number } {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const diffHrs = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));

  if (bookingModel === "hourly") {
    // Roll over extra full days (24h blocks)
    const daysPart = Math.floor(diffHrs / 24);
    const hourlyPart = diffHrs % 24;
    let baseAmount = daysPart * baseRate;

    if (hourlyPart > 0) {
      let partMultiplier = 1.0;
      if (hourlyPart <= 3) partMultiplier = 0.3;       // 3 hours = 30% of day base
      else if (hourlyPart <= 6) partMultiplier = 0.5;  // 6 hours = 50% of day base
      else if (hourlyPart <= 12) partMultiplier = 0.7; // 12 hours = 70% of day base
      // Above 12 hours up to 24 hours rolls over to 100% (1.0)
      
      baseAmount += baseRate * partMultiplier;
    }

    return { 
      totalAmount: Math.round(baseAmount), 
      hours: diffHrs, 
      nights: Math.ceil(diffHrs / 24) 
    };
  }

  // Nightly booking check
  const diffNights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return { 
    totalAmount: baseRate * diffNights, 
    hours: diffHrs, 
    nights: diffNights 
  };
}
