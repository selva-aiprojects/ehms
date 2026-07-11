import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT 
        b.id as booking_id,
        b.status,
        b.check_in,
        b.check_out,
        b.total_amount as room_charges,
        b.property_id,
        g.first_name,
        g.last_name,
        g.phone,
        u.unit_label,
        u.unit_type,
        p.name as property_name,
        COALESCE(inv.grand_total, b.total_amount, 0) as invoice_total,
        COALESCE(inv.paid_total, inv.amount_paid, 0) as amount_paid,
        COALESCE(inv.balance_due, b.total_amount, 0) as balance_due,
        inv.invoice_number,
        inv.status as invoice_status
      FROM bookings b
      JOIN guest_profiles g ON g.id = b.guest_id
      JOIN units u ON u.id = b.unit_id
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN invoices inv ON inv.booking_id = b.id
      WHERE b.status IN ('checked_in', 'confirmed')
        ${propertyId ? sql`AND b.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND b.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY b.check_out ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[billing GET]", error);
    return NextResponse.json({ error: "Failed to fetch active folios" }, { status: 500 });
  }
}
