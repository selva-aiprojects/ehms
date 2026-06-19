import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");

    // compliance_records may not exist — return empty gracefully
    const rows = await sql`
      SELECT
        cr.*,
        json_build_object('id', p.id, 'name', p.name) AS property
      FROM compliance_records cr
      LEFT JOIN properties p ON p.id = cr.property_id
      WHERE 1=1
        ${propertyId ? sql`AND cr.property_id = ${propertyId}` : sql``}
        ${status ? sql`AND cr.status = ${status}` : sql``}
      ORDER BY cr.expiry_date ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    // Table may not exist yet — return empty array instead of 500
    console.warn("[compliance GET] table may not exist:", error);
    return NextResponse.json({ data: [] });
  }
}
