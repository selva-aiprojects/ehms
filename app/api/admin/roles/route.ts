import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();

    const rows = await sql`
      SELECT
        r.id, r.name, r.description, r.is_system, r.created_at,
        COUNT(ur.user_id)::int AS user_count
      FROM roles r
      LEFT JOIN user_roles ur ON ur.role_id = r.id
      GROUP BY r.id
      ORDER BY r.name ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[admin/roles GET]", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}
