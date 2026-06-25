import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");

    const rows = await sql`
      SELECT br.*, 
        json_build_object('id', p.id, 'amount', p.amount, 'payment_date', p.payment_date, 'payment_mode', p.payment_mode) AS payment
      FROM bank_reconciliation br
      LEFT JOIN payments p ON p.id = br.matched_payment_id
      WHERE 1=1
        ${propertyId ? sql`AND br.property_id = ${propertyId}` : sql``}
        ${status ? sql`AND br.status = ${status}` : sql``}
      ORDER BY br.transaction_date DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[reconciliation GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch reconciliation records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { property_id, bank_ref, transaction_date, amount, description } = body;

    if (!property_id || !bank_ref || !transaction_date || amount === undefined) {
      return NextResponse.json({ error: "Property, bank ref, transaction date, and amount are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO bank_reconciliation (property_id, bank_ref, transaction_date, amount, description)
      VALUES (${property_id}, ${bank_ref}, ${transaction_date}, ${amount}, ${description || null})
      RETURNING *
    ` as any[];

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[reconciliation POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create reconciliation entry" }, { status: 500 });
  }
}
