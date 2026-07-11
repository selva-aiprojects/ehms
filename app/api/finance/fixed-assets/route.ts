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
    const status = searchParams.get("status");

    let query = sql`SELECT * FROM fixed_assets WHERE 1=1`;
    if (propertyId) query = sql`${query} AND property_id = ${propertyId}`;
    else if (scope.assignedPropertyIds.length > 0) query = sql`${query} AND property_id = ANY(${scope.assignedPropertyIds})`;
    if (status) query = sql`${query} AND status = ${status}`;
    query = sql`${query} ORDER BY purchase_date DESC`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[finance/fixed-assets GET]", error);
    return NextResponse.json({ error: "Failed to fetch fixed assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO fixed_assets (property_id, asset_code, asset_name, category, purchase_date, purchase_cost, salvage_value, useful_life_yrs, depreciation_method, location, assigned_to, account_id, notes)
      VALUES (${body.property_id}, ${body.asset_code}, ${body.asset_name}, ${body.category || null}, ${body.purchase_date}, ${body.purchase_cost}, ${body.salvage_value || 0}, ${body.useful_life_yrs}, ${body.depreciation_method || 'straight_line'}, ${body.location || null}, ${body.assigned_to || null}, ${body.account_id || null}, ${body.notes || null})
      RETURNING *`;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/fixed-assets POST]", error);
    return NextResponse.json({ error: "Failed to create fixed asset" }, { status: 500 });
  }
}
