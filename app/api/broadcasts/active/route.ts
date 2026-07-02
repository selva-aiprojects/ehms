import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantCode = payload.tenant_code || null;
    const { searchParams } = new URL(req.url);
    const vertical = searchParams.get("vertical") || "all";

    const sql = getPublicDb();
    // Fetch active broadcasts where:
    // 1. is_active = true
    // 2. expires_at IS NULL or expires_at > now()
    // 3. target_tenant_code IS NULL or target_tenant_code = user's tenant
    // 4. target_vertical = 'all' or matches requested vertical
    const rows = await sql`
      SELECT id, title, content, category, priority, action_url, action_label, created_at
      FROM public.platform_broadcasts
      WHERE is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND (target_tenant_code IS NULL OR target_tenant_code = ${tenantCode})
        AND (target_vertical = 'all' OR target_vertical = ${vertical})
      ORDER BY 
        CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
        created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({ broadcasts: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch active broadcasts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
