export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

// GET — list OTA channel mappings for a property
export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT
        rm.*,
        cp.name AS channel_name,
        cp.code AS channel_code,
        cr.commission_pct
      FROM ota_rate_mappings rm
      JOIN channel_partners cp ON cp.id = rm.channel_id
      LEFT JOIN ota_commission_rates cr ON cr.channel_id = rm.channel_id AND cr.property_id = rm.property_id AND cr.is_active = true
      WHERE rm.is_active = true
        ${propertyId ? sql`AND rm.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND rm.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY cp.name, rm.unit_type
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[ota/mappings GET]", error);
    return NextResponse.json({ error: "Failed to fetch OTA mappings" }, { status: 500 });
  }
}

// POST — create or update a mapping
export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO ota_rate_mappings (property_id, channel_id, unit_type, channel_room_type_code, channel_room_name, rate_multiplier)
      VALUES (${body.property_id}, ${body.channel_id}, ${body.unit_type}, ${body.channel_room_type_code}, ${body.channel_room_name || null}, ${body.rate_multiplier || 1.0})
      ON CONFLICT (property_id, channel_id, unit_type)
      DO UPDATE SET
        channel_room_type_code = EXCLUDED.channel_room_type_code,
        channel_room_name = EXCLUDED.channel_room_name,
        rate_multiplier = EXCLUDED.rate_multiplier
      RETURNING *
    `;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create OTA mapping";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
