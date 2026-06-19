import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const renewalDue = searchParams.get("renewal_due");

    const rows = await sql`
      SELECT
        la.*,
        json_build_object('id', u.id, 'unit_label', u.unit_label) AS unit,
        json_build_object('id', p.id, 'name', p.name) AS property,
        json_build_object('id', g.id, 'first_name', g.first_name, 'last_name', g.last_name, 'email', g.email, 'phone', g.phone) AS tenant
      FROM lease_agreements la
      LEFT JOIN units u ON u.id = la.unit_id
      LEFT JOIN properties p ON p.id = la.property_id
      LEFT JOIN guest_profiles g ON g.id = la.tenant_id
      WHERE 1=1
        ${status ? sql`AND la.status = ${status}` : sql``}
        ${renewalDue ? sql`AND la.status IN ('active', 'renewal_due')` : sql``}
      ORDER BY la.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[leases GET]", error);
    return NextResponse.json({ error: "Failed to fetch leases" }, { status: 500 });
  }
}
