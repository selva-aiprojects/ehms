import { NextRequest, NextResponse } from "next/server";
import { getPublicDb, getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const sql = getPublicDb();
    const rows = await sql`
      SELECT id, name, code, schema_name, logo_url, domain, contact_email,
             is_active, created_at
      FROM public.tenants
      WHERE is_active = true
      ORDER BY created_at ASC
    `;
    return NextResponse.json({ tenants: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch tenants";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role_name !== "super_admin") {
      return NextResponse.json({ error: "Only super admins can provision tenants" }, { status: 403 });
    }

    const { name, code, schema } = await req.json();

    if (!name || !code || !schema) {
      return NextResponse.json({ error: "name, code, and schema are required" }, { status: 400 });
    }

    if (!/^[a-z][a-z0-9_]{1,61}[a-z0-9]$/.test(schema)) {
      return NextResponse.json({ error: "Invalid schema name. Use lowercase, start with letter, 3-63 chars." }, { status: 400 });
    }

    if (!/^[A-Z][A-Z0-9_]{1,10}$/.test(code)) {
      return NextResponse.json({ error: "Invalid tenant code. Use uppercase, 2-11 chars." }, { status: 400 });
    }

    const publicDb = getPublicDb();

    const existing = await publicDb`
      SELECT id FROM public.tenants WHERE code = ${code} OR schema_name = ${schema} LIMIT 1
    `;
    if ((existing as Record<string, unknown>[]).length > 0) {
      return NextResponse.json({ error: "Tenant code or schema already exists" }, { status: 409 });
    }

    const result = await publicDb`
      SELECT public.provision_tenant_schema(${name}, ${code}, ${schema}) AS tenant_id
    `;

    const tenantId = (result[0] as { tenant_id: string }).tenant_id;

    return NextResponse.json({ tenant_id: tenantId, name, code, schema });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Provisioning failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
