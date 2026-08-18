import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;

    const rows = await sql`
      SELECT
        grn.id, grn.grn_number, grn.received_date, grn.notes, grn.created_at,
        grn.po_id, grn.received_by,
        po.po_number,
        v.company_name as vendor_name, v.id as vendor_id,
        COALESCE(
          json_agg(
            json_build_object(
              'id', grnl.id, 'po_line_id', grnl.po_line_id,
              'received_qty', grnl.received_qty, 'accepted_qty', grnl.accepted_qty,
              'rejected_qty', grnl.rejected_qty, 'rejection_reason', grnl.rejection_reason,
              'item_description', pol.item_description,
              'unit_price', pol.unit_price
            ) ORDER BY grnl.id
          ) FILTER (WHERE grnl.id IS NOT NULL),
          '[]'
        ) AS lines
      FROM goods_received_notes grn
      LEFT JOIN purchase_orders po ON po.id = grn.po_id
      LEFT JOIN vendors v ON v.id = po.vendor_id
      LEFT JOIN grn_lines grnl ON grnl.grn_id = grn.id
      LEFT JOIN purchase_order_lines pol ON pol.id = grnl.po_line_id
      WHERE grn.id = ${id}
      GROUP BY grn.id, po.po_number, v.company_name, v.id
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "GRN not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error("[procurement/grn/id GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch GRN" }, { status: 500 });
  }
}
