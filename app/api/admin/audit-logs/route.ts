import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, parseInt(searchParams.get("limit") || "50"));
    const entityType = searchParams.get("entity_type");

    const queryParams: unknown[] = [];
    let paramIdx = 1;
    let clauses = "";

    if (entityType) {
      clauses += ` AND al.entity_type = $${paramIdx}`;
      queryParams.push(entityType);
      paramIdx++;
    }

    queryParams.push(limit);
    const limitIdx = paramIdx;

    const queryText = `
      SELECT
        al.*,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name, 'email', u.email) AS user
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE 1=1
        ${clauses}
      ORDER BY al.created_at DESC
      LIMIT $${limitIdx}
    `;

    const rows = await sql.query(queryText, queryParams);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[audit-logs GET]", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
