import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM booking_sources
      WHERE is_active = true
      ORDER BY name
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[masters/booking-sources GET]", error);
    return NextResponse.json({ error: "Failed to fetch booking sources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO booking_sources (name, code, commission_pct)
      VALUES (${body.name}, ${body.code}, ${body.commission_pct ?? 0})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[masters/booking-sources POST]", error);
    return NextResponse.json({ error: "Failed to create booking source" }, { status: 500 });
  }
}
