import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");

    let query = sql`
      SELECT * FROM attendance_policies
      WHERE is_active = true
    `;
    if (propertyId) query = sql`${query} AND property_id = ${propertyId}`;
    else if (scope.assignedPropertyIds.length > 0) query = sql`${query} AND property_id = ANY(${scope.assignedPropertyIds})`;
    query = sql`${query} ORDER BY created_at DESC`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/attendance-policies GET]", error);
    return NextResponse.json({ error: "Failed to fetch attendance policies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO attendance_policies (name, late_threshold, half_day_threshold, early_exit_threshold, grace_period, requires_geo, requires_face_auth, property_id)
      VALUES (${body.name}, ${body.late_threshold}, ${body.half_day_threshold}, ${body.early_exit_threshold}, ${body.grace_period}, ${body.requires_geo}, ${body.requires_face_auth}, ${body.property_id})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/attendance-policies POST]", error);
    return NextResponse.json({ error: "Failed to create attendance policy" }, { status: 500 });
  }
}
