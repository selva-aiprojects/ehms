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
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT w.*,
        (SELECT COUNT(*)::int FROM inventory_items ii WHERE ii.warehouse_id = w.id AND ii.is_active = true) AS item_count
      FROM warehouses w
      WHERE 1=1
      ${propertyId ? sql`AND w.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND w.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY w.name ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[inventory/warehouses GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch warehouses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Warehouse name is required" }, { status: 400 });
    }

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO warehouses (name, code, location, manager_name, phone, property_id)
      VALUES (${body.name}, ${body.code || null}, ${body.location || null}, ${body.manager_name || null}, ${body.phone || null}, ${body.property_id || null})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[inventory/warehouses POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create warehouse" }, { status: 500 });
  }
}
