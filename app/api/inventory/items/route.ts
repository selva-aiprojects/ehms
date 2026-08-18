export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

async function generateSku(sql: any, categoryId?: string, propertyId?: string): Promise<string> {
  const prefix = "INV";
  const seqResult = await sql`SELECT LPAD((NEXTVAL('gen_random_uuid()')::int % 9999 + 1)::text, 4, '0') AS seq`;
  const seq = (seqResult as any[])[0]?.seq || String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `${prefix}-${seq}`;
}

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const categoryId = searchParams.get("category_id");
    const search = searchParams.get("search");
    const lowStock = searchParams.get("low_stock");

    const rows = await sql`
      SELECT
        ii.*,
        json_build_object('id', ic.id, 'name', ic.name) AS category,
        json_build_object('id', w.id, 'name', w.name, 'code', w.code) AS warehouse,
        CASE WHEN ii.quantity_on_hand <= ii.reorder_level THEN true ELSE false END AS is_low_stock
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ic.id = ii.category_id
      LEFT JOIN warehouses w ON w.id = ii.warehouse_id
      WHERE 1=1
      ${propertyId ? sql`AND ii.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND ii.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ${categoryId ? sql`AND ii.category_id = ${categoryId}` : sql``}
      ${lowStock === "true" ? sql`AND ii.quantity_on_hand <= ii.reorder_level` : sql``}
      ${search ? sql`AND (ii.name ILIKE ${"%" + search + "%"} OR ii.sku ILIKE ${"%" + search + "%"} OR ii.description ILIKE ${"%" + search + "%"})` : sql``}
      ORDER BY ii.name ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[inventory/items GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch inventory items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const sku = body.sku || await generateSku(sql, body.category_id, body.property_id);

    const rows = await sql`
      INSERT INTO inventory_items (category_id, name, sku, description, unit, quantity_on_hand, reorder_level, reorder_quantity, unit_cost, warehouse_id, property_id)
      VALUES (${body.category_id || null}, ${body.name}, ${sku}, ${body.description || null}, ${body.unit || "pcs"}, ${body.quantity_on_hand || 0}, ${body.reorder_level || 0}, ${body.reorder_quantity || 0}, ${body.unit_cost || 0}, ${body.warehouse_id || null}, ${body.property_id || null})
      RETURNING *
    `;

    const item = rows[0] as any;

    if (parseFloat(item.quantity_on_hand) > 0) {
      await sql`
        INSERT INTO inventory_transactions (item_id, transaction_type, quantity, unit_cost, reference_type, warehouse_id, property_id, notes)
        VALUES (${item.id}, 'purchase_receipt', ${item.quantity_on_hand}, ${item.unit_cost}, 'initial_stock', ${item.warehouse_id}, ${item.property_id}, 'Initial stock on creation')
      `;
    }

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error: any) {
    console.error("[inventory/items POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create inventory item" }, { status: 500 });
  }
}
