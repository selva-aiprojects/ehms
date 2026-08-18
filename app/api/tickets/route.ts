import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { sendTicketCreatedEmail, sendTicketReplyEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload?.tenant_code) {
      return NextResponse.json({ error: "Tenant authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const db = getPublicDb();
    let query = `SELECT id, tenant_code, subject, description, status, priority, category, contact_name, contact_email, created_at, updated_at, resolved_at, closed_at FROM public.support_tickets WHERE tenant_code = $1`;
    const params: unknown[] = [payload.tenant_code];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += " ORDER BY updated_at DESC";

    const rows = await db.query(query, params);
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
    if (!payload?.tenant_code) {
      return NextResponse.json({ error: "Tenant authentication required" }, { status: 401 });
    }

    const { subject, description, priority, category } = await req.json();

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    const db = getPublicDb();
    const contactName = `${payload.first_name || ""} ${payload.last_name || ""}`.trim() || "Tenant User";

    const result = await db`
      INSERT INTO public.support_tickets (tenant_code, subject, description, priority, category, created_by, contact_name, contact_email)
      VALUES (${payload.tenant_code}, ${subject}, ${description || ""}, ${priority || "medium"}, ${category || "general"}, ${payload.user_id || payload.email}, ${contactName}, ${payload.email || ""})
      RETURNING id, tenant_code, subject, description, status, priority, category, contact_name, contact_email, created_at
    `;

    const ticket = (result as Record<string, unknown>[])[0];

    if (ticket && payload.email) {
      sendTicketCreatedEmail(payload.email, ticket as any, contactName);
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
