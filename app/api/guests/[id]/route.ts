import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const rows = await sql`
      SELECT * FROM guest_profiles WHERE id = ${id} LIMIT 1
    `;
    if (!rows[0]) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[guest GET by id]", error);
    return NextResponse.json({ error: "Failed to fetch guest" }, { status: 500 });
  }
}
