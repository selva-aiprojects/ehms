import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  try {
    const sql = getPublicDb();
    const rows = await sql`
      SELECT id, name, code, schema_name, logo_url, domain, contact_email,
             contact_phone, is_active, config, created_at
      FROM public.tenants
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

    // Only platform superadmins can provision tenants
    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can provision tenants" }, { status: 403 });
    }

    const { name, code, schema, verticals } = await req.json();

    if (!name || !code || !schema) {
      return NextResponse.json({ error: "name, code, and schema are required" }, { status: 400 });
    }

    if (!/^[a-z][a-z0-9_]{1,61}[a-z0-9]$/.test(schema)) {
      return NextResponse.json({ error: "Invalid schema name. Use lowercase, start with letter, 3-63 chars." }, { status: 400 });
    }

    if (!/^[A-Z][A-Z0-9_]{1,10}$/.test(code)) {
      return NextResponse.json({ error: "Invalid tenant code. Use uppercase, 2-11 chars." }, { status: 400 });
    }

    const selectedVerticals = Array.isArray(verticals) && verticals.length > 0
      ? verticals
      : ["hotels", "apartments", "rental", "workplace"];

    const valid = selectedVerticals.every((v: string) =>
      ["hotels", "apartments", "rental", "workplace"].includes(v)
    );
    if (!valid) {
      return NextResponse.json({ error: "Invalid vertical. Allowed: hotels, apartments, rental, workplace" }, { status: 400 });
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

    const tenantId = ((result as Record<string, unknown>[])[0] as { tenant_id: string }).tenant_id;

    await publicDb`
      UPDATE public.tenants
      SET config = ${JSON.stringify({ verticals: selectedVerticals, suspended: false })}::jsonb
      WHERE id = ${tenantId}
    `;

    return NextResponse.json({
      tenant_id: tenantId,
      name,
      code,
      schema,
      verticals: selectedVerticals,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Provisioning failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
