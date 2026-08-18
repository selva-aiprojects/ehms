import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT 
        gf.id,
        gf.rating,
        gf.comments,
        gf.department,
        gf.created_at,
        gf.booking_id,
        u.unit_label,
        u.id as unit_id,
        g.first_name,
        g.last_name
      FROM guest_feedbacks gf
      LEFT JOIN bookings b ON b.id = gf.booking_id
      LEFT JOIN units u ON u.id = b.unit_id
      LEFT JOIN guest_profiles g ON g.id = gf.guest_id
      WHERE gf.rating <= 3
      AND gf.department IN ('Maintenance', 'Housekeeping', 'Utilities', 'Overall')
      ${propertyId ? sql`AND gf.property_id = ${propertyId}` : sql``}
      ORDER BY gf.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[feedback-triage GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch feedback" }, { status: 500 });
  }
}
