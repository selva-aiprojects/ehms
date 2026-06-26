import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { sendTicketReplyEmail } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can reply to tickets" }, { status: 403 });
    }

    const { id } = await params;
    const { message, is_internal } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const db = getPublicDb();

    const ticket = await db`
      SELECT id, status, tenant_code, subject, contact_email FROM public.support_tickets WHERE id = ${id} LIMIT 1
    `;
    const ticketRow = (ticket as Record<string, unknown>[])[0];
    if (!ticketRow) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const result = await db`
      INSERT INTO public.ticket_messages (ticket_id, sender_type, sender_id, sender_name, sender_email, message, is_internal)
      VALUES (${id}, 'admin', ${payload.user_id}, ${payload.email || 'Platform Admin'}, ${payload.email || ''}, ${message}, ${is_internal === true})
      RETURNING *
    `;

    const msg = (result as Record<string, unknown>[])[0];

    // If ticket is awaiting_tenant, set back to in_progress when admin replies
    if (ticketRow.status === 'awaiting_tenant') {
      await db`
        UPDATE public.support_tickets SET status = 'in_progress' WHERE id = ${id}
      `;
    }

    if (!is_internal && ticketRow.contact_email) {
      const adminName = `${(payload as any).first_name || ""} ${(payload as any).last_name || ""}`.trim() || "Platform Admin";
      sendTicketReplyEmail(ticketRow.contact_email as string, ticketRow as any, message, adminName);
    }

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
