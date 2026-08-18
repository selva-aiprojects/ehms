import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    if (body.status === "resolved") {
      const taskRows = await sql`SELECT unit_id, property_id, task_type FROM housekeeping_tasks WHERE id = ${id}`;
      const taskRow = taskRows[0] as Record<string, unknown>;
      if (taskRow?.unit_id) {
        if (taskRow.task_type === 'inspection') {
          // Once inspection is resolved, check if room has active maintenance or checked-in guest
          const maintCheck = await sql`SELECT id FROM maintenance_tickets WHERE unit_id = ${taskRow.unit_id as string} AND status IN ('open', 'in_progress', 'assigned') LIMIT 1`;
          if (maintCheck[0]) {
            await sql`UPDATE units SET status = 'maintenance' WHERE id = ${taskRow.unit_id as string}`;
          } else {
            const bookingCheck = await sql`SELECT id FROM bookings WHERE unit_id = ${taskRow.unit_id as string} AND status = 'checked_in' LIMIT 1`;
            const nextStatus = bookingCheck[0] ? 'occupied' : 'vacant';
            await sql`UPDATE units SET status = ${nextStatus} WHERE id = ${taskRow.unit_id as string}`;
          }
        } else {
          // For cleaning tasks (checkout_clean, deep_clean, routine_clean), transition unit to 'inspection'
          await sql`UPDATE units SET status = 'inspection' WHERE id = ${taskRow.unit_id as string}`;
          // Auto-queue inspection task if property_id available
          if (taskRow.property_id) {
            await sql`
              INSERT INTO housekeeping_tasks (unit_id, property_id, task_type, priority, status, scheduled_at, notes)
              VALUES (
                ${taskRow.unit_id as string},
                ${taskRow.property_id as string},
                'inspection',
                'medium',
                'open',
                now() + interval '1 hour',
                ${"Auto-queued supervisor inspection after task #" + id}
              )
            `;
          }
        }
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
      const taskRows = await sql`SELECT unit_id FROM housekeeping_tasks WHERE id = ${id}`;
      const taskRow = taskRows[0] as Record<string, unknown>;
      if (taskRow?.unit_id) {
        await sql`UPDATE units SET status = 'cleaning' WHERE id = ${taskRow.unit_id as string} AND status IN ('dirty', 'inspection', 'vacant')`;
      }
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
