import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT 
        a.*,
        v.company_name as vendor_name,
        EXTRACT(DAY FROM (a.end_date - CURRENT_DATE)) as days_remaining
      FROM amc_contracts a
      LEFT JOIN vendors v ON v.id = a.vendor_id
      WHERE 1=1
      ${propertyId ? sql`AND a.property_id = ${propertyId}` : sql``}
      ORDER BY a.end_date ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[amc GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch AMC data" }, { status: 500 });
  }
}
