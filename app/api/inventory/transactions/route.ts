export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("item_id");
    const propertyId = searchParams.get("property_id");
    const transactionType = searchParams.get("transaction_type");
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");

    const rows = await sql`
      SELECT
        it.*,
        ii.name AS item_name,
        ii.sku AS item_sku,
        ic.name AS category_name,
        w.name AS warehouse_name
      FROM inventory_transactions it
      JOIN inventory_items ii ON ii.id = it.item_id
      LEFT JOIN inventory_categories ic ON ic.id = ii.category_id
      LEFT JOIN warehouses w ON w.id = it.warehouse_id
      WHERE 1=1
      ${itemId ? sql`AND it.item_id = ${itemId}` : sql``}
      ${propertyId ? sql`AND it.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND it.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ${transactionType ? sql`AND it.transaction_type = ${transactionType}` : sql``}
      ${fromDate ? sql`AND it.created_at >= ${fromDate}` : sql``}
      ${toDate ? sql`AND it.created_at <= ${toDate + " 23:59:59"}` : sql``}
      ORDER BY it.created_at DESC
      LIMIT 500
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[inventory/transactions GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    if (!body.item_id || !body.transaction_type || !body.quantity) {
      return NextResponse.json({ error: "item_id, transaction_type, and quantity are required" }, { status: 400 });
    }

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const validTypes = ["purchase_receipt", "sales_issue", "transfer_in", "transfer_out", "adjustment_add", "adjustment_subtract", "return", "damage"];
    if (!validTypes.includes(body.transaction_type)) {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }

    const quantity = Math.abs(parseFloat(body.quantity));
    if (quantity <= 0) {
      return NextResponse.json({ error: "Quantity must be greater than zero" }, { status: 400 });
    }

    const item = await sql`SELECT * FROM inventory_items WHERE id = ${body.item_id}` as any[];
    if (item.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Determine which types increase vs decrease stock
    const inboundTypes = ["purchase_receipt", "return", "transfer_in", "adjustment_add"];
    const outboundTypes = ["sales_issue", "damage", "adjustment_subtract", "transfer_out"];

    const isInbound = inboundTypes.includes(body.transaction_type);
    const isOutbound = outboundTypes.includes(body.transaction_type);

    if (isOutbound && parseFloat(item[0].quantity_on_hand) < quantity) {
      return NextResponse.json({ error: "Insufficient stock on hand" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO inventory_transactions (item_id, transaction_type, quantity, unit_cost, reference_type, reference_id, notes, warehouse_id, property_id, created_by)
      VALUES (${body.item_id}, ${body.transaction_type}, ${quantity}, ${body.unit_cost || item[0].unit_cost}, ${body.reference_type || null}, ${body.reference_id || null}, ${body.notes || null}, ${body.warehouse_id || item[0].warehouse_id}, ${body.property_id || item[0].property_id}, ${body.created_by || null})
      RETURNING *
    `;

    // Update item quantity
    if (isInbound) {
      await sql`
        UPDATE inventory_items
        SET quantity_on_hand = quantity_on_hand + ${quantity}, unit_cost = COALESCE(${body.unit_cost}, unit_cost)
        WHERE id = ${body.item_id}
      `;
    } else if (isOutbound) {
      await sql`
        UPDATE inventory_items SET quantity_on_hand = quantity_on_hand - ${quantity}
        WHERE id = ${body.item_id}
      `;
    }

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[inventory/transactions POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create transaction" }, { status: 500 });
  }
}
