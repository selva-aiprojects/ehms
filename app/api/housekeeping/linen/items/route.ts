import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");

    const rows = await sql`
      SELECT
        li.*,
        json_build_object('id', lb.id, 'batch_id', lb.batch_id, 'item_type', lb.item_type) AS batch,
        CASE WHEN li.assigned_unit IS NOT NULL THEN json_build_object('id', u.id, 'unit_label', u.unit_label, 'unit_type', u.unit_type) ELSE NULL END AS unit
      FROM linen_items li
      LEFT JOIN linen_batches lb ON lb.id = li.batch_id
      LEFT JOIN units u ON u.id = li.assigned_unit
      WHERE 1=1
        ${propertyId ? sql`AND li.property_id = ${propertyId}` : sql``}
        ${status ? sql`AND li.status = ${status}` : sql``}
      ORDER BY li.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[housekeeping/linen/items GET]", error);
    return NextResponse.json({ error: "Failed to fetch linen items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO linen_items (property_id, batch_id, rfid_tag, item_type, status, assigned_unit)
      VALUES (
        ${body.property_id}, ${body.batch_id}, ${body.rfid_tag || null},
        ${body.item_type}, ${body.status || "in_stock"}, ${body.assigned_unit || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[housekeeping/linen/items POST]", error);
    return NextResponse.json({ error: "Failed to create linen item" }, { status: 500 });
  }
}
