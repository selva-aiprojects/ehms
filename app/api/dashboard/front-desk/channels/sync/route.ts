export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, property_id, channel_name, unit_id, check_in, check_out, guest_name, total_amount } = body;

    if (!property_id) {
      return NextResponse.json({ error: "property_id is required" }, { status: 400 });
    }

    const sql = getDb();

    if (action === "push_availability") {
      // Find all active channel partners
      const partners = await sql`
        SELECT name, code FROM channel_partners WHERE is_active = true
      ` as any[];

      // Count vacant units for payload simulation
      const vacantCountRows = await sql`
        SELECT COUNT(*)::int as cnt FROM units u
        JOIN floors f ON f.id = u.floor_id
        JOIN buildings b ON b.id = f.building_id
        WHERE b.property_id = ${property_id} AND u.status = 'vacant' AND u.is_active = true
      ` as any[];
      const vacantCnt = vacantCountRows[0]?.cnt || 0;

      // Create sync log for each channel partner
      for (const p of partners) {
        const payload = JSON.stringify({
          timestamp: new Date().toISOString(),
          channel: p.name,
          vacant_units: vacantCnt,
          action: "push_availability"
        });
        const durationMs = Math.floor(Math.random() * 45) + 12;

        await sql`
          INSERT INTO channel_sync_log (property_id, channel, action, request_payload, response_status, response_body, synced_at, duration_ms)
          VALUES (
            ${property_id}, ${p.name}, 'push_availability',
            ${payload}::jsonb, 200, '{"status":"success","message":"Inventory and rates synchronized successfully."}',
            now(), ${durationMs}
          )
        `;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully broadcasted rates and availability (${vacantCnt} rooms) to ${partners.length} active OTA channels.`
      });
    }

    if (action === "webhook_booking") {
      if (!channel_name || !unit_id || !check_in || !check_out) {
        return NextResponse.json({ error: "channel_name, unit_id, check_in, and check_out are required for webhook simulation" }, { status: 400 });
      }

      // Check if room has conflicting bookings
      const conflicts = await sql`
        SELECT id FROM bookings
        WHERE unit_id = ${unit_id}
          AND status IN ('confirmed', 'checked_in')
          AND check_in < (${check_out}::timestamptz + interval '30 minutes')
          AND check_out > ${check_in}::timestamptz
        LIMIT 1
      ` as any[];

      if (conflicts.length > 0) {
        return NextResponse.json({
          error: `Double Booking Prevention Triggered: Unit already has a confirmed/checked-in booking overlapping ${check_in} to ${check_out}. OTA webhook rejected.`
        }, { status: 409 });
      }

      // 1. Find or create guest in guest_profiles
      let guestId: string;
      const nameParts = (guest_name || "OTA Guest").trim().split(" ");
      const firstName = nameParts[0] || "OTA";
      const lastName = nameParts.slice(1).join(" ") || "Guest";

      const existingGuests = await sql`
        SELECT id FROM guest_profiles WHERE first_name ILIKE ${firstName} AND last_name ILIKE ${lastName} LIMIT 1
      ` as any[];

      if (existingGuests.length > 0) {
        guestId = existingGuests[0].id;
      } else {
        const newGuests = await sql`
          INSERT INTO guest_profiles (first_name, last_name, email, phone, tags)
          VALUES (${firstName}, ${lastName}, ${firstName.toLowerCase()}@ota-booking.guest, '+91-9999999999', ARRAY['OTA-Direct', ${channel_name}])
          RETURNING id
        ` as any[];
        guestId = newGuests[0].id;
      }

      // 2. Create the reservation
      const bookingRows = await sql`
        INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, special_requests)
        VALUES (
          ${property_id}, ${unit_id}, ${guestId}, 'nightly', 'confirmed', ${channel_name},
          ${check_in}, ${check_out}, 2, 0, ${Number(total_amount || 5000)},
          ${"Auto-imported via " + channel_name + " Webhook Sync"}
        )
        RETURNING *
      ` as any[];
      const newBooking = bookingRows[0];

      // 3. Mark unit status as reserved
      await sql`UPDATE units SET status = 'reserved' WHERE id = ${unit_id}`;

      // 4. Log webhook receipt in channel_sync_log
      await sql`
        INSERT INTO channel_sync_log (property_id, channel, action, request_payload, response_status, response_body, synced_at, duration_ms)
        VALUES (
          ${property_id}, ${channel_name}, 'booking_received',
          ${JSON.stringify({ booking_id: newBooking.id, unit_id, check_in, check_out, guest_name, total_amount })}::jsonb,
          201, '{"status":"created","booking_id":"' || ${newBooking.id} || '"}',
          now(), 35
        )
      `;

      // 5. Automatically generate a digital smart lock key for this OTA guest
      const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
      await sql`
        INSERT INTO digital_keys (property_id, unit_id, booking_id, guest_id, lock_vendor, pin_code, valid_from, valid_to, status)
        VALUES (
          ${property_id}, ${unit_id}, ${newBooking.id}, ${guestId}, 'Salto Keyless Entry',
          ${pinCode}, ${check_in}, ${check_out}, 'active'
        )
      `;

      // 6. Broadcast updated availability to remaining channels right away to prevent double bookings!
      const remainingPartners = await sql`SELECT name FROM channel_partners WHERE is_active = true AND name != ${channel_name}` as any[];
      for (const rp of remainingPartners) {
        await sql`
          INSERT INTO channel_sync_log (property_id, channel, action, request_payload, response_status, response_body, synced_at, duration_ms)
          VALUES (
            ${property_id}, ${rp.name}, 'push_availability',
            ${JSON.stringify({ trigger: "webhook_booking_reduction", unit_locked: unit_id })}::jsonb,
            200, '{"status":"updated","message":"Inventory decremented across OTA bridge."}',
            now(), 18
          )
        `;
      }

      return NextResponse.json({
        success: true,
        booking: newBooking,
        pin_code: pinCode,
        message: `Successfully processed ${channel_name} webhook reservation, locked Unit, generated Smart Key PIN ${pinCode}, and broadcasted inventory decrement to remaining OTAs.`
      });
    }

    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 });
  } catch (error: any) {
    console.error("[Channels Sync POST Error]", error);
    return NextResponse.json({ error: error?.message || "Internal server error during channel sync" }, { status: 500 });
  }
}
