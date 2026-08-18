export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    let query = sql`SELECT * FROM fiscal_years WHERE 1=1`;
    if (propertyId) query = sql`${query} AND property_id = ${propertyId}`;
    query = sql`${query} ORDER BY start_date DESC`;

    return NextResponse.json({ data: await query });
  } catch (error) {
    console.error("[finance/fiscal-years GET]", error);
    return NextResponse.json({ error: "Failed to fetch fiscal years" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const rows = await sql`
      INSERT INTO fiscal_years (property_id, name, start_date, end_date)
      VALUES (${body.property_id}, ${body.name}, ${body.start_date}, ${body.end_date})
      RETURNING *`;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/fiscal-years POST]", error);
    return NextResponse.json({ error: "Failed to create fiscal year" }, { status: 500 });
  }
}
