import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();

    const rows = await sql`
      SELECT * FROM system_backups ORDER BY created_at DESC LIMIT 50
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[admin/backup GET]", error);
    return NextResponse.json({ error: "Failed to fetch backups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const requesterRole = req.headers.get("x-user-role");
    if (requesterRole !== "super_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const sql = getDb();
    const body = await req.json().catch(() => ({}));
    const backupType = body.backup_type || "full";

    const result = await sql`
      INSERT INTO system_backups (backup_type, status, triggered_by)
      VALUES (${backupType}, 'pending', ${null})
      RETURNING *
    ` as any[];

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[admin/backup POST]", error);
    return NextResponse.json({ error: error?.message || "Failed to initiate backup" }, { status: 500 });
  }
}
