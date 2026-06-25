import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const leaseId = searchParams.get("lease_id");
    const status = searchParams.get("status");

    let query = sql`
      SELECT
        ri.*,
        la.agreement_ref, la.rent_amount as lease_rent,
        json_build_object('id', g.id, 'first_name', g.first_name, 'last_name', g.last_name) AS tenant,
        json_build_object('id', p.id, 'name', p.name) AS property
      FROM rent_invoices ri
      LEFT JOIN lease_agreements la ON la.id = ri.lease_id
      LEFT JOIN guest_profiles g ON g.id = la.tenant_id
      LEFT JOIN properties p ON p.id = la.property_id
      WHERE 1=1
    `;

    if (leaseId) query = sql`${query} AND ri.lease_id = ${leaseId}`;
    if (status) query = sql`${query} AND ri.status = ${status}`;

    query = sql`${query} ORDER BY ri.period_start DESC`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[rent-invoices GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch rent invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { lease_id, period_start, period_end, rent_amount, maintenance_charges, late_fee, due_date } = body;

    if (!lease_id || !period_start || !period_end || !rent_amount || !due_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lease = await sql`SELECT agreement_ref FROM lease_agreements WHERE id = ${lease_id}`;
    if (!lease.length) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const invoiceNumber = `RENT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

    const result = await sql`
      INSERT INTO rent_invoices (lease_id, invoice_number, period_start, period_end, rent_amount, maintenance_charges, late_fee, due_date, status)
      VALUES (${lease_id}, ${invoiceNumber}, ${period_start}, ${period_end}, ${rent_amount}, ${maintenance_charges || 0}, ${late_fee || 0}, ${due_date}, 'sent')
      RETURNING *
    `;

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[rent-invoices POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create rent invoice" }, { status: 500 });
  }
}
