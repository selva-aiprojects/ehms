import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb, getPublicDb } from "@/lib/db";
import { verifyToken, hashPassword } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

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

    if (!payload?.is_platform_admin) {
      return NextResponse.json({ error: "Only platform superadmins can provision tenants" }, { status: 403 });
    }

    const { name, code, schema, workspaces, primary_contact_name, contact_email, payment_mode, subscription_charges_type, price } = await req.json();

    if (!name || !code || !schema) {
      return NextResponse.json({ error: "name, code, and schema are required" }, { status: 400 });
    }

    if (!contact_email) {
      return NextResponse.json({ error: "contact_email is required to send welcome credentials" }, { status: 400 });
    }

    if (!/^[a-z][a-z0-9_]{1,61}[a-z0-9]$/.test(schema)) {
      return NextResponse.json({ error: "Invalid schema name. Use lowercase, start with letter, 3-63 chars." }, { status: 400 });
    }

    if (!/^[A-Z][A-Z0-9_]{1,10}$/.test(code)) {
      return NextResponse.json({ error: "Invalid tenant code. Use uppercase, 2-11 chars." }, { status: 400 });
    }

    const validWorkspaces = Array.isArray(workspaces) && workspaces.length > 0
      ? workspaces.filter((w: { type: string; name: string }) =>
          w.type && w.name && ["hotels", "apartments", "rental", "workplace"].includes(w.type)
        )
      : [];

    if (validWorkspaces.length === 0) {
      return NextResponse.json({ error: "At least one workspace with type and name is required" }, { status: 400 });
    }

    const hasPrimary = validWorkspaces.some((w: { is_primary: boolean }) => w.is_primary);
    if (!hasPrimary) {
      validWorkspaces[0].is_primary = true;
    }

    const selectedVerticals = [...new Set(validWorkspaces.map((w: { type: string }) => w.type))];

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

    // ── Create admin user in the new tenant schema ──
    const tempPassword = crypto.randomBytes(4).toString("hex") + "@A1";
    const passwordHash = await hashPassword(tempPassword);

    const adminFirstName = primary_contact_name || "Administrator";
    const adminEmail = contact_email;

    const tenantDb = getDb(schema);
    await tenantDb`
      INSERT INTO users (email, first_name, password_hash, is_active)
      VALUES (${adminEmail}, ${adminFirstName}, ${passwordHash}, true)
    `;

    const userResult = await tenantDb`
      SELECT id FROM users WHERE email = ${adminEmail} LIMIT 1
    ` as { id: string }[];
    const adminUserId = userResult[0]?.id;

    if (adminUserId) {
      const roleResult = await tenantDb`
        SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1
      ` as { id: string }[];
      const superAdminRoleId = roleResult[0]?.id;

      if (superAdminRoleId) {
        await tenantDb`
          INSERT INTO user_roles (user_id, role_id)
          VALUES (${adminUserId}::uuid, ${superAdminRoleId}::uuid)
        `;
      }
    }

    // ── Send welcome email ──
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login?tenant=${code}`;

    await sendWelcomeEmail(
      adminEmail,
      name,
      adminFirstName,
      adminEmail,
      tempPassword,
      loginUrl
    );

    // ── Store contact_email in tenants config ──
    const config: Record<string, unknown> = {
      verticals: selectedVerticals,
      suspended: false,
      workspaces: validWorkspaces.map((w: { type: string; name: string; is_primary?: boolean }) => ({
        type: w.type,
        name: w.name,
        is_primary: w.is_primary || false,
      })),
    };

    if (primary_contact_name) config.primary_contact_name = primary_contact_name;
    if (contact_email) config.contact_email = contact_email;
    if (payment_mode) config.payment_mode = payment_mode;
    if (subscription_charges_type) config.subscription_charges = subscription_charges_type;
    if (price != null) config.price = price;

    await publicDb`
      UPDATE public.tenants
      SET config = ${JSON.stringify(config)}::jsonb
      WHERE id = ${tenantId}
    `;

    // Sync initial property names with configured workspaces
    try {
      const typeMap: Record<string, string> = {
        "hotels": "hotel",
        "apartments": "service_apartment",
        "rental": "rental_apartment",
        "workplace": "workplace"
      };

      const activeVerticals = validWorkspaces.map(w => typeMap[w.type]).filter(Boolean);
      for (const ws of validWorkspaces) {
        const dbType = typeMap[ws.type];
        if (!dbType) continue;

        await tenantDb.query(
          "UPDATE properties SET name = $1, is_active = true WHERE vertical_type = $2",
          [ws.name, dbType]
        );
      }

      if (activeVerticals.length > 0) {
        await tenantDb.query(
          "UPDATE properties SET is_active = false WHERE vertical_type NOT IN (SELECT unnest($1::text[]))",
          [activeVerticals]
        );
      }
    } catch (syncErr) {
      console.error("Failed to sync workspace names during tenant creation:", syncErr);
    }

    return NextResponse.json({
      tenant_id: tenantId,
      name,
      code,
      schema,
      verticals: selectedVerticals,
      workspaces: config.workspaces,
      admin_email: adminEmail,
      email_sent: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Provisioning failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
