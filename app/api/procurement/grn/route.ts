import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateIndirectPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const { searchParams } = new URL(req.url);
    const poId = searchParams.get("po_id");

    let query = sql`
      SELECT
        grn.id, grn.grn_number, grn.received_date, grn.notes, grn.created_at,
        grn.po_id, grn.received_by,
        po.po_number,
        v.company_name as vendor_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', grnl.id, 'po_line_id', grnl.po_line_id,
              'received_qty', grnl.received_qty, 'accepted_qty', grnl.accepted_qty,
              'rejected_qty', grnl.rejected_qty, 'rejection_reason', grnl.rejection_reason,
              'item_description', pol.item_description
            ) ORDER BY grnl.id
          ) FILTER (WHERE grnl.id IS NOT NULL),
          '[]'
        ) AS lines
      FROM goods_received_notes grn
      LEFT JOIN purchase_orders po ON po.id = grn.po_id
      LEFT JOIN vendors v ON v.id = po.vendor_id
      LEFT JOIN grn_lines grnl ON grnl.grn_id = grn.id
      LEFT JOIN purchase_order_lines pol ON pol.id = grnl.po_line_id
      WHERE 1=1
    `;

    if (poId) query = sql`${query} AND grn.po_id = ${poId}`;
    else if (scope.assignedPropertyIds.length > 0) query = sql`${query} AND po.property_id = ANY(${scope.assignedPropertyIds})`;

    query = sql`${query} GROUP BY grn.id, po.po_number, v.company_name ORDER BY grn.received_date DESC`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[procurement/grn GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch GRNs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { po_id, received_date, notes, lines, received_by } = body;

    if (!po_id) {
      return NextResponse.json({ error: "Purchase order ID is required" }, { status: 400 });
    }

    // Validate property access indirectly via PO → property_id
    const accessErr = await validateIndirectPropertyAccess(req, sql, "purchase_orders", po_id);
    if (accessErr) return accessErr;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
    }

    const po = await sql`SELECT po_number, status FROM purchase_orders WHERE id = ${po_id}`;
    if (!po.length) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    const grnNumber = `GRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

    const grnResult = await sql`
      INSERT INTO goods_received_notes (po_id, grn_number, received_date, notes, received_by)
      VALUES (${po_id}, ${grnNumber}, ${received_date || new Date().toISOString().split("T")[0]}, ${notes || null}, ${received_by || null})
      RETURNING id, grn_number, received_date, created_at
    `;

    const grn = grnResult[0];

    for (const line of lines) {
      await sql`
        INSERT INTO grn_lines (grn_id, po_line_id, received_qty, accepted_qty, rejected_qty, rejection_reason)
        VALUES (${grn.id}, ${line.po_line_id}, ${line.received_qty}, ${line.accepted_qty || line.received_qty}, ${line.rejected_qty || 0}, ${line.rejection_reason || null})
      `;

      if (line.accepted_qty || line.received_qty) {
        await sql`
          UPDATE purchase_order_lines
          SET received_qty = received_qty + ${line.accepted_qty || line.received_qty}
          WHERE id = ${line.po_line_id}
        `;
      }
    }

    await sql`UPDATE purchase_orders SET status = 'received' WHERE id = ${po_id}`;

    const fullGrn = await sql`
      SELECT
        grn.id, grn.grn_number, grn.received_date, grn.notes, grn.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', grnl.id, 'po_line_id', grnl.po_line_id,
              'received_qty', grnl.received_qty, 'accepted_qty', grnl.accepted_qty,
              'rejected_qty', grnl.rejected_qty, 'rejection_reason', grnl.rejection_reason,
              'item_description', pol.item_description
            ) ORDER BY grnl.id
          ) FILTER (WHERE grnl.id IS NOT NULL),
          '[]'
        ) AS lines
      FROM goods_received_notes grn
      LEFT JOIN grn_lines grnl ON grnl.grn_id = grn.id
      LEFT JOIN purchase_order_lines pol ON pol.id = grnl.po_line_id
      WHERE grn.id = ${grn.id}
      GROUP BY grn.id
    `;

    return NextResponse.json({ data: fullGrn[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[procurement/grn POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create GRN" }, { status: 500 });
  }
}
