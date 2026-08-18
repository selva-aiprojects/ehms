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
      SELECT * FROM pricing_rules
      WHERE is_active = true
        ${propertyId ? sql`AND property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY priority DESC, name ASC
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[pricing/rules GET]", error);
    return NextResponse.json({ error: "Failed to fetch pricing rules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO pricing_rules (property_id, name, rule_type, conditions, adjustments, priority, is_active)
      VALUES (${body.property_id}, ${body.name}, ${body.rule_type}, ${JSON.stringify(body.conditions || {})}::jsonb, ${JSON.stringify(body.adjustments || {})}::jsonb, ${body.priority || 0}, ${body.is_active !== false})
      RETURNING *
    `;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create pricing rule";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
