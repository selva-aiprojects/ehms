export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";
import { generateRevenueForecast } from "@/lib/revenue-ai";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT * FROM revenue_ai_forecasts
      WHERE 1=1
        ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY forecast_date ASC
      LIMIT 100
    `;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[revenue-ai/forecast GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const historicalData = await sql`
      SELECT 
        DATE(created_at) as date,
        COALESCE(AVG(CASE WHEN status = 'occupied' THEN 100.0 ELSE 0.0 END), 50) as occupancy,
        COALESCE(AVG(total_amount), 3500) as adr,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM reservations
      WHERE created_at >= NOW() - INTERVAL '60 days'
        ${body.property_id ? sql`AND property_id = ${body.property_id}` : sql``}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const mapped = historicalData.map((r: any) => ({
      date: String(r.date),
      occupancy: Number(r.occupancy) || 50,
      adr: Number(r.adr) || 3500,
      revenue: Number(r.revenue) || 0,
    }));

    const forecast = generateRevenueForecast(mapped, body.daysAhead || 14);

    for (const f of forecast) {
      await sql`
        INSERT INTO revenue_ai_forecasts (property_id, forecast_date, predicted_occupancy, predicted_adr, predicted_revpar, confidence)
        VALUES (${body.property_id}, ${f.date}::date, ${f.predictedOccupancy}, ${f.predictedADR}, ${f.predictedRevPAR}, ${f.confidence})
        ON CONFLICT (property_id, forecast_date)
        DO UPDATE SET
          predicted_occupancy = EXCLUDED.predicted_occupancy,
          predicted_adr = EXCLUDED.predicted_adr,
          predicted_revpar = EXCLUDED.predicted_revpar,
          confidence = EXCLUDED.confidence,
          generated_at = now()
      `;
    }

    const rows = await sql`
      SELECT * FROM revenue_ai_forecasts
      WHERE property_id = ${body.property_id}
      ORDER BY forecast_date ASC
      LIMIT 100
    `;
    return NextResponse.json({ data: rows }, { status: 201 });
  } catch (error: any) {
    console.error("[revenue-ai/forecast POST]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
