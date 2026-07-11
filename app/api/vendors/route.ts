import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = sql`
      SELECT 
        v.id, v.company_name as name, v.status, v.property_id, v.contact_person, v.email, v.phone,
        v.gst_number, v.is_compliant, v.created_at, v.updated_at,
        COALESCE(
          json_agg(json_build_object('id', vs.id, 'service_type', vs.service_type, 'rate', vs.rate, 'rate_unit', vs.rate_unit)) FILTER (WHERE vs.id IS NOT NULL),
          '[]'
        ) AS services
      FROM vendors v
      LEFT JOIN vendor_services vs ON vs.vendor_id = v.id
      WHERE 1=1
    `;

    if (propertyId) {
      query = sql`${query} AND v.property_id = ${propertyId}`;
    } else if (scope.assignedPropertyIds.length > 0) {
      query = sql`${query} AND v.property_id = ANY(${scope.assignedPropertyIds})`;
    }
    if (status) {
      query = sql`${query} AND v.status = ${status}`;
    }
    if (search) {
      query = sql`${query} AND (v.company_name ILIKE ${'%' + search + '%'} OR v.contact_person ILIKE ${'%' + search + '%'} OR v.email ILIKE ${'%' + search + '%'})`;
    }

    query = sql`${query} GROUP BY v.id ORDER BY v.company_name ASC`;

    const rows = await query;

    const data = (rows as any[]).map(r => ({
      id: r.id,
      name: r.name,
      category: r.services?.[0]?.service_type || "General",
      status: r.status,
      contact_person: r.contact_person,
      email: r.email,
      phone: r.phone,
      gst_number: r.gst_number,
      is_compliant: r.is_compliant,
      property_id: r.property_id,
      services: r.services,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("[vendors GET]", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    if (!body.company_name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO vendors (company_name, contact_person, email, phone, gst_number, property_id, status, is_compliant)
      VALUES (${body.company_name}, ${body.contact_person || null}, ${body.email || null}, ${body.phone || null}, ${body.gst_number || null}, ${body.property_id || null}, ${body.status || 'pending'}, ${body.is_compliant || false})
      RETURNING *
    ` as any[];

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[vendors POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to create vendor" }, { status: 500 });
  }
}
