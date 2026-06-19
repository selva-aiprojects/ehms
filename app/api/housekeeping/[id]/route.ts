import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    if (body.status === "resolved") {
      const taskRows = await sql`SELECT unit_id FROM housekeeping_tasks WHERE id = ${id}`;
      const unitId = taskRows[0] ? (taskRows[0] as Record<string, unknown>).unit_id as string : null;
      if (unitId) {
        await sql`UPDATE units SET status = 'inspection' WHERE id = ${unitId}`;
      }
      const rows = await sql`
        UPDATE housekeeping_tasks
        SET status = 'resolved', completed_at = NOW()
            ${body.notes ? sql`, notes = ${body.notes}` : sql``}
            ${body.assigned_to ? sql`, assigned_to = ${body.assigned_to}` : sql``}
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ data: rows[0] });
    }

    if (body.status === "in_progress") {
      const rows = await sql`
        UPDATE housekeeping_tasks
        SET status = 'in_progress', started_at = NOW()
            ${body.notes ? sql`, notes = ${body.notes}` : sql``}
            ${body.assigned_to ? sql`, assigned_to = ${body.assigned_to}` : sql``}
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json({ data: rows[0] });
    }

    const rows = await sql`
      UPDATE housekeeping_tasks
      SET status = ${body.status}
          ${body.notes ? sql`, notes = ${body.notes}` : sql``}
          ${body.assigned_to ? sql`, assigned_to = ${body.assigned_to}` : sql``}
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json({ data: rows[0] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
