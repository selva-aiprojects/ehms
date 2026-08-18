export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    const rows = await sql`
      UPDATE pricing_rules SET
        name = COALESCE(${body.name}, name),
        rule_type = COALESCE(${body.rule_type}, rule_type),
        conditions = COALESCE(${body.conditions ? JSON.stringify(body.conditions) : null}::jsonb, conditions),
        adjustments = COALESCE(${body.adjustments ? JSON.stringify(body.adjustments) : null}::jsonb, adjustments),
        priority = COALESCE(${body.priority}::int, priority),
        is_active = COALESCE(${body.is_active}, is_active),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Pricing rule not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[pricing/rules PUT]", error);
    return NextResponse.json({ error: "Failed to update pricing rule" }, { status: 500 });
  }
}
