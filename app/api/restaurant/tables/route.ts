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
      SELECT
        t.id, t.property_id, t.section_id, t.table_number, t.capacity,
        t.status, t.pos_x, t.pos_y, t.width, t.height, t.shape,
        t.booking_id, t.occupied_at, t.guest_count, t.updated_at,
        s.name AS section_name,
        o.id AS current_order_id, o.total_amount AS current_order_total,
        k.status AS kds_status, k.priority AS kds_priority
      FROM restaurant_tables t
      LEFT JOIN restaurant_sections s ON s.id = t.section_id
      LEFT JOIN f_and_b_orders o ON o.booking_id = t.booking_id AND o.status IN ('pending','preparing')
      LEFT JOIN kds_tickets k ON k.order_id = o.id AND k.status IN ('new','in_progress','ready')
      WHERE 1=1
      ${scope.assignedPropertyIds.length > 0 ? sql`AND t.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY s.sort_order, t.table_number
    `;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[restaurant tables GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { property_id, section_id, table_number, capacity, shape, pos_x, pos_y } = body;
    if (!property_id || !table_number) {
      return NextResponse.json({ error: "property_id and table_number required" }, { status: 400 });
    }
    const accessErr = validateMutationPropertyAccess(req, property_id);
    if (accessErr) return accessErr;
    const sql = getDb();
    const rows = await sql`
      INSERT INTO restaurant_tables (property_id, section_id, table_number, capacity, shape, pos_x, pos_y)
      VALUES (${property_id}, ${section_id || null}, ${table_number}, ${capacity || 4}, ${shape || "square"}, ${pos_x || 0}, ${pos_y || 0})
      RETURNING *
    `;
    return NextResponse.json({ data: (rows as any[])[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[restaurant tables POST]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
