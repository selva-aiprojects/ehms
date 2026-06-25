import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;

    const rows = await sql`
      SELECT
        ri.*,
        la.agreement_ref, la.rent_amount as lease_rent, la.security_deposit,
        json_build_object('id', g.id, 'first_name', g.first_name, 'last_name', g.last_name, 'email', g.email, 'phone', g.phone) AS tenant,
        json_build_object('id', p.id, 'name', p.name) AS property,
        json_build_object('id', u.id, 'unit_label', u.unit_label) AS unit
      FROM rent_invoices ri
      LEFT JOIN lease_agreements la ON la.id = ri.lease_id
      LEFT JOIN guest_profiles g ON g.id = la.tenant_id
      LEFT JOIN properties p ON p.id = la.property_id
      LEFT JOIN units u ON u.id = la.unit_id
      WHERE ri.id = ${id}
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Rent invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error("[rent-invoices/id GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch rent invoice" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();
    const { status, paid_amount, paid_at } = body;

    const existing = await sql`SELECT id FROM rent_invoices WHERE id = ${id}`;
    if (!existing.length) {
      return NextResponse.json({ error: "Rent invoice not found" }, { status: 404 });
    }

    if (status) await sql`UPDATE rent_invoices SET status = ${status} WHERE id = ${id}`;
    if (paid_amount !== undefined) await sql`UPDATE rent_invoices SET paid_amount = ${paid_amount} WHERE id = ${id}`;
    if (paid_at !== undefined) await sql`UPDATE rent_invoices SET paid_at = ${paid_at} WHERE id = ${id}`;

    if (status === "paid" && !paid_at) {
      await sql`UPDATE rent_invoices SET paid_at = NOW() WHERE id = ${id}`;
    }

    const updated = await sql`SELECT * FROM rent_invoices WHERE id = ${id}`;
    return NextResponse.json({ data: updated[0] });
  } catch (error: any) {
    console.error("[rent-invoices/id PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update rent invoice" }, { status: 500 });
  }
}
