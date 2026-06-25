export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const { property_id, visitor_name, visitor_phone, visitor_email, host_employee_id, purpose, id_proof_type, id_proof_number, vehicle_number } = body;

    if (!property_id || !visitor_name) {
      return NextResponse.json({ error: "Property and visitor name are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO visitor_logs (property_id, visitor_name, visitor_phone, visitor_email, host_employee_id, purpose, id_proof_type, id_proof_number, vehicle_number, check_in)
      VALUES (${property_id}, ${visitor_name}, ${visitor_phone || null}, ${visitor_email || null}, ${host_employee_id || null}, ${purpose || null}, ${id_proof_type || null}, ${id_proof_number || null}, ${vehicle_number || null}, NOW())
      RETURNING *
    ` as any[];

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.warn("[visitors POST] table may not exist:", error);
    return NextResponse.json({ error: "Failed to create visitor entry" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");
    const limit = Math.min(200, parseInt(searchParams.get("limit") || "50"));

    const rows = await sql`
      SELECT
        vl.*,
        json_build_object('id', he.id, 'first_name', he.first_name, 'last_name', he.last_name, 'email', he.email) AS host
      FROM visitor_logs vl
      LEFT JOIN users he ON he.id = vl.host_employee_id
      WHERE 1=1
        ${propertyId ? sql`AND vl.property_id = ${propertyId}` : sql``}
        ${status === "checked_in" ? sql`AND vl.check_out IS NULL` : sql``}
        ${status === "checked_out" ? sql`AND vl.check_out IS NOT NULL` : sql``}
      ORDER BY vl.check_in DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.warn("[visitors GET] table may not exist:", error);
    return NextResponse.json({ data: [] });
  }
}
