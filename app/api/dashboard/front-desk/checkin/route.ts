import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { bookingId, roomId, parkingSlot, vehicleNumber, checklistItems } = body;

    if (!bookingId || !roomId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sql = getDb();

    // Use a transaction to ensure all check-in steps complete together
      // 1. Update Booking Status
      await sql`
        UPDATE bookings
        SET status = 'checked_in',
            unit_id = ${roomId}
        WHERE id = ${bookingId}
      `;

      // 2. Update Unit Status
      await sql`
        UPDATE units
        SET status = 'occupied'
        WHERE id = ${roomId}
      `;

      // 3. Save Checklist if provided
      if (checklistItems && Object.keys(checklistItems).length > 0) {
        await sql`
          INSERT INTO checkin_checklists (booking_id, checklist_items, verified_by)
          VALUES (${bookingId}, ${JSON.stringify(checklistItems)}, ${user.user_id})
          ON CONFLICT (booking_id) 
          DO UPDATE SET checklist_items = EXCLUDED.checklist_items, verified_by = EXCLUDED.verified_by, verified_at = CURRENT_TIMESTAMP
        `;
      }

      // 4. Save Parking if provided
      if (vehicleNumber) {
        // Unrelease any previous parking for this booking
        await sql`
          UPDATE parking_allocations
          SET status = 'released', released_at = CURRENT_TIMESTAMP
          WHERE booking_id = ${bookingId} AND status = 'active'
        `;
        // Create new allocation
        await sql`
          INSERT INTO parking_allocations (booking_id, vehicle_number, slot_number)
          VALUES (${bookingId}, ${vehicleNumber}, ${parkingSlot || null})
        `;
      }

    return NextResponse.json({ success: true, message: "Check-in completed successfully." });
  } catch (error: any) {
    console.error("[Check-in POST error]", error);
    return NextResponse.json({ error: error.message || "Check-in failed" }, { status: 500 });
  }
}
