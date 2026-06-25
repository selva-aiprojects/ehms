import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;

    const rows = await sql`
      SELECT
        po.id, po.po_number, po.po_date, po.status, po.total_amount, po.notes,
        po.created_at, po.property_id, po.vendor_id,
        p.name as property_name,
        v.company_name as vendor_name, v.contact_person as vendor_contact, v.phone as vendor_phone, v.email as vendor_email,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pol.id, 'item_description', pol.item_description,
              'quantity', pol.quantity, 'unit_price', pol.unit_price,
              'line_total', pol.line_total, 'received_qty', pol.received_qty
            ) ORDER BY pol.id
          ) FILTER (WHERE pol.id IS NOT NULL),
          '[]'
        ) AS line_items
      FROM purchase_orders po
      LEFT JOIN properties p ON p.id = po.property_id
      LEFT JOIN vendors v ON v.id = po.vendor_id
      LEFT JOIN purchase_order_lines pol ON pol.po_id = po.id
      WHERE po.id = ${id}
      GROUP BY po.id, p.name, v.company_name, v.contact_person, v.phone, v.email
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error("[procurement/purchase-orders/id GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch purchase order" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();
    const { status, vendor_id, po_date, notes, line_items } = body;

    const validStatuses = ["draft", "sent", "approved", "received", "closed"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM purchase_orders WHERE id = ${id}`;
    if (!existing.length) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    if (vendor_id !== undefined) await sql`UPDATE purchase_orders SET vendor_id = ${vendor_id || null} WHERE id = ${id}`;
    if (po_date !== undefined) await sql`UPDATE purchase_orders SET po_date = ${po_date} WHERE id = ${id}`;
    if (notes !== undefined) await sql`UPDATE purchase_orders SET notes = ${notes} WHERE id = ${id}`;
    if (status) await sql`UPDATE purchase_orders SET status = ${status} WHERE id = ${id}`;

    if (line_items && Array.isArray(line_items)) {
      await sql`DELETE FROM purchase_order_lines WHERE po_id = ${id}`;
      for (const item of line_items) {
        await sql`
          INSERT INTO purchase_order_lines (po_id, item_description, quantity, unit_price)
          VALUES (${id}, ${item.item_description}, ${item.quantity}, ${item.unit_price})
        `;
      }
    }

    const updated = await sql`
      SELECT
        po.id, po.po_number, po.po_date, po.status, po.total_amount, po.notes, po.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pol.id, 'item_description', pol.item_description,
              'quantity', pol.quantity, 'unit_price', pol.unit_price,
              'line_total', pol.line_total, 'received_qty', pol.received_qty
            ) ORDER BY pol.id
          ) FILTER (WHERE pol.id IS NOT NULL),
          '[]'
        ) AS line_items
      FROM purchase_orders po
      LEFT JOIN purchase_order_lines pol ON pol.po_id = po.id
      WHERE po.id = ${id}
      GROUP BY po.id
    `;

    return NextResponse.json({ data: updated[0] });
  } catch (error: any) {
    console.error("[procurement/purchase-orders/id PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update purchase order" }, { status: 500 });
  }
}
