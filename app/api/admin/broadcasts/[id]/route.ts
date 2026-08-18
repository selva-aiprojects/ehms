import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Unauthorized: Platform Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { is_active } = body;

    const sql = getPublicDb();
    const rows = await sql`
      UPDATE public.platform_broadcasts
      SET is_active = ${Boolean(is_active)}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    return NextResponse.json({ broadcast: rows[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update broadcast";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Unauthorized: Platform Admin access required" }, { status: 403 });
    }

    const sql = getPublicDb();
    const rows = await sql`
      DELETE FROM public.platform_broadcasts
      WHERE id = ${id}
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete broadcast";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
