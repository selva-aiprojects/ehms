import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "?code= parameter required" }, { status: 400 });
    }

    const db = getPublicDb();

    const rows = (await db.query(
      `SELECT id, name, code, schema_name, is_active, config, created_at, updated_at
       FROM public.tenants WHERE code = $1 LIMIT 1`,
      [code]
    )) as Record<string, unknown>[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: `No tenant found with code '${code}'` }, { status: 404 });
    }

    const tenant = rows[0];
    const config = tenant.config as Record<string, unknown> | null;

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        schema_name: tenant.schema_name,
        is_active: tenant.is_active,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,
        suspended: config?.suspended === true,
        verticals: config?.verticals,
        workspaces: config?.workspaces,
        contact_email: config?.contact_email || tenant.contact_email,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
