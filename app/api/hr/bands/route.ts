import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest) {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT *
      FROM employee_bands
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/bands GET]", error);
    return NextResponse.json({ error: "Failed to fetch employee bands" }, { status: 500 });
  }
}
