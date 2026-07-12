export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      SELECT id, lock_vendor, pin_code, valid_from, valid_to, status, created_at
      FROM digital_keys
      WHERE booking_id = ${bookingId}
      ORDER BY created_at DESC
      LIMIT 1
    ` as any[];

    if (rows.length === 0) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error("[Smart Key GET Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch digital key" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const sql = getDb();

    // 1. Fetch booking details
    const bookingRows = await sql`
      SELECT id, property_id, unit_id, guest_id, check_in, check_out, status
      FROM bookings
      WHERE id = ${bookingId}
      LIMIT 1
    ` as any[];

    if (bookingRows.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingRows[0];
    if (!booking.unit_id) {
      return NextResponse.json({ error: "Cannot generate smart key: no unit assigned to this reservation." }, { status: 400 });
    }

    // Revoke any existing active keys for this booking
    await sql`
      UPDATE digital_keys SET status = 'revoked', updated_at = now()
      WHERE booking_id = ${bookingId} AND status = 'active'
    `;

    // 2. Generate a secure 6-digit access PIN
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

    const insertRows = await sql`
      INSERT INTO digital_keys (property_id, unit_id, booking_id, guest_id, lock_vendor, pin_code, valid_from, valid_to, status)
      VALUES (
        ${booking.property_id}, ${booking.unit_id}, ${booking.id}, ${booking.guest_id || null},
        'Salto Keyless PIN Lock', ${pinCode}, ${booking.check_in || new Date().toISOString()},
        ${booking.check_out || new Date(Date.now() + 86400000).toISOString()}, 'active'
      )
      RETURNING *
    ` as any[];

    return NextResponse.json({
      success: true,
      data: insertRows[0],
      message: `Digital Smart Key PIN ${pinCode} issued successfully for Unit access.`
    });
  } catch (error: any) {
    console.error("[Smart Key POST Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to generate digital key" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const body = await req.json();
    const { action } = body;

    const sql = getDb();

    if (action === "revoke") {
      await sql`
        UPDATE digital_keys SET status = 'revoked', updated_at = now()
        WHERE booking_id = ${bookingId} AND status = 'active'
      `;
      return NextResponse.json({ success: true, message: "Digital smart key revoked." });
    }

    if (action === "regenerate") {
      // Fetch booking details
      const bookingRows = await sql`
        SELECT property_id, unit_id, guest_id, check_in, check_out
        FROM bookings WHERE id = ${bookingId} LIMIT 1
      ` as any[];
      if (bookingRows.length === 0) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      const booking = bookingRows[0];

      await sql`UPDATE digital_keys SET status = 'revoked', updated_at = now() WHERE booking_id = ${bookingId} AND status = 'active'`;

      const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
      const insertRows = await sql`
        INSERT INTO digital_keys (property_id, unit_id, booking_id, guest_id, lock_vendor, pin_code, valid_from, valid_to, status)
        VALUES (${booking.property_id}, ${booking.unit_id}, ${bookingId}, ${booking.guest_id || null}, 'Salto Keyless PIN Lock', ${pinCode}, ${booking.check_in}, ${booking.check_out}, 'active')
        RETURNING *
      ` as any[];

      return NextResponse.json({ success: true, data: insertRows[0], message: `Regenerated fresh PIN ${pinCode}.` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Smart Key PUT Error]", error);
    return NextResponse.json({ error: error?.message || "Failed to update digital key" }, { status: 500 });
  }
}
