import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT *
      FROM parts_inventory
      WHERE 1=1
      ${propertyId ? sql`AND property_id = ${propertyId}` : sql``}
      ORDER BY quantity_in_stock ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[inventory GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch inventory" }, { status: 500 });
  }
}
