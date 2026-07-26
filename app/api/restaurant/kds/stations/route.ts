import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT id, name, station_type, is_active, display_order
      FROM kds_stations
      WHERE is_active = true
      ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY display_order
    `;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[kds stations GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { property_id, name, station_type, display_order } = body;
    if (!property_id || !name) {
      return NextResponse.json({ error: "property_id and name required" }, { status: 400 });
    }
    const accessErr = validateMutationPropertyAccess(req, property_id);
    if (accessErr) return accessErr;
    const sql = getDb();

    const rows = await sql`
      INSERT INTO kds_stations (property_id, name, station_type, display_order)
      VALUES (${property_id}, ${name}, ${station_type || "all"}, ${display_order || 0})
      RETURNING *
    `;
    return NextResponse.json({ data: (rows as any[])[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[kds stations POST]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
