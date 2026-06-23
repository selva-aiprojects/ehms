import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendor_id");
    const status = searchParams.get("status");

    let query = sql`
      SELECT 
        po.id, po.po_number, po.po_date, po.status, po.total_amount, po.notes,
        po.created_at, po.property_id,
        p.name as property_name,
        COALESCE(
          json_agg(json_build_object('id', pol.id, 'item_description', pol.item_description, 'quantity', pol.quantity, 'unit_price', pol.unit_price, 'line_total', pol.line_total, 'received_qty', pol.received_qty)) FILTER (WHERE pol.id IS NOT NULL),
          '[]'
        ) AS line_items
      FROM purchase_orders po
      LEFT JOIN properties p ON p.id = po.property_id
      LEFT JOIN purchase_order_lines pol ON pol.po_id = po.id
      WHERE 1=1
    `;

    if (vendorId) {
      query = sql`${query} AND po.vendor_id = ${vendorId}`;
    }
    if (status) {
      query = sql`${query} AND po.status = ${status}`;
    }

    query = sql`${query} GROUP BY po.id, p.name ORDER BY po.po_date DESC`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[vendors/orders GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch vendor orders" }, { status: 500 });
  }
}
