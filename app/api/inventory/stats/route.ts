export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const totalItems = await sql`
      SELECT COUNT(*)::int AS count FROM inventory_items
      WHERE is_active = true ${propertyId ? sql`AND property_id = ${propertyId}` : sql``}
    `;

    const totalValue = await sql`
      SELECT COALESCE(SUM(quantity_on_hand * unit_cost), 0) AS total FROM inventory_items
      WHERE is_active = true ${propertyId ? sql`AND property_id = ${propertyId}` : sql``}
    `;

    const lowStock = await sql`
      SELECT COUNT(*)::int AS count FROM inventory_items
      WHERE is_active = true AND quantity_on_hand <= reorder_level
      ${propertyId ? sql`AND property_id = ${propertyId}` : sql``}
    `;

    const totalCategories = await sql`
      SELECT COUNT(*)::int AS count FROM inventory_categories
      WHERE is_active = true ${propertyId ? sql`AND property_id = ${propertyId}` : sql``}
    `;

    const recentTransactions = await sql`
      SELECT it.*, ii.name AS item_name
      FROM inventory_transactions it
      JOIN inventory_items ii ON ii.id = it.item_id
      ${propertyId ? sql`WHERE it.property_id = ${propertyId}` : sql``}
      ORDER BY it.created_at DESC LIMIT 10
    `;

    return NextResponse.json({
      data: {
        total_items: (totalItems as any[])[0]?.count || 0,
        total_value: (totalValue as any[])[0]?.total || 0,
        low_stock_count: (lowStock as any[])[0]?.count || 0,
        total_categories: (totalCategories as any[])[0]?.count || 0,
        recent_transactions: recentTransactions || [],
      },
    });
  } catch (error: any) {
    console.error("[inventory/stats GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch inventory stats" }, { status: 500 });
  }
}
