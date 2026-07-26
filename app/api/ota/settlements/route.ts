export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

// GET — list settlements
export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT s.*, cp.name AS channel_name, cp.code AS channel_code
      FROM ota_settlements s
      JOIN channel_partners cp ON cp.id = s.channel_id
      WHERE 1=1
        ${propertyId ? sql`AND s.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND s.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY s.created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[ota/settlements GET]", error);
    return NextResponse.json({ error: "Failed to fetch settlements" }, { status: 500 });
  }
}

// POST — create a settlement record
export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO ota_settlements (property_id, channel_id, settlement_ref, period_start, period_end, gross_amount, commission, net_amount, booking_count, status)
      VALUES (${body.property_id}, ${body.channel_id}, ${body.settlement_ref || null}, ${body.period_start}, ${body.period_end}, ${body.gross_amount || 0}, ${body.commission || 0}, ${body.net_amount || 0}, ${body.booking_count || 0}, ${body.status || 'pending'})
      RETURNING *
    `;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create settlement";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
