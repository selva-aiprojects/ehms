import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    const rows = await sql`
      SELECT
        hc.*,
        json_build_object('id', p.id, 'name', p.name) AS property
      FROM holiday_calendar hc
      LEFT JOIN properties p ON p.id = hc.property_id
      WHERE hc.is_active = true
        ${year ? sql`AND EXTRACT(YEAR FROM hc.date) = ${Number(year)}` : sql``}
      ORDER BY hc.date DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/holidays GET]", error);
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO holiday_calendar (name, date, type, applicable_to, property_id)
      VALUES (${body.name}, ${body.date}, ${body.type}, ${body.applicable_to}, ${body.property_id})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/holidays POST]", error);
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}
