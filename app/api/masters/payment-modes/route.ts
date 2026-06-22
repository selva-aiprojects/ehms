import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM payment_modes
      WHERE is_active = true
      ORDER BY name
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[masters/payment-modes GET]", error);
    return NextResponse.json({ error: "Failed to fetch payment modes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO payment_modes (name, code, type)
      VALUES (${body.name}, ${body.code}, ${body.type ?? 'online'})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[masters/payment-modes POST]", error);
    return NextResponse.json({ error: "Failed to create payment mode" }, { status: 500 });
  }
}
