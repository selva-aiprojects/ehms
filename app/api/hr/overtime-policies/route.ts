import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();

    const rows = await sql`
      SELECT * FROM overtime_policies
      WHERE is_active = true
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/overtime-policies GET]", error);
    return NextResponse.json({ error: "Failed to fetch overtime policies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO overtime_policies (name, multiplier, min_hours, max_hours_per_day, applicable_shifts, property_id)
      VALUES (${body.name}, ${body.multiplier}, ${body.min_hours}, ${body.max_hours_per_day}, ${body.applicable_shifts}, ${body.property_id})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/overtime-policies POST]", error);
    return NextResponse.json({ error: "Failed to create overtime policy" }, { status: 500 });
  }
}
