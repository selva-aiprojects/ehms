import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const offset = (page - 1) * limit;

    const rows = await sql`
      SELECT *, COUNT(*) OVER()::int AS total_count
      FROM guest_profiles
      WHERE 1=1
        ${search ? sql`AND (
          first_name ILIKE ${"%" + search + "%"} OR
          last_name  ILIKE ${"%" + search + "%"} OR
          email      ILIKE ${"%" + search + "%"} OR
          phone      ILIKE ${"%" + search + "%"}
        )` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const results = rows as any[];
    const count = results.length > 0 ? (results[0] as Record<string, unknown>).total_count as number : 0;
    const data = results.map(r => { const { total_count, ...rest } = r as Record<string, unknown>; return rest; });
    return NextResponse.json({ data, count, page, limit });
  } catch (error) {
    console.error("[guests GET]", error);
    return NextResponse.json({ error: "Failed to fetch guests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const rows = await sql`
      INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, date_of_birth)
      VALUES (
        ${body.first_name}, ${body.last_name}, ${body.email}, ${body.phone},
        ${body.nationality || null}, ${body.id_type || null}, ${body.id_number || null},
        ${body.date_of_birth || null}
      )
      RETURNING *
    `;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create guest";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
