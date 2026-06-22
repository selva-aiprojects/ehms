import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM id_proof_types
      WHERE is_active = true
      ORDER BY name
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[masters/id-proof-types GET]", error);
    return NextResponse.json({ error: "Failed to fetch ID proof types" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO id_proof_types (name, code, is_mandatory)
      VALUES (${body.name}, ${body.code ?? null}, ${body.is_mandatory ?? false})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[masters/id-proof-types POST]", error);
    return NextResponse.json({ error: "Failed to create ID proof type" }, { status: 500 });
  }
}
