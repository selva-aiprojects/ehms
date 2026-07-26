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

    const station = req.nextUrl.searchParams.get("station");
    const status = req.nextUrl.searchParams.get("status");

    const rows = await sql`
      SELECT
        k.id, k.property_id, k.order_id, k.table_number,
        k.priority, k.status, k.station,
        k.fired_at, k.acknowledged_at, k.ready_at, k.served_at,
        k.notes, k.updated_at,
        o.order_type, o.total_amount,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'item_name', oi.item_name,
                'quantity', oi.quantity,
                'price', oi.unit_price
              )
            ),
            '[]'::json
          )
          FROM f_and_b_order_items oi WHERE oi.order_id = o.id
        ) AS items
      FROM kds_tickets k
      LEFT JOIN f_and_b_orders o ON o.id = k.order_id
      WHERE 1=1
      ${scope.assignedPropertyIds.length > 0 ? sql`AND k.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ${station ? sql`AND k.station = ${station}` : sql``}
      ${status ? sql`AND k.status = ${status}` : sql``}
      ORDER BY
        CASE k.priority WHEN 'rush' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END,
        k.fired_at ASC
    `;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[kds GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { property_id, order_id, table_number, priority, station, notes } = body;
    if (!property_id || !order_id) {
      return NextResponse.json({ error: "property_id and order_id required" }, { status: 400 });
    }
    const accessErr = validateMutationPropertyAccess(req, property_id);
    if (accessErr) return accessErr;
    const sql = getDb();

    let resolvedTable = table_number;
    if (!resolvedTable) {
      const orderRows = await sql`SELECT booking_id FROM f_and_b_orders WHERE id = ${order_id}` as any[];
      if (orderRows.length > 0 && orderRows[0].booking_id) {
        const tblRows = await sql`
          SELECT t.table_number FROM restaurant_tables t
          JOIN bookings b ON b.id = ${orderRows[0].booking_id}
          WHERE t.booking_id = ${orderRows[0].booking_id} LIMIT 1
        ` as any[];
        if (tblRows.length > 0) resolvedTable = tblRows[0].table_number;
      }
    }

    const rows = await sql`
      INSERT INTO kds_tickets (property_id, order_id, table_number, priority, station, notes)
      VALUES (${property_id}, ${order_id}, ${resolvedTable || null}, ${priority || "normal"}, ${station || "all"}, ${notes || null})
      RETURNING *
    `;
    return NextResponse.json({ data: (rows as any[])[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[kds POST]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
