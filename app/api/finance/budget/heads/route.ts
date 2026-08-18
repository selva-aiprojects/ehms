export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    let query = sql`SELECT bh.*, ca.account_code, ca.account_name FROM budget_heads bh LEFT JOIN chart_of_accounts ca ON ca.id = bh.account_id WHERE 1=1`;
    if (propertyId) query = sql`${query} AND bh.property_id = ${propertyId}`;
    query = sql`${query} ORDER BY bh.code`;
    return NextResponse.json({ data: await query });
  } catch (error) {
    console.error("[finance/budget/heads GET]", error);
    return NextResponse.json({ error: "Failed to fetch budget heads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const rows = await sql`
      INSERT INTO budget_heads (property_id, code, name, account_id)
      VALUES (${body.property_id}, ${body.code}, ${body.name}, ${body.account_id || null})
      RETURNING *`;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/budget/heads POST]", error);
    return NextResponse.json({ error: "Failed to create budget head" }, { status: 500 });
  }
}
