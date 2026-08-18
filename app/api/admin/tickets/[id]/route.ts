import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { sendTicketStatusEmail } from "@/lib/email";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can view tickets" }, { status: 403 });
    }

    const { id } = await params;
    const db = getPublicDb();

    const tickets = await db`
      SELECT t.*,
        (SELECT u.email FROM public.platform_admins u WHERE u.id = t.assigned_to) AS assigned_email,
        (SELECT row_to_json(m) FROM (
          SELECT id, sender_type, sender_id, sender_name, sender_email, message, is_internal, created_at
          FROM public.ticket_messages
          WHERE ticket_id = t.id
          ORDER BY created_at ASC
        ) m) AS messages_json
      FROM public.support_tickets t
      WHERE t.id = ${id}
      LIMIT 1
    `;

    const ticket = (tickets as Record<string, unknown>[])[0];
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const messages = await db`
      SELECT id, sender_type, sender_id, sender_name, sender_email, message, is_internal, created_at
      FROM public.ticket_messages
      WHERE ticket_id = ${id}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ ticket: { ...ticket, messages } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can update tickets" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, priority, assigned_to, category, contact_name, contact_email } = body;

    const db = getPublicDb();

    const existing = await db`
      SELECT id, status, tenant_code, subject, contact_email, assigned_to FROM public.support_tickets WHERE id = ${id} LIMIT 1
    `;
    const existingRow = (existing as Record<string, unknown>[])[0];
    if (!existingRow) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const oldStatus = existingRow.status as string;

    const updates: string[] = [];
    const paramsList: unknown[] = [];
    let paramIndex = 0;

    if (status !== undefined) {
      if (!["open", "in_progress", "awaiting_tenant", "resolved", "closed"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      paramIndex++; updates.push(`status = $${paramIndex}`); paramsList.push(status);
    }
    if (priority !== undefined) {
      if (!["low", "medium", "high", "critical"].includes(priority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
      }
      paramIndex++; updates.push(`priority = $${paramIndex}`); paramsList.push(priority);
    }
    if (assigned_to !== undefined) {
      paramIndex++; updates.push(`assigned_to = $${paramIndex}`); paramsList.push(assigned_to || null);
    }
    if (category !== undefined) {
      paramIndex++; updates.push(`category = $${paramIndex}`); paramsList.push(category);
    }
    if (contact_name !== undefined) {
      paramIndex++; updates.push(`contact_name = $${paramIndex}`); paramsList.push(contact_name);
    }
    if (contact_email !== undefined) {
      paramIndex++; updates.push(`contact_email = $${paramIndex}`); paramsList.push(contact_email);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    paramIndex++; paramsList.push(id);
    const result = await db.unsafe(
      `UPDATE public.support_tickets SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      paramsList
    );

    const ticket = (result as Record<string, unknown>[])[0];

    if (ticket && status !== undefined && status !== oldStatus) {
      const notifyEmails: string[] = [];
      if (ticket.contact_email) notifyEmails.push(ticket.contact_email as string);
      if (existingRow.assigned_to) {
        const assigned = await db`
          SELECT email FROM public.platform_admins WHERE id = ${existingRow.assigned_to as string} LIMIT 1
        `;
        const assignedEmail = (assigned as Record<string, unknown>[])[0]?.email as string | undefined;
        if (assignedEmail) notifyEmails.push(assignedEmail);
      }
      const adminName = `${(payload as any).first_name || ""} ${(payload as any).last_name || ""}`.trim() || "Platform Admin";
      for (const email of [...new Set(notifyEmails)]) {
        sendTicketStatusEmail(email, ticket as any, oldStatus, adminName);
      }
    }

    return NextResponse.json({ ticket });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
