import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM uom
      WHERE is_active = true
      ORDER BY name
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[masters/uom GET]", error);
    return NextResponse.json({ error: "Failed to fetch UOMs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO uom (name, code, description)
      VALUES (${body.name}, ${body.code}, ${body.description ?? null})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[masters/uom POST]", error);
    return NextResponse.json({ error: "Failed to create UOM" }, { status: 500 });
  }
}
