import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT id, name, code, commission_rate, is_active, created_at
      FROM channel_partners
      ORDER BY name
    `;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[masters/channels GET]", error);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}
