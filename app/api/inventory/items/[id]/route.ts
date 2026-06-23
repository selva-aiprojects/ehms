import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();

    const rows = await sql`
      SELECT
        ii.*,
        json_build_object('id', ic.id, 'name', ic.name, 'description', ic.description) AS category,
        json_build_object('id', w.id, 'name', w.name, 'code', w.code, 'location', w.location) AS warehouse,
        CASE WHEN ii.quantity_on_hand <= ii.reorder_level THEN true ELSE false END AS is_low_stock
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ic.id = ii.category_id
      LEFT JOIN warehouses w ON w.id = ii.warehouse_id
      WHERE ii.id = ${id}
      LIMIT 1
    `;

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error("[inventory/items/:id GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch item" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const body = await req.json();

    const existing = await sql`SELECT * FROM inventory_items WHERE id = ${id}` as any[];
    if (existing.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const before = existing[0];

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fields = ["category_id", "name", "sku", "description", "unit", "quantity_on_hand", "reorder_level", "reorder_quantity", "unit_cost", "warehouse_id", "property_id", "is_active"];
    for (const f of fields) {
      if (body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push(body[f]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    const result = await (sql as any)(
      `UPDATE inventory_items SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    const after = result[0];

    // Auto-insert adjustment transaction if quantity_on_hand changed
    if (body.quantity_on_hand !== undefined && parseFloat(body.quantity_on_hand) !== parseFloat(before.quantity_on_hand)) {
      const diff = parseFloat(body.quantity_on_hand) - parseFloat(before.quantity_on_hand);
      const type = diff > 0 ? "adjustment_add" : "adjustment_subtract";
      await sql`
        INSERT INTO inventory_transactions (item_id, transaction_type, quantity, unit_cost, reference_type, warehouse_id, property_id, notes)
        VALUES (${id}, ${type}, ${Math.abs(diff)}, ${body.unit_cost || before.unit_cost}, 'manual_adjustment', ${body.warehouse_id || before.warehouse_id}, ${body.property_id || before.property_id}, 'Manual stock adjustment')
      `;
    }

    return NextResponse.json({ data: after });
  } catch (error: any) {
    console.error("[inventory/items/:id PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update item" }, { status: 500 });
  }
}
