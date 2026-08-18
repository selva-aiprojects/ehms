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
      try {
        await sql`
          INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment)
          VALUES (${id}, 'assigned', ${body.assigned_to || null}, 'Ticket assigned')
        `;
      } catch { /* safe if approvals table optional */ }
    }

    const rows = await sql`
      UPDATE maintenance_tickets
      SET
        status = ${newStatus},
        ${body.assigned_to !== undefined ? sql`assigned_to = ${body.assigned_to},` : sql``}
        ${body.priority !== undefined ? sql`priority = ${body.priority},` : sql``}
        ${body.category !== undefined ? sql`category = ${body.category},` : sql``}
        ${body.notes !== undefined || body.resolution_notes !== undefined ? sql`resolution_notes = ${body.notes || body.resolution_notes},` : sql``}
        ${resolvedAt ? sql`resolved_at = NOW(),` : sql``}
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!rows[0]) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    // ── G6 FIX: On RESOLVE or CLOSE — reset unit status safely and auto-queue HK task ──
    if ((newStatus === "resolved" || newStatus === "closed") && oldTicket.unit_id) {
      try {
        // Only transition unit status if no other active maintenance tickets exist for this room
        const activeTickets = await sql`
          SELECT id FROM maintenance_tickets 
          WHERE unit_id = ${oldTicket.unit_id} 
            AND id != ${id} 
            AND status IN ('open', 'in_progress', 'assigned') 
          LIMIT 1
        `;

        if (!activeTickets[0]) {
          // Check if there is an active checked-in booking
          const activeBooking = await sql`
            SELECT id FROM bookings 
            WHERE unit_id = ${oldTicket.unit_id} AND status = 'checked_in' 
            LIMIT 1
          `;

          if (activeBooking[0]) {
            await sql`UPDATE units SET status = 'occupied' WHERE id = ${oldTicket.unit_id}`;
          } else {
            // Mark dirty so housekeeping verifies before room goes vacant
            await sql`UPDATE units SET status = 'dirty' WHERE id = ${oldTicket.unit_id}`;
            
            // Auto-create a housekeeping post-maintenance task with 2-hour SLA
            if (oldTicket.property_id) {
              await sql`
                INSERT INTO housekeeping_tasks (unit_id, property_id, task_type, priority, status, scheduled_at, notes)
                VALUES (
                  ${oldTicket.unit_id},
                  ${oldTicket.property_id},
                  'post_maintenance_clean',
                  'medium',
                  'open',
                  now() + interval '2 hours',
                  ${"Auto-generated after maintenance ticket #" + id + " resolved"}
                )
              `;
            }
          }
        }
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
