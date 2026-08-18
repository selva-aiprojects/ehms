export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const propertyId = searchParams.get("property_id");
    const startDate = searchParams.get("start_date") || new Date().toISOString().split("T")[0];
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get("days") || "30")));
    const buildingId = searchParams.get("building_id");
    const floorId = searchParams.get("floor_id");
    const roomType = searchParams.get("room_type");

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    const endStr = endDate.toISOString().split("T")[0];

    // 1. Fetch units (rooms) with hierarchy
    const units = await sql`
      SELECT
        u.id, u.unit_label, u.unit_type, u.status, u.base_rate, u.max_occupancy,
        f.id AS floor_id, f.name AS floor_name, f.floor_number,
        b.id AS building_id, b.name AS building_name
      FROM units u
      JOIN floors f ON f.id = u.floor_id
      JOIN buildings b ON b.id = f.building_id
      WHERE u.is_active = true
        ${propertyId ? sql`AND b.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND b.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
        ${buildingId ? sql`AND b.id = ${buildingId}` : sql``}
        ${floorId ? sql`AND f.id = ${floorId}` : sql``}
        ${roomType ? sql`AND u.unit_type = ${roomType}` : sql``}
      ORDER BY b.name, f.floor_number, u.unit_label
    ` as any[];

    if (units.length === 0) {
      return NextResponse.json({ units: [], bookings: [], dates: [] });
    }

    const unitIds = units.map((u: any) => u.id);

    // 2. Fetch bookings that overlap with the date range
    const bookings = await sql`
      SELECT
        b.id, b.status, b.source, b.check_in, b.check_out,
        b.total_amount, b.adults, b.children, b.special_requests,
        b.unit_id, b.guest_id,
        COALESCE(g.first_name || ' ' || g.last_name, 'Guest') AS guest_name,
        g.phone AS guest_phone,
        u.unit_label
      FROM bookings b
      LEFT JOIN guest_profiles g ON g.id = b.guest_id
      LEFT JOIN units u ON u.id = b.unit_id
      WHERE b.unit_id = ANY(${unitIds})
        AND b.status IN ('confirmed', 'checked_in', 'pending')
        AND b.check_in < (${endDate.toISOString().split("T")[0]})::date + interval '1 day'
        AND b.check_out > ${startDate}::date
      ORDER BY b.check_in
    ` as any[];

    // 3. Generate date array
    const dates: string[] = [];
    const d = new Date(startDate);
    while (d <= endDate) {
      dates.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }

    return NextResponse.json({ units, bookings, dates });
  } catch (error) {
    console.error("[reservations/calendar GET]", error);
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
  }
}
