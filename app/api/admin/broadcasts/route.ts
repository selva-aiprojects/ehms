import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Unauthorized: Platform Admin access required" }, { status: 403 });
    }

    const sql = getPublicDb();
    const rows = await sql`
      SELECT *
      FROM public.platform_broadcasts
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ broadcasts: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch broadcasts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Unauthorized: Platform Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      content,
      category = "announcement",
      priority = "normal",
      target_vertical = "all",
      target_tenant_code = null,
      action_url = null,
      action_label = null,
      expires_at = null,
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const sql = getPublicDb();
    const rows = await sql`
      INSERT INTO public.platform_broadcasts (
        title, content, category, priority, target_vertical,
        target_tenant_code, action_url, action_label, expires_at, created_by
      ) VALUES (
        ${title}, ${content}, ${category}, ${priority}, ${target_vertical},
        ${target_tenant_code || null}, ${action_url || null}, ${action_label || null},
        ${expires_at ? new Date(expires_at).toISOString() : null}, ${payload.user_id}
      )
      RETURNING *
    `;

    return NextResponse.json({ broadcast: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create broadcast";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
