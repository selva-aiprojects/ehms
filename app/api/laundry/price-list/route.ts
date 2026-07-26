export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT * FROM laundry_price_list
      WHERE is_active = true
        ${propertyId ? sql`AND property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY item_category, item_name, wash_type
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[laundry/price-list GET]", error);
    return NextResponse.json({ error: "Failed to fetch laundry price list" }, { status: 500 });
  }
}
