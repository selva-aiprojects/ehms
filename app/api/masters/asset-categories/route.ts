import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM asset_categories
      WHERE is_active = true
      ORDER BY name
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[masters/asset-categories GET]", error);
    return NextResponse.json({ error: "Failed to fetch asset categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO asset_categories (name, code, description)
      VALUES (${body.name}, ${body.code ?? null}, ${body.description ?? null})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[masters/asset-categories POST]", error);
    return NextResponse.json({ error: "Failed to create asset category" }, { status: 500 });
  }
}
