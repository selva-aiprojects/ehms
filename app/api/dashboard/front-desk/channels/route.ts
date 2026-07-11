import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = req.nextUrl.searchParams.get("property_id");
    const sql = getDb();
    
    if (propertyId) {
      const rows = await sql`
        SELECT 
          c.id, c.name as channel_name, c.is_active, c.commission_rate,
          (SELECT l.response_status FROM channel_sync_log l WHERE l.channel = c.name AND l.property_id = ${propertyId} ORDER BY l.synced_at DESC LIMIT 1) as last_sync_status,
          (SELECT l.synced_at FROM channel_sync_log l WHERE l.channel = c.name AND l.property_id = ${propertyId} ORDER BY l.synced_at DESC LIMIT 1) as last_sync_time,
          (SELECT COUNT(*) FROM bookings b WHERE b.source = c.name AND b.property_id = ${propertyId} AND b.created_at >= CURRENT_DATE - INTERVAL '1 day') as new_bookings_24h
        FROM channel_partners c
        WHERE c.is_active = true
        ORDER BY c.name
      `;
      return NextResponse.json({ data: rows });
    }

    const rows = await sql`
      SELECT 
        c.id, c.name as channel_name, c.is_active, c.commission_rate,
        (SELECT l.response_status FROM channel_sync_log l WHERE l.channel = c.name ORDER BY l.synced_at DESC LIMIT 1) as last_sync_status,
        (SELECT l.synced_at FROM channel_sync_log l WHERE l.channel = c.name ORDER BY l.synced_at DESC LIMIT 1) as last_sync_time,
        (SELECT COUNT(*) FROM bookings b WHERE b.source = c.name AND b.created_at >= CURRENT_DATE - INTERVAL '1 day') as new_bookings_24h
      FROM channel_partners c
      WHERE c.is_active = true
      ORDER BY c.name
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[channels GET]", error);
    return NextResponse.json({ error: "Failed to fetch channel status" }, { status: 500 });
  }
}
