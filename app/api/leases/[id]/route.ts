import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;

    const rows = await sql`
      SELECT
        la.*,
        json_build_object('id', u.id, 'unit_label', u.unit_label, 'status', u.status) AS unit,
        json_build_object('id', p.id, 'name', p.name) AS property,
        json_build_object('id', g.id, 'first_name', g.first_name, 'last_name', g.last_name, 'email', g.email, 'phone', g.phone) AS tenant
      FROM lease_agreements la
      LEFT JOIN units u ON u.id = la.unit_id
      LEFT JOIN properties p ON p.id = la.property_id
      LEFT JOIN guest_profiles g ON g.id = la.tenant_id
      WHERE la.id = ${id}
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const amendments = await sql`
      SELECT * FROM lease_amendments WHERE lease_id = ${id} ORDER BY created_at DESC
    `;

    return NextResponse.json({ data: { ...rows[0], amendments } });
  } catch (error: any) {
    console.error("[leases/id GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch lease" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();
    const { status, rent_amount, end_date, notice_period_days, security_deposit, amendment } = body;

    const existing = await sql`SELECT * FROM lease_agreements WHERE id = ${id}`;
    if (!existing.length) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const current = existing[0] as any;

    if (status !== undefined) await sql`UPDATE lease_agreements SET status = ${status} WHERE id = ${id}`;
    if (rent_amount !== undefined) await sql`UPDATE lease_agreements SET rent_amount = ${rent_amount} WHERE id = ${id}`;
    if (end_date !== undefined) await sql`UPDATE lease_agreements SET end_date = ${end_date} WHERE id = ${id}`;
    if (notice_period_days !== undefined) await sql`UPDATE lease_agreements SET notice_period_days = ${notice_period_days} WHERE id = ${id}`;
    if (security_deposit !== undefined) await sql`UPDATE lease_agreements SET security_deposit = ${security_deposit} WHERE id = ${id}`;

    if (amendment) {
      await sql`
        INSERT INTO lease_amendments (lease_id, amendment_type, prev_value, new_value, effective_date)
        VALUES (${id}, ${amendment.type}, ${JSON.stringify(amendment.prev_value)}, ${JSON.stringify(amendment.new_value)}, ${amendment.effective_date || new Date().toISOString().split("T")[0]})
      `;
    }

    if (status === "terminated") {
      await sql`UPDATE units SET status = 'vacant' WHERE id = ${current.unit_id}`;
    }

    const updated = await sql`SELECT * FROM lease_agreements WHERE id = ${id}`;
    return NextResponse.json({ data: updated[0] });
  } catch (error: any) {
    console.error("[leases/id PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update lease" }, { status: 500 });
  }
}
