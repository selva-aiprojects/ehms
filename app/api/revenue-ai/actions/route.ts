export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";
import { calculateActionRecommendations } from "@/lib/revenue-ai";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const occData = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0)::int as occupied,
        COALESCE(COUNT(*)::int, 0) as total
      FROM units WHERE is_active = true
      ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
    `;
    const currentOccupancy = occData[0] && Number(occData[0].total) > 0
      ? (Number(occData[0].occupied) / Number(occData[0].total)) * 100
      : 50;

    const bookingData = await sql`
      SELECT COALESCE(COUNT(*)::int, 0) as upcoming
      FROM bookings
      WHERE status IN ('confirmed')
        AND check_in BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
    `;
    const upcomingBookings = Number(bookingData[0]?.upcoming) || 5;

    const rateData = await sql`
      SELECT COALESCE(AVG(base_rate), 3500) as avg_rate
      FROM rate_plans WHERE is_active = true
      ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
    `;
    const avgRate = Number(rateData[0]?.avg_rate) || 3500;

    const compRows = await sql`
      SELECT competitor_name as "competitorName", rate, competitor_rating as rating, distance_km as distance
      FROM competitor_rates
      WHERE 1=1
        ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY scraped_at DESC
      LIMIT 20
    `;
    const competitorRates = compRows.map((r: any) => ({
      competitorName: r.competitorName,
      rate: Number(r.rate),
      rating: Number(r.rating),
      distance: r.distance ? Number(r.distance) : undefined,
    }));

    const cancelData = await sql`
      SELECT
        COALESCE(COUNT(*)::int, 0) as total,
        COALESCE(COUNT(*) FILTER (WHERE status = 'cancelled')::int, 0) as cancelled
      FROM bookings
      WHERE check_in >= CURRENT_DATE - INTERVAL '60 days'
    `;
    const historicalCancellationRate = cancelData[0] && Number(cancelData[0].total) > 0
      ? (Number(cancelData[0].cancelled) / Number(cancelData[0].total)) * 100
      : 10;

    const actions = calculateActionRecommendations(
      currentOccupancy,
      upcomingBookings,
      avgRate,
      competitorRates,
      historicalCancellationRate,
      new Date()
    );

    return NextResponse.json({ data: actions });
  } catch (error: any) {
    console.error("[revenue-ai/actions GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
