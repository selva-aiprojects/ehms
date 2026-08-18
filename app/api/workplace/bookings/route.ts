export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const bookingType = searchParams.get("booking_type");
    const date = searchParams.get("date");

    const rows = await sql`
      SELECT
        wb.*,
        json_build_object('id', mem.id, 'first_name', mem.first_name, 'last_name', mem.last_name, 'email', mem.email) AS member,
        json_build_object('id', u.id, 'unit_label', u.unit_label, 'unit_type', u.unit_type) AS unit
      FROM workplace_bookings wb
      LEFT JOIN users mem ON mem.id = wb.member_id
      LEFT JOIN units u ON u.id = wb.unit_id
      WHERE 1=1
        ${status ? sql`AND wb.status = ${status}` : sql``}
        ${bookingType ? sql`AND wb.booking_type = ${bookingType}` : sql``}
        ${date ? sql`AND wb.start_time::date = ${date}::date` : sql``}
      ORDER BY wb.start_time ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.warn("[workplace/bookings GET] table may not exist:", error);
    return NextResponse.json({ data: [] });
  }
}
