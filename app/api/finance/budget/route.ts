export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const fiscalYearId = searchParams.get("fiscal_year_id");
    const headId = searchParams.get("budget_head_id");

    let query = `
      SELECT be.*, bh.code as head_code, bh.name as head_name, fy.name as fiscal_year_name
      FROM budget_entries be
      JOIN budget_heads bh ON bh.id = be.budget_head_id
      JOIN fiscal_years fy ON fy.id = be.fiscal_year_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;
    if (propertyId) { query += ` AND bh.property_id = $${idx++}`; params.push(propertyId); }
    if (fiscalYearId) { query += ` AND be.fiscal_year_id = $${idx++}`; params.push(fiscalYearId); }
    if (headId) { query += ` AND be.budget_head_id = $${idx++}`; params.push(headId); }
    query += " ORDER BY bh.code, be.period_month";

    const rows = await sql.query(query, params);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[finance/budget GET]", error);
    return NextResponse.json({ error: "Failed to fetch budget data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO budget_entries (budget_head_id, fiscal_year_id, period_month, budget_amount, notes)
      VALUES (${body.budget_head_id}, ${body.fiscal_year_id}, ${body.period_month}, ${body.budget_amount}, ${body.notes || null})
      ON CONFLICT (budget_head_id, fiscal_year_id, period_month)
      DO UPDATE SET budget_amount = EXCLUDED.budget_amount, notes = COALESCE(EXCLUDED.notes, budget_entries.notes)
      RETURNING *`;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/budget POST]", error);
    return NextResponse.json({ error: "Failed to create budget entry" }, { status: 500 });
  }
}
