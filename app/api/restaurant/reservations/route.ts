import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const dateFrom = req.nextUrl.searchParams.get("date_from");
    const dateTo = req.nextUrl.searchParams.get("date_to");

    const rows = await sql`
      SELECT
        r.id, r.property_id, r.table_id, r.booking_id,
        r.guest_name, r.guest_phone, r.party_size,
        r.reservation_time, r.duration_mins, r.status, r.notes, r.created_at,
        t.table_number, t.capacity
      FROM table_reservations r
      LEFT JOIN restaurant_tables t ON t.id = r.table_id
      WHERE 1=1
      ${scope.assignedPropertyIds.length > 0 ? sql`AND r.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ${dateFrom ? sql`AND r.reservation_time >= ${dateFrom}::timestamptz` : sql``}
      ${dateTo ? sql`AND r.reservation_time <= ${dateTo}::timestamptz` : sql``}
      ORDER BY r.reservation_time DESC
      LIMIT 100
    `;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[reservations GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { property_id, table_id, booking_id, guest_name, guest_phone, party_size, reservation_time, duration_mins, notes } = body;
    if (!property_id || !table_id || !reservation_time) {
      return NextResponse.json({ error: "property_id, table_id, reservation_time required" }, { status: 400 });
    }
    const accessErr = validateMutationPropertyAccess(req, property_id);
    if (accessErr) return accessErr;
    const sql = getDb();

    const rows = await sql`
      INSERT INTO table_reservations
        (property_id, table_id, booking_id, guest_name, guest_phone, party_size, reservation_time, duration_mins, notes)
      VALUES
        (${property_id}, ${table_id}, ${booking_id || null}, ${guest_name || null}, ${guest_phone || null},
         ${party_size || 2}, ${reservation_time}, ${duration_mins || 120}, ${notes || null})
      RETURNING *
    `;

    await sql`UPDATE restaurant_tables SET status = 'reserved', updated_at = now() WHERE id = ${table_id}`;

    return NextResponse.json({ data: (rows as any[])[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[reservations POST]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
