import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const sql = getDb();

    const result = await sql`
      SELECT cos.*, b.source_booking_ref, b.check_in AS bk_check_in, b.check_out AS bk_check_out,
             p.name AS property_name
      FROM checkout_sessions cos
      JOIN bookings b ON b.id = cos.booking_id
      JOIN properties p ON p.id = cos.property_id
      WHERE cos.session_token = ${token}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = result[0];
    if (session.expires_at && new Date(session.expires_at as string) < new Date()) {
      await sql`UPDATE checkout_sessions SET status = 'expired' WHERE id = ${session.id}`;
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

    const existing = await sql`SELECT id, status, booking_id FROM checkout_sessions WHERE session_token = ${token}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = existing[0];
    if (session.status === "expired" || session.status === "completed") {
      return NextResponse.json({ error: "Session is no longer active" }, { status: 400 });
    }

    const allowedFields: Record<string, string> = {
      status: "status", payment_method: "payment_method", payment_status: "payment_status",
      payment_amount: "payment_amount", payment_ref: "payment_ref",
      satisfaction_rating: "satisfaction_rating", feedback_text: "feedback_text",
      digital_key_returned: "digital_key_returned",
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
      `UPDATE checkout_sessions SET ${setClauses.join(", ")} WHERE session_token = $${setClauses.length} RETURNING *`,
      values
    );

    if (body.status === "completed") {
      await sql`UPDATE bookings SET status = 'checked_out', checked_out_at = now(), updated_at = now() WHERE id = ${session.booking_id}`;
    }

    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
