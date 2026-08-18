import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get("unit_id");
    const status = searchParams.get("status");

    const rows = await sql`
      SELECT
        hi.*,
        json_build_object('id', ht.id, 'task_type', ht.task_type, 'status', ht.status) AS task,
        json_build_object('id', u.id, 'unit_label', u.unit_label, 'unit_type', u.unit_type) AS unit,
        json_build_object('id', usr.id, 'first_name', usr.first_name, 'last_name', usr.last_name) AS inspector
      FROM housekeeping_inspections hi
      LEFT JOIN housekeeping_tasks ht ON ht.id = hi.task_id
      LEFT JOIN units u ON u.id = hi.unit_id
      LEFT JOIN users usr ON usr.id = hi.inspector_id
      WHERE 1=1
        ${unitId ? sql`AND hi.unit_id = ${unitId}` : sql``}
        ${status ? sql`AND hi.status = ${status}` : sql``}
      ORDER BY hi.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[housekeeping/inspections GET]", error);
    return NextResponse.json({ error: "Failed to fetch inspections" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO housekeeping_inspections (task_id, unit_id, inspector_id, score, status, notes, checklist_items, inspected_at)
      VALUES (
        ${body.task_id}, ${body.unit_id}, ${body.inspector_id || null},
        ${body.score || null}, ${body.status || "pending"}, ${body.notes || null},
        ${body.checklist_items ? sql`${JSON.stringify(body.checklist_items)}` : sql`'[]'`},
        ${body.inspected_at || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[housekeeping/inspections POST]", error);
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 });
  }
}
