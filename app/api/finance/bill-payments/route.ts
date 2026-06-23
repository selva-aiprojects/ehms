export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const billId = searchParams.get("bill_id");

    let query = sql`
      SELECT bp.*, vb.bill_number, v.name as vendor_name
      FROM bill_payments bp
      LEFT JOIN vendor_bills vb ON vb.id = bp.bill_id
      LEFT JOIN vendors v ON v.id = vb.vendor_id
      WHERE 1=1`;
    if (propertyId) query = sql`${query} AND bp.property_id = ${propertyId}`;
    if (billId) query = sql`${query} AND bp.bill_id = ${billId}`;
    query = sql`${query} ORDER BY bp.payment_date DESC LIMIT 100`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[finance/bill-payments GET]", error);
    return NextResponse.json({ error: "Failed to fetch bill payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const payments = await sql`
      INSERT INTO bill_payments (property_id, bill_id, payment_method, reference_number, amount, payment_date, status, notes, created_by)
      VALUES (${body.property_id}, ${body.bill_id}, ${body.payment_method}, ${body.reference_number || null}, ${body.amount}, ${body.payment_date || new Date().toISOString()}, ${body.status || 'completed'}, ${body.notes || null}, ${body.created_by})
      RETURNING *`;

    await sql`UPDATE vendor_bills SET paid_total = paid_total + ${body.amount}, status = CASE WHEN paid_total + ${body.amount} >= grand_total THEN 'paid' ELSE status END, updated_at = now() WHERE id = ${body.bill_id}`;

    return NextResponse.json({ data: payments[0] }, { status: 201 });
  } catch (error) {
    console.error("[finance/bill-payments POST]", error);
    return NextResponse.json({ error: "Failed to process bill payment" }, { status: 500 });
  }
}
