import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const taxType = searchParams.get("tax_type");

    const rows = await sql`
      SELECT * FROM tax_slabs
      WHERE is_active = true
        ${taxType ? sql`AND tax_type = ${taxType}` : sql``}
      ORDER BY name
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[masters/tax-slabs GET]", error);
    return NextResponse.json({ error: "Failed to fetch tax slabs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO tax_slabs (name, tax_type, rate, min_amount, max_amount, description)
      VALUES (
        ${body.name}, ${body.tax_type}, ${body.rate},
        ${body.min_amount ?? 0}, ${body.max_amount ?? null}, ${body.description ?? null}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[masters/tax-slabs POST]", error);
    return NextResponse.json({ error: "Failed to create tax slab" }, { status: 500 });
  }
}
