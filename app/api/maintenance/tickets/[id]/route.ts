import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    const oldTicket = (await sql`SELECT status FROM maintenance_tickets WHERE id = ${id}`)[0] as { status: string } | undefined;
    if (!oldTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const newStatus = body.status || oldTicket.status;
    const resolvedAt = newStatus === "resolved" ? sql`NOW()` : undefined;

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

    return NextResponse.json({ data: rows[0] });
  } catch (error: any) {
    console.error("[ticket PUT]", error);
    return NextResponse.json({ error: error?.message || "Failed to update ticket" }, { status: 500 });
  }
}
