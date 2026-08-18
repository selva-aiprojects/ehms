export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

// PATCH — move a booking to a different unit (drag-and-drop on calendar)
export async function PATCH(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { booking_id, new_unit_id } = body;

    if (!booking_id || !new_unit_id) {
      return NextResponse.json({ error: "booking_id and new_unit_id are required" }, { status: 400 });
    }

    // Fetch the booking
    const bookings = await sql`SELECT * FROM bookings WHERE id = ${booking_id} LIMIT 1` as any[];
    if (bookings.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const booking = bookings[0];

    // Validate property access
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    // Check for conflicts on the new unit
    const conflicts = await sql`
      SELECT id FROM bookings
      WHERE unit_id = ${new_unit_id}
        AND id != ${booking_id}
        AND status IN ('confirmed', 'checked_in', 'pending')
        AND check_in < (${booking.check_out}::timestamptz + interval '30 minutes')
        AND check_out > ${booking.check_in}::timestamptz
      LIMIT 1
    ` as any[];

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: "Cannot move booking — the target room has an overlapping reservation." },
        { status: 400 }
      );
    }

    // Free old unit
    await sql`UPDATE units SET status = 'vacant' WHERE id = ${booking.unit_id} AND status = 'reserved'`;

    // Update booking to new unit
    const updated = await sql`
      UPDATE bookings SET unit_id = ${new_unit_id}, updated_at = now()
      WHERE id = ${booking_id}
      RETURNING *
    ` as any[];

    // Mark new unit as reserved
    await sql`UPDATE units SET status = 'reserved' WHERE id = ${new_unit_id}`;

    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error("[reservations/calendar PATCH]", error);
    return NextResponse.json({ error: "Failed to move booking" }, { status: 500 });
  }
}
