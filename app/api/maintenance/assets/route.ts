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

    const rows = await sql`
      SELECT
        ar.*,
        json_build_object('id', u.id, 'unit_label', u.unit_label) AS unit,
        json_build_object('id', p.id, 'name', p.name) AS property
      FROM asset_register ar
      LEFT JOIN units u ON u.id = ar.unit_id
      LEFT JOIN properties p ON p.id = ar.property_id
      WHERE 1=1
      ${propertyId ? sql`AND ar.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND ar.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ${status ? sql`AND ar.status = ${status}` : sql``}
      ORDER BY ar.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[assets GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO asset_register (unit_id, property_id, asset_type, brand, model, serial_number, purchase_date, warranty_months, depreciation_method, depreciation_rate, current_value, status)
      VALUES (
        ${body.unit_id || null},
        ${body.property_id},
        ${body.asset_type},
        ${body.brand || null},
        ${body.model || null},
        ${body.serial_number || null},
        ${body.purchase_date || null},
        ${body.warranty_months || null},
        ${body.depreciation_method || null},
        ${body.depreciation_rate || null},
        ${body.current_value || null},
        ${body.status || "active"}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[assets POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create asset" }, { status: 500 });
  }
}
