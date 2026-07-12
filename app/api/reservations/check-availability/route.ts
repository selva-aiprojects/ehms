export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const checkInStr = searchParams.get("check_in");
    const checkOutStr = searchParams.get("check_out");

    if (!propertyId || !checkInStr || !checkOutStr) {
      return NextResponse.json(
        { error: "property_id, check_in and check_out parameters are required" },
        { status: 400 }
      );
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json({ error: "Invalid datetime parameters format" }, { status: 400 });
    }

    if (checkIn >= checkOut) {
      return NextResponse.json({ error: "Check-in must be before check-out" }, { status: 400 });
    }

    const sql = getDb();

    // Query 1: Find all active units/rooms in this property
    const allUnits = await sql`
      SELECT 
        u.id, 
        u.unit_label, 
        u.unit_type, 
        u.layout_type, 
        u.base_rate, 
        u.max_occupancy, 
        u.parent_unit_id,
        f.name as floor_name,
        bld.name as building_name
      FROM units u
      JOIN floors f ON f.id = u.floor_id
      JOIN buildings bld ON bld.id = f.building_id
      WHERE bld.property_id = ${propertyId}
        AND u.is_active = true
      ORDER BY u.unit_label ASC
    ` as any[];

    // Query 2: Find units with overlapping bookings in this time slot (+30m turnaround buffer)
    const overlappingBookings = await sql`
      SELECT DISTINCT unit_id 
      FROM bookings
      WHERE property_id = ${propertyId}
        AND status IN ('confirmed', 'checked_in')
        AND unit_id IS NOT NULL
        AND check_in < (${checkOutStr}::timestamptz + interval '30 minutes')
        AND check_out > ${checkInStr}::timestamptz
    ` as any[];

    const blockedUnitIds = new Set(overlappingBookings.map(b => b.unit_id));

    // Query 3: Filter all units that do NOT overlap
    const availableUnits = allUnits.filter(u => !blockedUnitIds.has(u.id));

    return NextResponse.json({ data: availableUnits });
  } catch (error: any) {
    console.error("[Check Availability GET error]", error);
    return NextResponse.json({ error: error?.message || "Failed to check availability" }, { status: 500 });
  }
}
