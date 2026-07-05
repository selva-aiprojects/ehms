import { NextRequest, NextResponse } from "next/server";
import { getDb, getPublicDb } from "@/lib/db";
import { signToken, comparePassword, type Vertical } from "@/lib/auth";
import { DEMO_ROLE_MAP } from "@/lib/role-access";

const DEMO_EMAILS = new Set(Object.keys(DEMO_ROLE_MAP));

export async function POST(req: NextRequest) {
  try {
    const { email, password, tenant_code } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (!tenant_code) {
      return NextResponse.json({ error: "Tenant selection required" }, { status: 400 });
    }

    const publicSql = getPublicDb();
    const tenantRows = await publicSql`
      SELECT id, name, code, schema_name, is_active, config
      FROM public.tenants WHERE code = ${tenant_code} LIMIT 1
    `;
    const tenant = (tenantRows as Record<string, unknown>[])[0];

    if (!tenant) {
      return NextResponse.json({ error: "Invalid tenant" }, { status: 401 });
    }

    const config = (tenant.config as Record<string, unknown>) || {};
    const suspended = config.suspended === true;

    if (suspended) {
      return NextResponse.json({
        error: "This tenant account has been suspended. Contact your platform administrator.",
        suspended: true,
      }, { status: 403 });
    }

    if (tenant.is_active !== true) {
      return NextResponse.json({ error: "This tenant is not active" }, { status: 401 });
    }

    const targetSchema = tenant.schema_name as string;
    const tenantName = tenant.name as string;

    const workspaces = (config.workspaces as { type: string; suspended?: boolean }[]) || [];
    let tenantVerticals: Vertical[] = [];
    if (workspaces.length > 0) {
      tenantVerticals = workspaces
        .filter(w => !w.suspended)
        .map(w => w.type as Vertical);
    } else {
      tenantVerticals = (config.verticals as Vertical[]) || [];
    }

    if (tenantVerticals.length === 0) {
      if (workspaces.length > 0) {
        return NextResponse.json({
          error: "All workspaces for this tenant have been suspended. Contact your platform administrator.",
        }, { status: 403 });
      }
      tenantVerticals = ["hotels", "apartments", "rental", "workplace"];
    }

    const sql = getDb(targetSchema);

    const isDemoUser = DEMO_EMAILS.has(email.toLowerCase());

    let rows;
    if (isDemoUser) {
      rows = await sql`
        SELECT
          u.id, u.email, u.password_hash, u.first_name, u.last_name, u.avatar_url,
          r.id AS role_id, r.name AS role_name,
          (u.password_hash = crypt(${password}, u.password_hash)) AS pwd_ok
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE LOWER(u.email) = ${email.toLowerCase()} AND u.is_active = true
        ORDER BY
          CASE r.name
            WHEN 'super_admin' THEN 0
            WHEN 'executive'   THEN 1
            WHEN 'property_manager' THEN 2
            ELSE 99
          END
        LIMIT 1
      `;
    } else {
      rows = await sql`
        SELECT
          u.id, u.email, u.password_hash, u.first_name, u.last_name, u.avatar_url,
          r.id AS role_id, r.name AS role_name,
          true AS pwd_ok
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE LOWER(u.email) = ${email.toLowerCase()} AND u.is_active = true
        ORDER BY
          CASE r.name
            WHEN 'super_admin' THEN 0
            WHEN 'executive'   THEN 1
            WHEN 'property_manager' THEN 2
            ELSE 99
          END
        LIMIT 1
      `;
    }

    const user = rows[0] as Record<string, unknown> | undefined;

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    let valid = false;
    if (isDemoUser) {
      valid = user.pwd_ok === true;
    } else {
      valid = await comparePassword(password, user.password_hash as string);
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const payload = {
      user_id: user.id as string,
      email: user.email as string,
      role_name: user.role_name as string,
      role_id: user.role_id as string,
      first_name: user.first_name as string,
      last_name: user.last_name as string | null,
      avatar_url: user.avatar_url as string | null,
      tenant_code,
      tenant_schema: targetSchema,
      tenant_name: tenantName,
      tenant_verticals: tenantVerticals,
    };

    const token = signToken(payload);

    sql`UPDATE users SET last_login_at = now() WHERE id = ${user.id}`.catch(() => {});

    const response = NextResponse.json({
      user: {
        id: payload.user_id,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        avatar_url: payload.avatar_url,
        role_name: payload.role_name,
        role_id: payload.role_id,
        tenant_code,
        tenant_schema: targetSchema,
        tenant_name: tenantName,
        tenant_verticals: tenantVerticals,
      },
      token,
      tenant: { name: tenantName, code: tenant_code, verticals: tenantVerticals },
    });

    response.cookies.set("ehms_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
