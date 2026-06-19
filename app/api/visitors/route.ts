import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");
    const limit = Math.min(200, parseInt(searchParams.get("limit") || "50"));

    const rows = await sql`
      SELECT
        vl.*,
        json_build_object('id', he.id, 'first_name', he.first_name, 'last_name', he.last_name, 'email', he.email) AS host
      FROM visitor_logs vl
      LEFT JOIN users he ON he.id = vl.host_employee_id
      WHERE 1=1
        ${propertyId ? sql`AND vl.property_id = ${propertyId}` : sql``}
        ${status === "checked_in" ? sql`AND vl.check_out IS NULL` : sql``}
        ${status === "checked_out" ? sql`AND vl.check_out IS NOT NULL` : sql``}
      ORDER BY vl.check_in DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.warn("[visitors GET] table may not exist:", error);
    return NextResponse.json({ data: [] });
  }
}
