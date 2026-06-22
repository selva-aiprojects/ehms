import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        rp.*,
        json_build_object('id', p.id, 'name', p.name) AS property
      FROM rate_plans rp
      LEFT JOIN properties p ON p.id = rp.property_id
      WHERE rp.is_active = true
      ORDER BY rp.name
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[masters/rate-plans GET]", error);
    return NextResponse.json({ error: "Failed to fetch rate plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO rate_plans (property_id, name, code, base_price, currency, is_refundable, cancellation_policy)
      VALUES (
        ${body.property_id}, ${body.name}, ${body.code ?? null},
        ${body.base_price ?? null}, ${body.currency ?? 'INR'},
        ${body.is_refundable ?? true}, ${body.cancellation_policy ?? null}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[masters/rate-plans POST]", error);
    return NextResponse.json({ error: "Failed to create rate plan" }, { status: 500 });
  }
}
