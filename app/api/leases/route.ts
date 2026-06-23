import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const renewalDue = searchParams.get("renewal_due");
    const propertyId = searchParams.get("property_id");

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
        ${propertyId ? sql`AND la.property_id = ${propertyId}` : sql``}
      ORDER BY la.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[leases GET]", error);
    return NextResponse.json({ error: "Failed to fetch leases" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const {
      property_id,
      unit_id,
      tenant_id,
      start_date,
      end_date,
      rent_amount,
      security_deposit,
      notice_period_days,
      status
    } = body;

    // Validate required fields
    if (!property_id || !unit_id || !tenant_id || !start_date || !end_date || !rent_amount) {
      return NextResponse.json(
        { error: "Missing required fields (property_id, unit_id, tenant_id, start_date, end_date, rent_amount)" },
        { status: 400 }
      );
    }

    // Verify dates
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { error: "Invalid lease dates. Start date must be before end date." },
        { status: 400 }
      );
    }

    // Check if unit exists and is vacant
    const unitRows = (await sql`
      SELECT id, status 
      FROM units 
      WHERE id = ${unit_id} 
      LIMIT 1
    `) as any[];
    if (unitRows.length === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }
    const unit = unitRows[0];
    if (unit.status !== "vacant") {
      return NextResponse.json({ error: `Unit is currently in status: ${unit.status}` }, { status: 400 });
    }

    // Generate unique agreement reference
    const ref = body.agreement_ref || `LS-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    // Insert lease agreement
    const leaseRows = (await sql`
      INSERT INTO lease_agreements (
        property_id,
        unit_id,
        tenant_id,
        agreement_ref,
        status,
        start_date,
        end_date,
        rent_amount,
        security_deposit,
        notice_period_days,
        signed_by_tenant,
        signed_by_owner
      ) VALUES (
        ${property_id},
        ${unit_id},
        ${tenant_id},
        ${ref},
        ${status || "active"},
        ${start_date},
        ${end_date},
        ${rent_amount},
        ${security_deposit || null},
        ${notice_period_days || 30},
        true,
        true
      )
      RETURNING *
    `) as any[];

    // Update unit status to occupied
    await sql`
      UPDATE units 
      SET status = 'occupied' 
      WHERE id = ${unit_id}
    `;

    return NextResponse.json({ data: leaseRows[0] }, { status: 201 });
  } catch (error: unknown) {
    console.error("[leases POST]", error);
    const msg = error instanceof Error ? error.message : "Failed to create lease";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
