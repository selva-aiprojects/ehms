import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");

    const rows = await sql`
      SELECT 
        f.id,
        f.booking_id,
        f.department,
        f.rating,
        f.comments,
        f.created_at,
        g.first_name,
        g.last_name,
        u.unit_label
      FROM guest_feedbacks f
      LEFT JOIN guest_profiles g ON g.id = f.guest_id
      LEFT JOIN bookings b ON b.id = f.booking_id
      LEFT JOIN units u ON u.id = b.unit_id
      WHERE ${department ? sql`f.department = ${department}` : sql`1=1`}
      ORDER BY f.created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[feedbacks GET]", error);
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { booking_id, guest_id, property_id, department, rating, comments } = body;

    if (!department || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO guest_feedbacks (property_id, booking_id, guest_id, department, rating, comments, status)
      VALUES (${property_id || null}, ${booking_id || null}, ${guest_id || null}, ${department}, ${rating}, ${comments}, 'new')
      RETURNING id
    `;
    const newFeedback = (result as any[])[0];

    return NextResponse.json({ success: true, id: newFeedback.id });
  } catch (error) {
    console.error("[feedbacks POST]", error);
    return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 });
  }
}
