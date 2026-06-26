import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { sendTicketCreatedEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can manage tickets" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const tenant_code = searchParams.get("tenant_code");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const db = getPublicDb();

    let query = `
      SELECT t.*,
        (SELECT COUNT(*) FROM public.ticket_messages WHERE ticket_id = t.id) AS message_count,
        (SELECT u.email FROM public.platform_admins u WHERE u.id = t.assigned_to) AS assigned_email
      FROM public.support_tickets t
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }
    if (priority) { params.push(priority); query += ` AND t.priority = $${params.length}`; }
    if (tenant_code) { params.push(tenant_code); query += ` AND t.tenant_code = $${params.length}`; }
    if (category) { params.push(category); query += ` AND t.category = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (t.subject ILIKE $${params.length} OR t.description ILIKE $${params.length})`; }

    query += " ORDER BY t.updated_at DESC";

    const rows = await db.unsafe(query, params);
    return NextResponse.json({ tickets: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch tickets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can create tickets" }, { status: 403 });
    }

    const { tenant_code, subject, description, priority, category, contact_name, contact_email } = await req.json();

    if (!tenant_code || !subject) {
      return NextResponse.json({ error: "tenant_code and subject are required" }, { status: 400 });
    }

    const db = getPublicDb();

    const result = await db`
      INSERT INTO public.support_tickets (tenant_code, subject, description, priority, category, created_by, contact_name, contact_email)
      VALUES (${tenant_code}, ${subject}, ${description || ''}, ${priority || 'medium'}, ${category || 'general'}, ${payload.user_id}, ${contact_name || null}, ${contact_email || null})
      RETURNING *
    `;

    const ticket = (result as Record<string, unknown>[])[0];

    if (ticket && (ticket.contact_email as string)) {
      const adminName = `${payload.first_name || ""} ${payload.last_name || ""}`.trim() || "Platform Admin";
      sendTicketCreatedEmail(ticket.contact_email as string, ticket as any, adminName);
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
