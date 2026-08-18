import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();

    const rows = await sql`
      SELECT 
        v.id, v.company_name as name, v.status, v.property_id, v.contact_person, v.email, v.phone,
        v.gst_number, v.is_compliant, v.created_at, v.updated_at,
        COALESCE(
          json_agg(json_build_object('id', vs.id, 'service_type', vs.service_type, 'rate', vs.rate, 'rate_unit', vs.rate_unit)) FILTER (WHERE vs.id IS NOT NULL),
          '[]'
        ) AS services
      FROM vendors v
      LEFT JOIN vendor_services vs ON vs.vendor_id = v.id
      WHERE v.id = ${id}
      GROUP BY v.id
    ` as any[];

    if (rows.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const r = rows[0];
    const data = {
      id: r.id,
      name: r.name,
      status: r.status,
      property_id: r.property_id,
      contact_person: r.contact_person,
      email: r.email,
      phone: r.phone,
      gst_number: r.gst_number,
      is_compliant: r.is_compliant,
      services: r.services,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("[vendors/:id GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch vendor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const sql = getDb();

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.company_name !== undefined) { updates.push(`company_name = $${idx++}`); values.push(body.company_name.trim()); }
    if (body.contact_person !== undefined) { updates.push(`contact_person = $${idx++}`); values.push(body.contact_person?.trim() || null); }
    if (body.email !== undefined) { updates.push(`email = $${idx++}`); values.push(body.email || null); }
    if (body.phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(body.phone || null); }
    if (body.gst_number !== undefined) { updates.push(`gst_number = $${idx++}`); values.push(body.gst_number || null); }
    if (body.property_id !== undefined) { updates.push(`property_id = $${idx++}`); values.push(body.property_id || null); }
    if (body.status !== undefined) { updates.push(`status = $${idx++}`); values.push(body.status); }
    if (body.is_compliant !== undefined) { updates.push(`is_compliant = $${idx++}`); values.push(body.is_compliant); }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    const result = await (sql as any)(
      `UPDATE vendors SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    console.error("[vendors/:id PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update vendor" }, { status: 500 });
  }
}
