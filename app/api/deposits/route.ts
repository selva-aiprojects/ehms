import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const leaseId = searchParams.get("lease_id");

    let query = sql`
      SELECT
        dl.*,
        la.agreement_ref,
        json_build_object('id', g.id, 'first_name', g.first_name, 'last_name', g.last_name) AS tenant
      FROM deposit_ledger dl
      LEFT JOIN lease_agreements la ON la.id = dl.lease_id
      LEFT JOIN guest_profiles g ON g.id = la.tenant_id
      WHERE 1=1
    `;

    if (leaseId) query = sql`${query} AND dl.lease_id = ${leaseId}`;

    query = sql`${query} ORDER BY dl.transaction_date DESC`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[deposits GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch deposits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { lease_id, transaction_type, amount, description } = body;

    if (!lease_id || !transaction_type || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validTypes = ["deposit_received", "deduction", "refund", "interest"];
    if (!validTypes.includes(transaction_type)) {
      return NextResponse.json({ error: `Invalid type. Must be: ${validTypes.join(", ")}` }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO deposit_ledger (lease_id, transaction_type, amount, description)
      VALUES (${lease_id}, ${transaction_type}, ${amount}, ${description || null})
      RETURNING *
    `;

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[deposits POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create deposit transaction" }, { status: 500 });
  }
}
