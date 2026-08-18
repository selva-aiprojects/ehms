import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT *
      FROM preventive_schedules
      WHERE is_active = true
      ${propertyId ? sql`AND property_id = ${propertyId}` : sql``}
      ORDER BY next_due ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[preventive GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch schedules" }, { status: 500 });
  }
}
