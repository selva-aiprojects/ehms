export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const rows = await sql`
      SELECT * FROM revenue_ai_audit
      WHERE 1=1
        ${scope.assignedPropertyIds.length > 0 ? sql`AND property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY applied_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[revenue-ai/audit GET]", error);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
