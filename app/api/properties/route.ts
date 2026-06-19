import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const verticalType = searchParams.get("vertical_type");

    const rows = await sql`
      SELECT
        p.*,
        COALESCE(
          json_agg(json_build_object('id', u.id, 'status', u.status)) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS units
      FROM properties p
      LEFT JOIN units u ON u.floor_id IN (
        SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE b.property_id = p.id
      )
      WHERE p.is_active = true
        ${propertyId ? sql`AND p.id = ${propertyId}` : sql``}
        ${verticalType ? sql`AND p.vertical_type = ${verticalType}` : sql``}
      GROUP BY p.id
      ORDER BY p.name
    `;

    const withOccupancy = (rows as Array<Record<string, unknown>>).map(p => {
      const units = (p.units as Array<{ status: string }>) || [];
      const total = units.length;
      const occupied = units.filter(u => u.status === "occupied").length;
      return { ...p, total_units: total, occupied_units: occupied, occupancy_pct: total > 0 ? Math.round((occupied / total) * 100) : 0 };
    });

    return NextResponse.json({ data: withOccupancy });
  } catch (error) {
    console.error("[properties GET]", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}
