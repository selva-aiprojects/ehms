import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    
    // Fetch all currently checked-in bookings to populate dropdowns
    const rows = await sql`
      SELECT 
        b.id as booking_id,
        g.id as guest_id,
        g.first_name,
        g.last_name,
        u.unit_label
      FROM bookings b
      JOIN guest_profiles g ON g.id = b.guest_id
      JOIN units u ON u.id = b.unit_id
      WHERE b.status = 'checked_in'
      ORDER BY u.unit_label ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[active-bookings GET]", error);
    return NextResponse.json({ error: "Failed to fetch active bookings" }, { status: 500 });
  }
}
