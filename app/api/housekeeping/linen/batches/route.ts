import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT
        lb.*,
        json_build_object('id', p.id, 'name', p.name) AS property,
        CASE WHEN lb.vendor_id IS NOT NULL THEN json_build_object('id', v.id, 'company_name', v.company_name) ELSE NULL END AS vendor
      FROM linen_batches lb
      LEFT JOIN properties p ON p.id = lb.property_id
      LEFT JOIN vendors v ON v.id = lb.vendor_id
      WHERE 1=1
        ${propertyId ? sql`AND lb.property_id = ${propertyId}` : sql``}
      ORDER BY lb.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[housekeeping/linen/batches GET]", error);
    return NextResponse.json({ error: "Failed to fetch linen batches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const countRows = await sql`SELECT COALESCE(MAX(CAST(SUBSTRING(batch_id, 5) AS INTEGER)), 0) + 1 AS next_code FROM linen_batches`;
    const nextCode = (countRows[0] as { next_code: number }).next_code;
    const batchCode = `LBN-${String(nextCode).padStart(4, "0")}`;

    const rows = await sql`
      INSERT INTO linen_batches (batch_id, property_id, item_type, quantity, lifecycle_stage, vendor_id)
      VALUES (
        ${batchCode}, ${body.property_id}, ${body.item_type},
        ${body.quantity}, ${body.lifecycle_stage || "in_use"}, ${body.vendor_id || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[housekeeping/linen/batches POST]", error);
    return NextResponse.json({ error: "Failed to create linen batch" }, { status: 500 });
  }
}
