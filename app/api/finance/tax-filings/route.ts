export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const taxType = searchParams.get("tax_type");
    const status = searchParams.get("status");

    let query = sql`
      SELECT tf.*, u.name as filed_by_name
      FROM tax_filings tf
      LEFT JOIN users u ON u.id = tf.filed_by
      WHERE 1=1`;
    if (propertyId) query = sql`${query} AND tf.property_id = ${propertyId}`;
    if (taxType) query = sql`${query} AND tf.tax_type = ${taxType}`;
    if (status) query = sql`${query} AND tf.status = ${status}`;
    query = sql`${query} ORDER BY tf.period_end DESC`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[finance/tax-filings GET]", error);
    return NextResponse.json({ error: "Failed to fetch tax filings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const rows = await sql`
      INSERT INTO tax_filings (property_id, tax_type, return_type, period_start, period_end, due_date, total_liability, status, filed_by, remarks)
      VALUES (${body.property_id}, ${body.tax_type}, ${body.return_type || null}, ${body.period_start}, ${body.period_end}, ${body.due_date}, ${body.total_liability || 0}, ${body.status || 'pending'}, ${body.filed_by || null}, ${body.remarks || null})
      RETURNING *`;
    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/tax-filings POST]", error);
    return NextResponse.json({ error: "Failed to create tax filing" }, { status: 500 });
  }
}
