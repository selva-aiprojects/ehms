export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

// GET — list sync logs for a property
export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const channel = searchParams.get("channel");
    const limit = Math.min(200, parseInt(searchParams.get("limit") || "50"));
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT cs.*, cp.name AS channel_name
      FROM channel_sync_log cs
      LEFT JOIN channel_partners cp ON cp.code = cs.channel
      WHERE 1=1
        ${propertyId ? sql`AND cs.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND cs.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
        ${channel ? sql`AND cs.channel = ${channel}` : sql``}
      ORDER BY cs.created_at DESC
      LIMIT ${limit}
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[ota/sync GET]", error);
    return NextResponse.json({ error: "Failed to fetch sync logs" }, { status: 500 });
  }
}

// POST — trigger inventory/rate sync for a property
export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { property_id, channel, sync_type } = body;

    if (!property_id) {
      return NextResponse.json({ error: "property_id is required" }, { status: 400 });
    }

    // Fetch active mappings
    const mappings = await sql`
      SELECT rm.*, cp.name AS channel_name, cp.code AS channel_code
      FROM ota_rate_mappings rm
      JOIN channel_partners cp ON cp.id = rm.channel_id
      WHERE rm.property_id = ${property_id} AND rm.is_active = true
        ${channel ? sql`AND cp.code = ${channel}` : sql``}
    ` as any[];

    if (mappings.length === 0) {
      return NextResponse.json({ error: "No active OTA mappings found" }, { status: 404 });
    }

    // Fetch current inventory (vacant rooms by unit type + date)
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const endStr = futureDate.toISOString().split("T")[0];

    const inventory = await sql`
      SELECT
        u.unit_type,
        u.id AS unit_id,
        u.unit_label,
        ic.date,
        ic.status,
        ic.rate
      FROM units u
      JOIN floors f ON f.id = u.floor_id
      JOIN buildings b ON b.id = f.building_id
      LEFT JOIN inventory_calendar ic ON ic.unit_id = u.id AND ic.date BETWEEN ${today}::date AND ${endStr}::date
      WHERE b.property_id = ${property_id} AND u.is_active = true
    ` as any[];

    // Create sync queue entries for each mapping + date
    let queueCount = 0;
    for (const mapping of mappings) {
      const unitsOfType = inventory.filter((i: any) => i.unit_type === mapping.unit_type);

      for (const unit of unitsOfType) {
        const availDate = unit.date || today;
        const isAvailable = !unit.status || unit.status === "vacant";
        const rate = unit.rate || 0;

        // Upsert availability queue
        await sql`
          INSERT INTO ota_availability_queue (property_id, unit_id, date, available, rate, status)
          VALUES (${property_id}, ${unit.unit_id}, ${availDate}::date, ${isAvailable}, ${rate}, 'pending')
          ON CONFLICT (property_id, unit_id, date)
          DO UPDATE SET available = EXCLUDED.available, rate = EXCLUDED.rate, status = 'pending'
        `;
        queueCount++;

        // Upsert rate queue
        const adjustedRate = Number(rate) * Number(mapping.rate_multiplier);
        await sql`
          INSERT INTO ota_rate_queue (property_id, mapping_id, date, rate, status)
          VALUES (${property_id}, ${mapping.id}, ${availDate}::date, ${adjustedRate}, 'pending')
          ON CONFLICT (mapping_id, date)
          DO UPDATE SET rate = EXCLUDED.rate, status = 'pending'
        `;
      }
    }

    // Log the sync trigger
    await sql`
      INSERT INTO channel_sync_log (property_id, channel, action, request_payload, response_status)
      VALUES (${property_id}, ${sync_type || 'all'}, 'push_availability', ${JSON.stringify({ mappings_count: mappings.length, queue_entries: queueCount })}::jsonb, 200)
    `;

    return NextResponse.json({
      data: {
        message: `Queued ${queueCount} availability entries and ${queueCount} rate entries across ${mappings.length} channels`,
        mappings_count: mappings.length,
        queue_entries: queueCount,
      },
    });
  } catch (error) {
    console.error("[ota/sync POST]", error);
    return NextResponse.json({ error: "Failed to trigger sync" }, { status: 500 });
  }
}
