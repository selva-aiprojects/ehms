import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
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
    const db = getPublicDb();

    const tickets = await db`
      SELECT id, tenant_code, subject, description, status, priority, category, contact_name, contact_email, created_at, updated_at, resolved_at, closed_at
      FROM public.support_tickets
      WHERE id = ${id} AND tenant_code = ${payload.tenant_code}
      LIMIT 1
    `;

    const ticket = (tickets as Record<string, unknown>[])[0];
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const messages = await db`
      SELECT id, sender_type, sender_id, sender_name, sender_email, message, created_at
      FROM public.ticket_messages
      WHERE ticket_id = ${id} AND (is_internal = false OR sender_type = 'tenant')
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ ticket: { ...ticket, messages } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
