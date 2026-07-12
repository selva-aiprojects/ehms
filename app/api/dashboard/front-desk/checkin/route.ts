import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { validateIndirectPropertyAccess } from "@/lib/property-scope";

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

    // Validate property access indirectly via booking → property_id
    const accessErr = await validateIndirectPropertyAccess(req, sql, "bookings", bookingId);
    if (accessErr) return accessErr;

    // Use a transaction to ensure all check-in steps complete together
      // 1. Update Booking Status
      await sql`
        UPDATE bookings
        SET status = 'checked_in',
            unit_id = ${roomId}
        WHERE id = ${bookingId}
      `;

      // 2. Update Unit Status (Scoped to vertical: block children if apartment, block parent if room)
      try {
        const unitDetails = await sql`
          SELECT p.vertical_type, u.unit_type, u.parent_unit_id
          FROM units u
          JOIN floors f ON f.id = u.floor_id
          JOIN buildings b ON b.id = f.building_id
          JOIN properties p ON p.id = b.property_id
          WHERE u.id = ${roomId}
          LIMIT 1
        ` as any[];

        if (unitDetails.length > 0) {
          const detail = unitDetails[0];
          const isApartmentVertical = detail.vertical_type === "service_apartment" || detail.vertical_type === "rental_apartment";

          if (isApartmentVertical) {
            if (detail.unit_type === "apartment") {
              // Block the apartment and all its child rooms
              await sql`UPDATE units SET status = 'occupied' WHERE id = ${roomId} OR parent_unit_id = ${roomId}`;
            } else if (detail.parent_unit_id) {
              // Block the individual room and its parent apartment
              await sql`UPDATE units SET status = 'occupied' WHERE id = ${roomId} OR id = ${detail.parent_unit_id}`;
            } else {
              await sql`UPDATE units SET status = 'occupied' WHERE id = ${roomId}`;
            }
          } else {
            // Standard vertical (e.g. Hotel)
            await sql`UPDATE units SET status = 'occupied' WHERE id = ${roomId}`;
          }
        } else {
          await sql`UPDATE units SET status = 'occupied' WHERE id = ${roomId}`;
        }
      } catch (err) {
        console.error("Failed to update hierarchy check-in status:", err);
        await sql`UPDATE units SET status = 'occupied' WHERE id = ${roomId}`;
      }

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
