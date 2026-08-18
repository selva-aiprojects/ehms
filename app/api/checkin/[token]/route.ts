import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const sql = getDb();

    const result = await sql`
      SELECT cs.*, b.source_booking_ref, b.check_in AS bk_check_in, b.check_out AS bk_check_out, b.total_amount, b.status AS booking_status,
             gp.first_name || ' ' || gp.last_name AS guest_full_name, gp.email AS guest_email, gp.phone AS guest_phone,
             p.name AS property_name
      FROM checkin_sessions cs
      JOIN bookings b ON b.id = cs.booking_id
      JOIN properties p ON p.id = cs.property_id
      LEFT JOIN guest_profiles gp ON gp.id = cs.guest_id
      WHERE cs.session_token = ${token}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = result[0];
    if (session.expires_at && new Date(session.expires_at as string) < new Date()) {
      await sql`UPDATE checkin_sessions SET status = 'expired' WHERE id = ${session.id}`;
      session.status = "expired";
    }

    return NextResponse.json(session);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await req.json();
    const sql = getDb();

    const existing = await sql`SELECT id, status, booking_id, property_id FROM checkin_sessions WHERE session_token = ${token}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = existing[0];
    if (session.status === "expired" || session.status === "cancelled") {
      return NextResponse.json({ error: "Session is no longer active" }, { status: 400 });
    }

    const allowedFields: Record<string, string> = {
      status: "status", id_type: "id_type", id_number: "id_number",
      id_front_url: "id_front_url", id_back_url: "id_back_url",
      id_verified: "id_verified", id_verified_by: "id_verified_by", id_verified_at: "id_verified_at",
      selfie_url: "selfie_url", face_matched: "face_matched",
      form_c_submitted: "form_c_submitted",
      payment_method: "payment_method", payment_status: "payment_status",
      payment_amount: "payment_amount", payment_ref: "payment_ref",
      digital_key_issued: "digital_key_issued", digital_key_value: "digital_key_value",
      digital_key_expires: "digital_key_expires", ip_address: "ip_address", user_agent: "user_agent",
    };

    const setClauses: string[] = [];
    const values: any[] = [];
    for (const [key, col] of Object.entries(allowedFields)) {
      if (body[key] !== undefined) {
        setClauses.push(`${col} = $${setClauses.length + 1}`);
        values.push(body[key]);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    setClauses.push("updated_at = now()");
    values.push(token);

    const result = await sql.unsafe(
      `UPDATE checkin_sessions SET ${setClauses.join(", ")} WHERE session_token = $${setClauses.length} RETURNING *`,
      values
    );

    if (body.status === "completed") {
      await sql`UPDATE bookings SET status = 'checked_in', checked_in_at = now(), updated_at = now() WHERE id = ${session.booking_id}`;
      if (body.digital_key_issued && body.digital_key_value) {
        await sql`UPDATE checkin_sessions SET completed_at = now() WHERE id = ${session.id}`;
      }
    }

    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
