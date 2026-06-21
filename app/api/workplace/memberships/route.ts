export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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
