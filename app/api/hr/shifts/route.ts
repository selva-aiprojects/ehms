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

    let query = sql`SELECT * FROM shift_rotations WHERE 1=1`;
    if (propertyId) query = sql`${query} AND property_id = ${propertyId}`;
    else if (scope.assignedPropertyIds.length > 0) query = sql`${query} AND property_id = ANY(${scope.assignedPropertyIds})`;
    query = sql`${query} ORDER BY name ASC`;

    const rows = await query;
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/shifts GET]", error);
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      INSERT INTO shift_rotations (name, start_time, end_time, property_id)
      VALUES (
        ${body.name}, ${body.start_time}::time, ${body.end_time}::time, ${body.property_id}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/shifts POST]", error);
    return NextResponse.json({ error: "Failed to create shift" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const rows = await sql`
      UPDATE shift_rotations SET
        name        = COALESCE(${body.name}, name),
        start_time  = COALESCE(${body.start_time}::time, start_time),
        end_time    = COALESCE(${body.end_time}::time, end_time),
        property_id = COALESCE(${body.property_id}, property_id)
      WHERE id = ${body.id}
      RETURNING *
    `;

    if (!rows[0]) return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[hr/shifts PUT]", error);
    return NextResponse.json({ error: "Failed to update shift" }, { status: 500 });
  }
}
