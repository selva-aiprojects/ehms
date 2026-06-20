import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT 
        b.id as booking_id,
        b.status,
        b.check_in,
        b.check_out,
        b.total_amount as room_charges,
        g.first_name,
        g.last_name,
        u.unit_label,
        COALESCE(SUM(i.subtotal), 0) + COALESCE(SUM(i.tax_total), 0) as invoice_total,
        COALESCE(SUM(i.balance_due), 0) as balance_due
      FROM bookings b
      JOIN guest_profiles g ON g.id = b.guest_id
      JOIN units u ON u.id = b.unit_id
      LEFT JOIN invoices i ON i.booking_id = b.id
      WHERE b.status IN ('checked_in', 'confirmed')
      GROUP BY b.id, b.status, b.check_in, b.check_out, b.total_amount, g.first_name, g.last_name, u.unit_label
      ORDER BY b.check_out ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[billing GET]", error);
    return NextResponse.json({ error: "Failed to fetch active folios" }, { status: 500 });
  }
}
