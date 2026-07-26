import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const sections = await sql`
      SELECT id, name, description, sort_order, is_active
      FROM restaurant_sections
      WHERE is_active = true
      ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY sort_order
    `;

    const tables = await sql`
      SELECT
        t.id, t.section_id, t.table_number, t.capacity, t.status,
        t.pos_x, t.pos_y, t.width, t.height, t.shape,
        t.occupied_at, t.guest_count, t.booking_id
      FROM restaurant_tables t
      WHERE 1=1
      ${scope.assignedPropertyIds.length > 0 ? sql`AND t.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY t.table_number
    `;

    const grouped = (sections as any[]).map((sec: any) => ({
      ...sec,
      tables: (tables as any[]).filter((t: any) => t.section_id === sec.id),
    }));

    const unsectioned = (tables as any[]).filter(
      (t: any) => !grouped.some((g: any) => g.id === t.section_id)
    );
    if (unsectioned.length > 0) {
      grouped.push({ id: null, name: "Unassigned", tables: unsectioned });
    }

    return NextResponse.json({ data: grouped });
  } catch (error: any) {
    console.error("[restaurant layout GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
