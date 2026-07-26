import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("property_id");
    const status = url.searchParams.get("status");
    const sql = getDb();

    let rows;
    if (propertyId && status) {
      rows = await sql`
        SELECT cs.*, b.source_booking_ref, b.check_in AS bk_check_in, b.check_out AS bk_check_out, b.total_amount,
               gp.first_name || ' ' || gp.last_name AS guest_full_name, gp.email AS guest_email, gp.phone AS guest_phone
        FROM checkin_sessions cs
        JOIN bookings b ON b.id = cs.booking_id
        LEFT JOIN guest_profiles gp ON gp.id = cs.guest_id
        WHERE cs.property_id = ${propertyId} AND cs.status = ${status}
        ORDER BY cs.created_at DESC LIMIT 100
      `;
    } else if (propertyId) {
      rows = await sql`
        SELECT cs.*, b.source_booking_ref, b.check_in AS bk_check_in, b.check_out AS bk_check_out, b.total_amount,
               gp.first_name || ' ' || gp.last_name AS guest_full_name, gp.email AS guest_email, gp.phone AS guest_phone
        FROM checkin_sessions cs
        JOIN bookings b ON b.id = cs.booking_id
        LEFT JOIN guest_profiles gp ON gp.id = cs.guest_id
        WHERE cs.property_id = ${propertyId}
        ORDER BY cs.created_at DESC LIMIT 100
      `;
    } else {
      rows = await sql`
        SELECT cs.*, b.source_booking_ref, b.check_in AS bk_check_in, b.check_out AS bk_check_out, b.total_amount,
               gp.first_name || ' ' || gp.last_name AS guest_full_name, gp.email AS guest_email, gp.phone AS guest_phone
        FROM checkin_sessions cs
        JOIN bookings b ON b.id = cs.booking_id
        LEFT JOIN guest_profiles gp ON gp.id = cs.guest_id
        ORDER BY cs.created_at DESC LIMIT 100
      `;
    }
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { property_id, booking_id, guest_id } = body;
    const sql = getDb();

    if (!property_id || !booking_id) {
      return NextResponse.json({ error: "property_id and booking_id required" }, { status: 400 });
    }

    const resCheck = await sql`SELECT id, guest_id, check_in, check_out, status FROM bookings WHERE id = ${booking_id} AND property_id = ${property_id}`;
    if (resCheck.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = resCheck[0];
    if (booking.status === "checked_out" || booking.status === "cancelled") {
      return NextResponse.json({ error: "Booking is not active" }, { status: 400 });
    }

    const existing = await sql`SELECT id, session_token, status FROM checkin_sessions WHERE booking_id = ${booking_id} AND status NOT IN ('expired','cancelled')`;
    if (existing.length > 0) {
      return NextResponse.json(existing[0]);
    }

    const resolvedGuestId = guest_id || booking.guest_id;

    const result = await sql`
      INSERT INTO checkin_sessions (property_id, booking_id, guest_id, status)
      VALUES (${property_id}, ${booking_id}, ${resolvedGuestId || null}, 'pending') RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
