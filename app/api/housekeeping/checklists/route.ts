import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("task_id");

    const rows = await sql`
      SELECT
        hc.*,
        json_build_object('id', ht.id, 'task_type', ht.task_type, 'status', ht.status) AS task,
        CASE WHEN hc.checked_by IS NOT NULL THEN json_build_object('id', usr.id, 'first_name', usr.first_name, 'last_name', usr.last_name) ELSE NULL END AS checked_by_user
      FROM housekeeping_checklists hc
      LEFT JOIN housekeeping_tasks ht ON ht.id = hc.task_id
      LEFT JOIN users usr ON usr.id = hc.checked_by
      WHERE 1=1
        ${taskId ? sql`AND hc.task_id = ${taskId}` : sql``}
      ORDER BY hc.item ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[housekeeping/checklists GET]", error);
    return NextResponse.json({ error: "Failed to fetch checklists" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO housekeeping_checklists (task_id, item, is_checked, checked_by)
      VALUES (
        ${body.task_id}, ${body.item}, ${body.is_checked || false}, ${body.checked_by || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[housekeeping/checklists POST]", error);
    return NextResponse.json({ error: "Failed to create checklist item" }, { status: 500 });
  }
}
