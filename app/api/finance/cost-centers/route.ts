export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    let query = sql`
      SELECT cc.*, d.name as department_name
      FROM cost_centers cc
      LEFT JOIN departments d ON d.id = cc.department_id
      WHERE cc.is_active = true`;
    if (propertyId) query = sql`${query} AND cc.property_id = ${propertyId}`;
    query = sql`${query} ORDER BY cc.code`;

    return NextResponse.json({ data: await query });
  } catch (error) {
    console.error("[finance/cost-centers GET]", error);
    return NextResponse.json({ error: "Failed to fetch cost centers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const rows = await sql`
      INSERT INTO cost_centers (property_id, code, name, department_id)
      VALUES (${body.property_id}, ${body.code}, ${body.name}, ${body.department_id || null})
      RETURNING *`;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/cost-centers POST]", error);
    return NextResponse.json({ error: "Failed to create cost center" }, { status: 500 });
  }
}
