import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;

    // Only platform superadmins can manage tenants
    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can manage tenants" }, { status: 403 });
    }

    const { code } = await params;
    const body = await req.json();
    const { verticals, suspended, name, contact_email, contact_phone, domain, workspaces } = body;

    const db = getPublicDb();

    const existing = await db`
      SELECT id, config FROM public.tenants WHERE code = ${code} LIMIT 1
    `;
    const tenantRow = (existing as Record<string, unknown>[])[0];
    if (!tenantRow) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const currentConfig = (tenantRow.config as Record<string, unknown>) || {};
    const newConfig = { ...currentConfig };

    if (verticals !== undefined) {
      if (!Array.isArray(verticals) || !verticals.every((v: string) => ["hotels", "apartments", "rental", "workplace"].includes(v))) {
        return NextResponse.json({ error: "Invalid verticals. Allowed: hotels, apartments, rental, workplace" }, { status: 400 });
      }
      newConfig.verticals = verticals;
    }

    if (suspended !== undefined) {
      newConfig.suspended = Boolean(suspended);
    }

    if (workspaces !== undefined) {
      if (!Array.isArray(workspaces) || workspaces.length === 0) {
        return NextResponse.json({ error: "At least one workspace is required" }, { status: 400 });
      }
      const valid = workspaces.every(
        (w: { type?: string; name?: string }) =>
          w.type && w.name && ["hotels", "apartments", "rental", "workplace"].includes(w.type)
      );
      if (!valid) {
        return NextResponse.json({ error: "Each workspace must have a valid type and name" }, { status: 400 });
      }
      const hasPrimary = workspaces.some((w: { is_primary?: boolean }) => w.is_primary);
      if (!hasPrimary) {
        workspaces[0].is_primary = true;
      }
      newConfig.workspaces = workspaces.map((w: { type: string; name: string; is_primary?: boolean }) => ({
        type: w.type,
        name: w.name,
        is_primary: w.is_primary || false,
      }));
      // Auto-derive verticals from workspace types
      newConfig.verticals = [...new Set(workspaces.map((w: { type: string }) => w.type))];
    }

    const result = await db`
      UPDATE public.tenants
      SET
        name = CASE WHEN ${name !== undefined} THEN ${name ?? null} ELSE name END,
        contact_email = CASE WHEN ${contact_email !== undefined} THEN ${contact_email ?? null} ELSE contact_email END,
        contact_phone = CASE WHEN ${contact_phone !== undefined} THEN ${contact_phone ?? null} ELSE contact_phone END,
        domain = CASE WHEN ${domain !== undefined} THEN ${domain ?? null} ELSE domain END,
        config = ${JSON.stringify(newConfig)}::jsonb,
        updated_at = now()
      WHERE code = ${code}
      RETURNING id, name, code, schema_name, config, domain, contact_email, contact_phone, is_active, created_at, updated_at
    `;

    const updated = (result as Record<string, unknown>[])[0];
    return NextResponse.json({ tenant: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
