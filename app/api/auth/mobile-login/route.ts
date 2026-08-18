import { NextRequest, NextResponse } from "next/server";
import { signToken, comparePassword, type Vertical } from "@/lib/auth";
import { DEMO_ROLE_MAP } from "@/lib/role-access";
import { getDb, getPublicDb } from "@/lib/db";

const DEMO_EMAILS = new Set(Object.keys(DEMO_ROLE_MAP));

/**
 * Mobile Login Endpoint
 *
 * Returns the JWT token in the JSON response body (not httpOnly cookie)
 * so the Flutter app can store it via flutter_secure_storage.
 *
 * POST /api/auth/mobile-login
 * Body: { email, password, tenant_code? }
 * Response: { data: { token, user, tenant? } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, tenant_code } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const publicDb = getPublicDb();

    // Resolve tenant if code provided
    let tenant: any = null;
    let targetSchema = "public";
    let tenantVerticals: Vertical[] = [];

    if (tenant_code) {
      const tenantRows = await publicDb`
        SELECT id, name, code, schema_name, is_active, config
        FROM public.tenants WHERE code = ${tenant_code} LIMIT 1
      `;
      tenant = (tenantRows as Record<string, unknown>[])[0];

      if (!tenant) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }

      if (tenant.is_active !== true) {
        return NextResponse.json(
          { error: "This tenant is not active" },
          { status: 401 }
        );
      }

      const config = (tenant.config as Record<string, unknown>) || {};
      if (config.suspended === true) {
        return NextResponse.json(
          { error: "This tenant account has been suspended. Contact your platform administrator." },
          { status: 403 }
        );
      }

      targetSchema = tenant.schema_name || tenant_code;

      // Extract verticals from config.workspaces (matching web login)
      const workspaces = (config.workspaces as { type: string; suspended?: boolean }[]) || [];
      if (workspaces.length > 0) {
        tenantVerticals = workspaces
          .filter(w => !w.suspended)
          .map(w => w.type as Vertical);
      } else {
        tenantVerticals = (config.verticals as Vertical[]) || [];
      }

      if (tenantVerticals.length === 0) {
        if (workspaces.length > 0) {
          return NextResponse.json(
            { error: "All workspaces for this tenant have been suspended." },
            { status: 403 }
          );
        }
        tenantVerticals = ["hotels", "apartments", "rental", "workplace"];
      }
    }

    const sql = getDb(targetSchema);
    const isDemoUser = DEMO_EMAILS.has(email.toLowerCase());

    // Query user via user_roles join table (matching web login)
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
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    let valid = false;
    if (isDemoUser) {
      valid = user.pwd_ok === true;
    } else {
      valid = await comparePassword(password, user.password_hash as string);
    }

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Fetch assigned property IDs from user_roles
    const assignments = await sql`
      SELECT property_id FROM user_roles WHERE user_id = ${user.id} AND property_id IS NOT NULL
    `;
    const assignedPropertyIds = (assignments as Record<string, unknown>[]).map(r => r.property_id as string);

    // Build JWT payload
    const jwtPayload: any = {
      user_id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role_name: user.role_name,
      role_id: user.role_id,
      avatar_url: user.avatar_url,
      assigned_property_ids: assignedPropertyIds,
    };

    // Add tenant context if applicable
    if (tenant) {
      jwtPayload.tenant_code = tenant.code;
      jwtPayload.tenant_schema = targetSchema;
      jwtPayload.tenant_name = tenant.name;
      jwtPayload.tenant_verticals = tenantVerticals;
    }

    // Check if platform admin
    if (user.role_name === "platform_super_admin") {
      jwtPayload.is_platform_admin = true;
    }

    // Sign JWT
    const token = signToken(jwtPayload);

    // Update last login
    sql`UPDATE users SET last_login_at = now() WHERE id = ${user.id}`.catch(() => {});

    // Return token + user data in JSON body (not cookie)
    return NextResponse.json({
      data: {
        token,
        user: {
          user_id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role_name: user.role_name,
          role_id: user.role_id,
          avatar_url: user.avatar_url,
          assigned_property_ids: assignedPropertyIds,
        },
        tenant: tenant
          ? {
              code: tenant.code,
              name: tenant.name,
              schema: targetSchema,
              verticals: tenantVerticals,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("[Mobile Login Error]", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
