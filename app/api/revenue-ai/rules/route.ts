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
      SELECT * FROM revenue_ai_rules
      WHERE 1=1
        ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY priority DESC, name ASC
    `;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[revenue-ai/rules GET]", error);
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
      INSERT INTO revenue_ai_rules (property_id, rule_type, name, config, is_active, priority)
      VALUES (
        ${body.property_id},
        ${body.rule_type},
        ${body.name},
        ${JSON.stringify(body.config || {})}::jsonb,
        ${body.is_active !== false},
        ${body.priority || 0}
      )
      RETURNING *
    `;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[revenue-ai/rules POST]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
