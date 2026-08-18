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
      SELECT * FROM loyalty_tiers
      WHERE is_active = true
        ${propertyId ? sql`AND property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY tier_order ASC
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[loyalty/tiers GET]", error);
    return NextResponse.json({ error: "Failed to fetch loyalty tiers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO loyalty_tiers (property_id, name, min_stays, min_spend, discount_pct, points_multiplier, benefits, tier_order)
      VALUES (${body.property_id}, ${body.name}, ${body.min_stays || 0}, ${body.min_spend || 0}, ${body.discount_pct || 0}, ${body.points_multiplier || 1.0}, ${JSON.stringify(body.benefits || [])}::jsonb, ${body.tier_order || 0})
      RETURNING *
    `;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create loyalty tier";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
