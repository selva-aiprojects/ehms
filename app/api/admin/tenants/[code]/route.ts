import { NextRequest, NextResponse } from "next/server";
import { getDb, getPublicDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const token = req.cookies.get("ehms_token")?.value;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can manage tenants" }, { status: 403 });
    }

    const { code } = await params;
    const body = await req.json();
    const { verticals, suspended, name, contact_email, contact_phone, domain, workspaces } = body;

    const db = getPublicDb();

    const existing = (await db.query(
      "SELECT id, config, schema_name FROM public.tenants WHERE code = $1 LIMIT 1",
      [code]
    )) as Record<string, unknown>[];
    const tenantRow = existing[0];
    if (!tenantRow) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const schemaName = tenantRow.schema_name as string;
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
      newConfig.workspaces = workspaces.map((w: { type: string; name: string; is_primary?: boolean; suspended?: boolean }) => ({
        type: w.type,
        name: w.name,
        is_primary: w.is_primary || false,
        suspended: w.suspended || false,
      }));
      newConfig.verticals = [...new Set(workspaces.map((w: { type: string }) => w.type))];
    }

    const setClauses: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      queryParams.push(name ?? null);
    }
    if (contact_email !== undefined) {
      setClauses.push(`contact_email = $${paramIndex++}`);
      queryParams.push(contact_email ?? null);
    }
    if (contact_phone !== undefined) {
      setClauses.push(`contact_phone = $${paramIndex++}`);
      queryParams.push(contact_phone ?? null);
    }
    if (domain !== undefined) {
      setClauses.push(`domain = $${paramIndex++}`);
      queryParams.push(domain ?? null);
    }

    setClauses.push(`config = $${paramIndex++}::jsonb`);
    queryParams.push(JSON.stringify(newConfig));

    setClauses.push("updated_at = now()");

    queryParams.push(code);
    const sql = `UPDATE public.tenants SET ${setClauses.join(", ")} WHERE code = $${paramIndex} RETURNING id, name, code, schema_name, config, domain, contact_email, contact_phone, is_active, created_at, updated_at`;

    const result = (await db.query(sql, queryParams)) as Record<string, unknown>[];
    const updated = result[0];

    // Synchronize workspace names with properties table in tenant shard
    if (workspaces !== undefined && schemaName) {
      try {
        const tenantDb = getDb(schemaName);
        const typeMap: Record<string, string> = {
          "hotels": "hotel",
          "apartments": "service_apartment",
          "rental": "rental_apartment",
          "workplace": "workplace"
        };

        const activeVerticals = workspaces.map(w => typeMap[w.type]).filter(Boolean);
        for (const ws of workspaces) {
          const dbType = typeMap[ws.type];
          if (!dbType) continue;

          await tenantDb.query(
            "UPDATE properties SET name = $1, is_active = true WHERE vertical_type::text = $2",
            [ws.name, dbType]
          );
        }

        if (activeVerticals.length > 0) {
          await tenantDb.query(
            "UPDATE properties SET is_active = false WHERE vertical_type::text NOT IN (SELECT unnest($1::text[]))",
            [activeVerticals]
          );
        }
      } catch (syncErr) {
        console.error("Failed to sync workspace names during tenant update:", syncErr);
      }
    }

    return NextResponse.json({ tenant: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
