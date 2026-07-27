export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";
import { calculateAiRateRecommendation } from "@/lib/revenue-ai";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const ratePlans = await sql`
      SELECT * FROM rate_plans WHERE is_active = true
      ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY name ASC
    `;

    const occupancyData = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0)::int as occupied,
        COALESCE(COUNT(*)::int, 0) as total
      FROM units WHERE is_active = true
      ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
    `;

    const occupancyPct = occupancyData[0] && Number(occupancyData[0].total) > 0
      ? (Number(occupancyData[0].occupied) / Number(occupancyData[0].total)) * 100
      : 50;

    const avgLOSData = await sql`
      SELECT COALESCE(AVG(EXTRACT(DAY FROM COALESCE(check_out, check_in + INTERVAL '1 day') - check_in)), 3)::numeric as avg_los
      FROM bookings
      WHERE status IN ('confirmed', 'checked_in')
        AND check_in >= CURRENT_DATE - INTERVAL '30 days'
    `;
    const avgLOS = Number(avgLOSData[0]?.avg_los) || 3;

    const cancelData = await sql`
      SELECT 
        COALESCE(COUNT(*)::int, 0) as total,
        COALESCE(COUNT(*) FILTER (WHERE status = 'cancelled')::int, 0) as cancelled
      FROM bookings
      WHERE check_in >= CURRENT_DATE - INTERVAL '60 days'
    `;
    const cancellationRate = cancelData[0] && Number(cancelData[0].total) > 0
      ? (Number(cancelData[0].cancelled) / Number(cancelData[0].total)) * 100
      : 10;

    const vacantCountData = await sql`
      SELECT COALESCE(COUNT(*)::int, 0) as vacant
      FROM units WHERE is_active = true AND status = 'vacant'
      ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
    `;
    const vacantCount = Number(vacantCountData[0]?.vacant) || 5;

    const recommendations = ratePlans.map((rp: any) =>
      calculateAiRateRecommendation(rp, occupancyPct, new Date(), vacantCount, {
        avgLOS,
        cancellationRate,
      })
    );

    return NextResponse.json({ data: recommendations });
  } catch (error: any) {
    console.error("[revenue-ai/recommendations GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    if (body.applied) {
      const auditRows = await sql`
        INSERT INTO revenue_ai_audit (property_id, rate_plan_id, original_rate, recommended_rate, applied_rate, factors, confidence_score, applied_by, notes)
        VALUES (
          ${body.property_id},
          ${body.ratePlanId},
          ${body.originalRate},
          ${body.recommendedRate},
          ${body.recommendedRate},
          ${JSON.stringify(body.factors || [])}::jsonb,
          ${body.confidenceScore || 0},
          ${body.appliedBy || "ai_engine"},
          ${body.notes || null}
        )
        RETURNING *
      `;
      return NextResponse.json({ data: auditRows[0] }, { status: 201 });
    }

    return NextResponse.json({ data: null });
  } catch (error: any) {
    console.error("[revenue-ai/recommendations POST]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
