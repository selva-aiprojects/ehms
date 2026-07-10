import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    const oldRows = await sql`
      SELECT mt.status, mt.unit_id, mt.property_id
      FROM maintenance_tickets mt
      WHERE mt.id = ${id}
    `;
    const oldTicket = oldRows[0] as { status: string; unit_id: string | null; property_id: string | null } | undefined;
    if (!oldTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const newStatus = body.status || oldTicket.status;
    const resolvedAt = newStatus === "resolved" ? sql`NOW()` : undefined;

    // Log assignment event
    if (newStatus === "assigned" && oldTicket.status !== "assigned") {
      await sql`
        INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment)
        VALUES (${id}, 'assigned', ${body.assigned_to || null}, 'Ticket assigned')
      `;
    }

    const rows = await sql`
      UPDATE maintenance_tickets
      SET
        status = ${newStatus},
        ${body.assigned_to !== undefined ? sql`assigned_to = ${body.assigned_to},` : sql``}
        ${body.priority !== undefined ? sql`priority = ${body.priority},` : sql``}
        ${body.category !== undefined ? sql`category = ${body.category},` : sql``}
        ${body.notes !== undefined ? sql`notes = ${body.notes},` : sql``}
        ${resolvedAt ? sql`resolved_at = NOW(),` : sql``}
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!rows[0]) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    // ── G6 FIX: On RESOLVE — reset unit status and auto-queue a HK task ──────
    if (newStatus === "resolved" && oldTicket.unit_id) {
      try {
        // After maintenance completes, room needs cleaning before it's sellable
        await sql`UPDATE units SET status = 'dirty' WHERE id = ${oldTicket.unit_id}`;

        // Auto-create a housekeeping task to clean the post-maintenance room
        await sql`
          INSERT INTO housekeeping_tasks (unit_id, property_id, task_type, priority, status, scheduled_at, notes)
          VALUES (
            ${oldTicket.unit_id},
            ${oldTicket.property_id},
            'post_maintenance_clean',
            'medium',
            'open',
            NOW(),
            ${"Auto-generated after maintenance ticket #" + id + " resolved"}
          )
          ON CONFLICT DO NOTHING
        `;
      } catch (syncErr) {
        console.error("[ticket PUT] unit status sync on resolve failed:", syncErr);
      }
    }

    // On IN_PROGRESS — mark unit as maintenance (in case it wasn't already set)
    if (newStatus === "in_progress" && oldTicket.unit_id) {
      try {
        await sql`UPDATE units SET status = 'maintenance' WHERE id = ${oldTicket.unit_id}`;
      } catch { /* non-fatal */ }
    }
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error("[ticket PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update ticket" }, { status: 500 });
  }
}
