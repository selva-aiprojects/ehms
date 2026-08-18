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

    const queryParams: unknown[] = [];
    let paramIdx = 1;
    let clauses = "";

    if (eventType) {
      clauses += ` AND event_type = $${paramIdx}`;
      queryParams.push(eventType);
      paramIdx++;
    }
    if (severity) {
      clauses += ` AND severity = $${paramIdx}`;
      queryParams.push(severity);
      paramIdx++;
    }

    queryParams.push(`${days} days`);
    const intervalIdx = paramIdx;
    paramIdx++;

    queryParams.push(limit);
    const limitIdx = paramIdx;

    const queryText = `
      SELECT *
      FROM system_audit_events
      WHERE created_at >= now() - $${intervalIdx}::interval
        ${clauses}
      ORDER BY created_at DESC
      LIMIT $${limitIdx}
    `;

    const rows = await sql.query(queryText, queryParams);

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[admin/audit-events GET]", error);
    return NextResponse.json({ error: "Failed to fetch audit events" }, { status: 500 });
  }
}
