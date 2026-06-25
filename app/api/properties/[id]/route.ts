import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();

    const rows = await sql`
      SELECT
        p.*, r.name AS region_name, r.city, r.state, r.country,
        COALESCE(
          json_agg(json_build_object('id', u.id, 'status', u.status, 'unit_label', u.unit_label, 'unit_type', u.unit_type)) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS units,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object('id', b.id, 'name', b.name, 'code', b.code, 'floors', b.floors)) FILTER (WHERE b.id IS NOT NULL),
          '[]'
        ) AS buildings
      FROM properties p
      JOIN regions r ON r.id = p.region_id
      LEFT JOIN buildings b ON b.property_id = p.id
      LEFT JOIN units u ON u.floor_id IN (SELECT f.id FROM floors f WHERE f.building_id = b.id)
      WHERE p.id = ${id}
      GROUP BY p.id, r.name, r.city, r.state, r.country
      LIMIT 1
    `;

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error("[properties/:id GET]", error);
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requesterRole = req.headers.get("x-user-role");
    if (!["super_admin", "executive", "property_manager"].includes(requesterRole || "")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const sql = getDb();
    const body = await req.json();

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fields = ["name", "code", "vertical_type", "booking_model", "address", "phone", "email", "check_in_time", "check_out_time", "star_rating", "is_active", "latitude", "longitude", "region_id"];
    for (const f of fields) {
      if (body[f] !== undefined) {
        updates.push(`${f} = $${idx++}`);
        values.push(body[f]);
      }
    }

    if (body.config !== undefined) {
      updates.push(`config = config || $${idx++}::jsonb`);
      values.push(JSON.stringify(body.config));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    const result = await (sql as any)(
      `UPDATE properties SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    console.error("[properties/:id PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update property" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requesterRole = req.headers.get("x-user-role");
    if (requesterRole !== "super_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const sql = getDb();

    const result = await sql`
      UPDATE properties SET is_active = false, updated_at = now() WHERE id = ${id} RETURNING id, name, code
    ` as any[];

    if (result.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0], message: "Property deactivated" });
  } catch (error: any) {
    console.error("[properties/:id DELETE]", error);
    return NextResponse.json({ error: error?.message || "Failed to deactivate property" }, { status: 500 });
  }
}
