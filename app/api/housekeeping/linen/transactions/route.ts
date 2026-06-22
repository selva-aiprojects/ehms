import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const batchId = searchParams.get("batch_id");

    const rows = await sql`
      SELECT
        lt.*,
        json_build_object('id', lb.id, 'batch_id', lb.batch_id, 'item_type', lb.item_type) AS batch,
        CASE WHEN lt.unit_id IS NOT NULL THEN json_build_object('id', u.id, 'unit_label', u.unit_label, 'unit_type', u.unit_type) ELSE NULL END AS unit,
        CASE WHEN lt.logged_by IS NOT NULL THEN json_build_object('id', usr.id, 'first_name', usr.first_name, 'last_name', usr.last_name) ELSE NULL END AS logged_by_user
      FROM linen_transactions lt
      LEFT JOIN linen_batches lb ON lb.id = lt.batch_id
      LEFT JOIN units u ON u.id = lt.unit_id
      LEFT JOIN users usr ON usr.id = lt.logged_by
      WHERE 1=1
        ${propertyId ? sql`AND lb.property_id = ${propertyId}` : sql``}
        ${batchId ? sql`AND lt.batch_id = ${batchId}` : sql``}
      ORDER BY lt.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[housekeeping/linen/transactions GET]", error);
    return NextResponse.json({ error: "Failed to fetch linen transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO linen_transactions (batch_id, from_stage, to_stage, quantity, unit_id, logged_by, notes)
      VALUES (
        ${body.batch_id}, ${body.from_stage}, ${body.to_stage},
        ${body.quantity}, ${body.unit_id || null}, ${body.logged_by || null}, ${body.notes || null}
      )
      RETURNING *
    `;

    await sql`UPDATE linen_batches SET lifecycle_stage = ${body.to_stage}, last_updated = now() WHERE id = ${body.batch_id}`;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[housekeeping/linen/transactions POST]", error);
    return NextResponse.json({ error: "Failed to create linen transaction" }, { status: 500 });
  }
}
