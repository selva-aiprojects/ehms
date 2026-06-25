import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendor_id");
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = sql`
      SELECT
        po.id, po.po_number, po.po_date, po.status, po.total_amount, po.notes,
        po.created_at, po.property_id, po.vendor_id,
        p.name as property_name,
        v.company_name as vendor_name,
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
      WHERE 1=1
    `;

    if (vendorId) query = sql`${query} AND po.vendor_id = ${vendorId}`;
    if (propertyId) query = sql`${query} AND po.property_id = ${propertyId}`;
    if (status) query = sql`${query} AND po.status = ${status}`;
    if (search) query = sql`${query} AND (po.po_number ILIKE ${`%${search}%`} OR v.company_name ILIKE ${`%${search}%`})`;

    query = sql`${query} GROUP BY po.id, p.name, v.company_name ORDER BY po.po_date DESC`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[procurement/purchase-orders GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch purchase orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { property_id, vendor_id, po_date, notes, line_items } = body;

    if (!property_id) {
      return NextResponse.json({ error: "Property is required" }, { status: 400 });
    }
    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
    }

    const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

    const result = await sql`
      INSERT INTO purchase_orders (property_id, vendor_id, po_number, po_date, notes, status)
      VALUES (${property_id}, ${vendor_id || null}, ${poNumber}, ${po_date || new Date().toISOString().split("T")[0]}, ${notes || null}, 'draft')
      RETURNING id, po_number, po_date, status, total_amount, created_at
    `;

    const po = result[0];

    for (const item of line_items) {
      await sql`
        INSERT INTO purchase_order_lines (po_id, item_description, quantity, unit_price)
        VALUES (${po.id}, ${item.item_description}, ${item.quantity}, ${item.unit_price})
      `;
    }

    const fullPo = await sql`
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
      WHERE po.id = ${po.id}
      GROUP BY po.id
    `;

    return NextResponse.json({ data: fullPo[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[procurement/purchase-orders POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create purchase order" }, { status: 500 });
  }
}
