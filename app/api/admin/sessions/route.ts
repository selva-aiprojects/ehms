import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const sql = getDb();

    const rows = await sql`
      SELECT
        us.id, us.user_id, us.ip_address, us.user_agent, us.device_info,
        us.logged_in_at, us.last_active_at,
        json_build_object('id', u.id, 'email', u.email, 'first_name', u.first_name, 'last_name', u.last_name) AS user
      FROM user_sessions us
      JOIN users u ON u.id = us.user_id
      WHERE us.is_active = true
      ORDER BY us.last_active_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ data: rows, total: (rows as any[]).length });
  } catch (error: any) {
    console.error("[admin/sessions GET]", error);
    return NextResponse.json({ error: "Failed to fetch active sessions" }, { status: 500 });
  }
}
