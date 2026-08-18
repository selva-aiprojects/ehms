export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT * FROM pricing_seasons
      WHERE is_active = true
        ${propertyId ? sql`AND property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY start_date ASC
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[pricing/seasons GET]", error);
    return NextResponse.json({ error: "Failed to fetch pricing seasons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO pricing_seasons (property_id, name, start_date, end_date, multiplier, color)
      VALUES (${body.property_id}, ${body.name}, ${body.start_date}, ${body.end_date}, ${body.multiplier || 1.0}, ${body.color || "#3B82F6"})
      RETURNING *
    `;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create pricing season";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
