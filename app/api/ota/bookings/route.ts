export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

// GET — list incoming OTA bookings
export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT
        obq.*,
        cp.name AS channel_name,
        cp.code AS channel_code
      FROM ota_booking_queue obq
      JOIN channel_partners cp ON cp.id = obq.channel_id
      WHERE 1=1
        ${propertyId ? sql`AND obq.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND obq.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
        ${status ? sql`AND obq.status = ${status}` : sql``}
      ORDER BY obq.created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[ota/bookings GET]", error);
    return NextResponse.json({ error: "Failed to fetch OTA bookings" }, { status: 500 });
  }
}

// POST — receive an incoming OTA booking (webhook)
export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { property_id, channel_code, channel_booking_ref } = body;

    if (!property_id || !channel_code || !channel_booking_ref) {
      return NextResponse.json({ error: "property_id, channel_code, and channel_booking_ref are required" }, { status: 400 });
    }

    // Resolve channel
    const channels = await sql`SELECT id FROM channel_partners WHERE code = ${channel_code} LIMIT 1` as any[];
    if (channels.length === 0) {
      return NextResponse.json({ error: `Unknown channel: ${channel_code}` }, { status: 400 });
    }
    const channelId = channels[0].id;

    // Upsert into queue
    const rows = await sql`
      INSERT INTO ota_booking_queue (
        property_id, channel_id, channel_booking_ref,
        guest_name, guest_email, guest_phone,
        unit_type, check_in, check_out, adults, children,
        total_amount, commission, net_amount,
        raw_payload, status
      ) VALUES (
        ${property_id}, ${channelId}, ${channel_booking_ref},
        ${body.guest_name || null}, ${body.guest_email || null}, ${body.guest_phone || null},
        ${body.unit_type || null}, ${body.check_in}, ${body.check_out},
        ${body.adults || 1}, ${body.children || 0},
        ${body.total_amount || 0}, ${body.commission || 0}, ${body.net_amount || body.total_amount || 0},
        ${JSON.stringify(body)}::jsonb, 'pending'
      )
      ON CONFLICT (channel_id, channel_booking_ref)
      DO UPDATE SET
        guest_name = EXCLUDED.guest_name,
        guest_email = EXCLUDED.guest_email,
        total_amount = EXCLUDED.total_amount,
        status = 'pending',
        raw_payload = EXCLUDED.raw_payload
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[ota/bookings POST]", error);
    return NextResponse.json({ error: "Failed to ingest OTA booking" }, { status: 500 });
  }
}
