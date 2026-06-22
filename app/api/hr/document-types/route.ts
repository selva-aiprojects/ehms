import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();

    const rows = await sql`
      SELECT * FROM document_types
      WHERE is_active = true
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/document-types GET]", error);
    return NextResponse.json({ error: "Failed to fetch document types" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO document_types (name, code, category, description, is_mandatory)
      VALUES (${body.name}, ${body.code}, ${body.category}, ${body.description}, ${body.is_mandatory})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/document-types POST]", error);
    return NextResponse.json({ error: "Failed to create document type" }, { status: 500 });
  }
}
