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
    if (!payload?.tenant_code) {
      return NextResponse.json({ error: "Tenant authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const db = getPublicDb();

    const ticket = await db`
      SELECT id, status, tenant_code, subject, contact_email
      FROM public.support_tickets
      WHERE id = ${id} AND tenant_code = ${payload.tenant_code}
      LIMIT 1
    `;
    const ticketRow = (ticket as Record<string, unknown>[])[0];
    if (!ticketRow) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const contactName = `${payload.first_name || ""} ${payload.last_name || ""}`.trim() || "Tenant User";

    const result = await db`
      INSERT INTO public.ticket_messages (ticket_id, sender_type, sender_id, sender_name, sender_email, message, is_internal)
      VALUES (${id}, 'tenant', ${payload.user_id || payload.email}, ${contactName}, ${payload.email || ""}, ${message}, false)
      RETURNING *
    `;

    const msg = (result as Record<string, unknown>[])[0];

    // Set status to awaiting_tenant so admin knows tenant replied
    if (ticketRow.status !== "awaiting_tenant") {
      await db`
        UPDATE public.support_tickets SET status = 'awaiting_tenant' WHERE id = ${id}
      `;
    }

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
