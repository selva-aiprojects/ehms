import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const propertyId = searchParams.get("property_id");
    const date = searchParams.get("date");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const offset = (page - 1) * limit;

    const rows = await sql`
      SELECT
        b.*,
        json_build_object('id', g.id, 'first_name', g.first_name, 'last_name', g.last_name, 'email', g.email, 'phone', g.phone) AS guest,
        json_build_object('id', u.id, 'unit_label', u.unit_label, 'unit_type', u.unit_type, 'status', u.status) AS unit,
        json_build_object('id', p.id, 'name', p.name, 'vertical_type', p.vertical_type) AS property,
        COUNT(*) OVER()::int AS total_count
      FROM bookings b
      LEFT JOIN guest_profiles g ON g.id = b.guest_id
      LEFT JOIN units u ON u.id = b.unit_id
      LEFT JOIN properties p ON p.id = b.property_id
      WHERE 1=1
        ${status ? sql`AND b.status = ${status}` : sql``}
        ${propertyId ? sql`AND b.property_id = ${propertyId}` : sql``}
        ${date ? sql`AND b.check_in::date = ${date}::date` : sql``}
      ORDER BY b.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const count = rows.length > 0 ? (rows[0] as Record<string, unknown>).total_count as number : 0;
    const data = rows.map(r => { const { total_count, ...rest } = r as Record<string, unknown>; return rest; });

    return NextResponse.json({ data, count, page, limit });
  } catch (error) {
    console.error("[reservations GET]", error);
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, special_requests)
      VALUES (
        ${body.property_id}, ${body.unit_id}, ${body.guest_id},
        ${body.booking_model || "nightly"}, 'confirmed', ${body.source || "direct"},
        ${body.check_in}, ${body.check_out},
        ${body.adults || 1}, ${body.children || 0},
        ${body.total_amount}, ${body.special_requests || null}
      )
      RETURNING *
    `;

    if (body.unit_id) {
      await sql`UPDATE units SET status = 'reserved' WHERE id = ${body.unit_id}`;
    }

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create reservation";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
