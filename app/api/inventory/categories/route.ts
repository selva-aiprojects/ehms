export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT c.*, p.name AS parent_name,
        (SELECT COUNT(*)::int FROM inventory_items ii WHERE ii.category_id = c.id AND ii.is_active = true) AS item_count
      FROM inventory_categories c
      LEFT JOIN inventory_categories p ON p.id = c.parent_id
      WHERE 1=1
      ${propertyId ? sql`AND c.property_id = ${propertyId}` : sql``}
      ORDER BY c.name ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[inventory/categories GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO inventory_categories (name, description, parent_id, property_id)
      VALUES (${body.name}, ${body.description || null}, ${body.parent_id || null}, ${body.property_id || null})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[inventory/categories POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create category" }, { status: 500 });
  }
}
