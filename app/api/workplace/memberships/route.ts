export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { corporate_id, plan_id, start_date, end_date, seat_allocated, status, notes } = body;

    if (!corporate_id || !plan_id || !start_date) {
      return NextResponse.json({ error: "Corporate, plan, and start date are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO corporate_memberships (corporate_id, plan_id, start_date, end_date, seat_allocated, status, notes)
      VALUES (${corporate_id}, ${plan_id}, ${start_date}, ${end_date || null}, ${seat_allocated || 0}, ${status || "active"}, ${notes || null})
      RETURNING *
    ` as any[];

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.warn("[memberships POST] table may not exist:", error);
    return NextResponse.json({ error: "Failed to create membership" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT
        cm.*,
        json_build_object('id', ca.id, 'name', ca.name, 'tax_id', ca.tax_id) AS corporate,
        json_build_object('id', mp.id, 'name', mp.name, 'plan_type', mp.plan_type, 'price', mp.price, 'billing_cycle', mp.billing_cycle) AS plan
      FROM corporate_memberships cm
      LEFT JOIN corporate_accounts ca ON ca.id = cm.corporate_id
      LEFT JOIN membership_plans mp ON mp.id = cm.plan_id
      WHERE 1=1
        ${status !== "all" ? sql`AND cm.status = ${status}` : sql``}
        ${propertyId ? sql`AND mp.property_id = ${propertyId}` : sql``}
      ORDER BY cm.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.warn("[memberships GET] table may not exist:", error);
    return NextResponse.json({ data: [] });
  }
}
