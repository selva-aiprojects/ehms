import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, parseInt(searchParams.get("limit") || "50"));
    const eventType = searchParams.get("event_type");
    const severity = searchParams.get("severity");
    const days = parseInt(searchParams.get("days") || "7");

    const rows = await sql`
      SELECT *
      FROM system_audit_events
      WHERE created_at >= now() - (${days} || ' days')::interval
        ${eventType ? sql`AND event_type = ${eventType}` : sql``}
        ${severity ? sql`AND severity = ${severity}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[admin/audit-events GET]", error);
    return NextResponse.json({ error: "Failed to fetch audit events" }, { status: 500 });
  }
}
