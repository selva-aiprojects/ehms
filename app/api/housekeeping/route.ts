import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const status = searchParams.get("status");

    const rows = await sql`
      SELECT
        ht.*,
        json_build_object('id', u.id, 'unit_label', u.unit_label, 'unit_type', u.unit_type, 'status', u.status) AS unit,
        json_build_object('id', usr.id, 'first_name', usr.first_name, 'last_name', usr.last_name) AS assignee
      FROM housekeeping_tasks ht
      LEFT JOIN units u ON u.id = ht.unit_id
      LEFT JOIN users usr ON usr.id = ht.assigned_to
      WHERE 1=1
        ${propertyId ? sql`AND ht.property_id = ${propertyId}` : sql``}
        ${status ? sql`AND ht.status = ${status}` : sql``}
      ORDER BY ht.scheduled_at ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[housekeeping GET]", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes)
      VALUES (
        ${body.unit_id}, ${body.property_id}, ${body.assigned_to || null},
        ${body.task_type}, ${body.priority || "medium"}, 'open',
        ${body.scheduled_at || null}, ${body.notes || null}
      )
      RETURNING *
    `;

    if (body.unit_id) {
      await sql`UPDATE units SET status = 'cleaning' WHERE id = ${body.unit_id}`;
    }

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
