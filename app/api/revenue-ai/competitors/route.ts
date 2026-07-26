export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT * FROM competitor_rates
      WHERE 1=1
        ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY scraped_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[revenue-ai/competitors GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO competitor_rates (property_id, competitor_name, competitor_rating, distance_km, room_type, rate, currency, source)
      VALUES (
        ${body.property_id},
        ${body.competitor_name},
        ${body.competitor_rating || null},
        ${body.distance_km || null},
        ${body.room_type || null},
        ${body.rate},
        ${body.currency || "INR"},
        ${body.source || "manual"}
      )
      RETURNING *
    `;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[revenue-ai/competitors POST]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
