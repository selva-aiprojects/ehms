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
        SELECT cos.*, b.source_booking_ref, b.check_in AS bk_check_in, b.check_out AS bk_check_out, b.total_amount,
               gp.first_name || ' ' || gp.last_name AS guest_full_name, gp.email AS guest_email
        FROM checkout_sessions cos
        JOIN bookings b ON b.id = cos.booking_id
        LEFT JOIN checkin_sessions cis ON cis.id = cos.checkin_session_id
        LEFT JOIN guest_profiles gp ON gp.id = cis.guest_id
        WHERE cos.property_id = ${propertyId} AND cos.status = ${status}
        ORDER BY cos.created_at DESC LIMIT 100
      `;
    } else if (propertyId) {
      rows = await sql`
        SELECT cos.*, b.source_booking_ref, b.check_in AS bk_check_in, b.check_out AS bk_check_out, b.total_amount,
               gp.first_name || ' ' || gp.last_name AS guest_full_name, gp.email AS guest_email
        FROM checkout_sessions cos
        JOIN bookings b ON b.id = cos.booking_id
        LEFT JOIN checkin_sessions cis ON cis.id = cos.checkin_session_id
        LEFT JOIN guest_profiles gp ON gp.id = cis.guest_id
        WHERE cos.property_id = ${propertyId}
        ORDER BY cos.created_at DESC LIMIT 100
      `;
    } else {
      rows = await sql`
        SELECT cos.*, b.source_booking_ref, b.check_in AS bk_check_in, b.check_out AS bk_check_out, b.total_amount,
               gp.first_name || ' ' || gp.last_name AS guest_full_name, gp.email AS guest_email
        FROM checkout_sessions cos
        JOIN bookings b ON b.id = cos.booking_id
        LEFT JOIN checkin_sessions cis ON cis.id = cos.checkin_session_id
        LEFT JOIN guest_profiles gp ON gp.id = cis.guest_id
        ORDER BY cos.created_at DESC LIMIT 100
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
    const { property_id, booking_id, checkin_session_id } = body;
    const sql = getDb();

    if (!property_id || !booking_id) {
      return NextResponse.json({ error: "property_id and booking_id required" }, { status: 400 });
    }

    const resCheck = await sql`SELECT id, status, total_amount, paid_amount FROM bookings WHERE id = ${booking_id} AND property_id = ${property_id}`;
    if (resCheck.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (resCheck[0].status !== "checked_in") {
      return NextResponse.json({ error: "Guest has not checked in" }, { status: 400 });
    }

    const existing = await sql`SELECT id, session_token, status FROM checkout_sessions WHERE booking_id = ${booking_id} AND status NOT IN ('expired','completed')`;
    if (existing.length > 0) {
      return NextResponse.json(existing[0]);
    }

    const totalAmount = Number(resCheck[0].total_amount || 0);
    const paidAmount = Number(resCheck[0].paid_amount || 0);
    const balance = totalAmount - paidAmount;

    const result = await sql`
      INSERT INTO checkout_sessions (property_id, booking_id, checkin_session_id, total_charges, total_payments, balance_due, status)
      VALUES (${property_id}, ${booking_id}, ${checkin_session_id || null}, ${totalAmount}, ${paidAmount}, ${balance}, 'pending') RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
