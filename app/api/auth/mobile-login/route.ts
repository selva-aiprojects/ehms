import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { getPublicDb } from "@/lib/db";

/**
 * Mobile Login Endpoint
 * 
 * Unlike the web login (which sets httpOnly cookie), this endpoint
 * returns the JWT token in the JSON response body so the Flutter app
 * can store it securely using flutter_secure_storage.
 * 
 * POST /api/auth/mobile-login
 * Body: { email, password, tenant_code? }
 * Response: { token, user, tenant? }
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
    let schemaName = "public";

    if (tenant_code) {
      const tenantResult = await publicDb.query(
        `SELECT id, code, name, schema_name FROM tenants WHERE code = $1 AND status = 'active'`,
        [tenant_code]
      );
      tenant = tenantResult.rows?.[0];
      if (!tenant) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }
      schemaName = tenant.schema_name || tenant_code;
    }

    // Query user from tenant schema (or public for platform admins)
    const db = tenant_code
      ? (await import("@/lib/db")).getDb(schemaName)
      : publicDb;

    const userResult = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, 
              u.avatar_url, r.name as role_name, r.id as role_id,
              u.assigned_property_ids
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1 AND u.status = 'active'`,
      [email]
    );

    const user = userResult.rows?.[0];

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Build JWT payload
    const jwtPayload: any = {
      user_id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role_name: user.role_name,
      role_id: user.role_id,
      avatar_url: user.avatar_url,
      assigned_property_ids: user.assigned_property_ids || [],
    };

    // Add tenant context if applicable
    if (tenant) {
      jwtPayload.tenant_code = tenant.code;
      jwtPayload.tenant_schema = schemaName;
      jwtPayload.tenant_name = tenant.name;

      // Fetch tenant verticals
      const verticalsResult = await publicDb.query(
        `SELECT verticals FROM tenants WHERE code = $1`,
        [tenant_code]
      );
      jwtPayload.tenant_verticals = verticalsResult.rows?.[0]?.verticals || [];
    }

    // Check if platform admin
    if (user.role_name === "platform_super_admin") {
      jwtPayload.is_platform_admin = true;
    }

    // Sign JWT
    const token = signToken(jwtPayload);

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
          assigned_property_ids: user.assigned_property_ids || [],
        },
        tenant: tenant
          ? {
              code: tenant.code,
              name: tenant.name,
              schema: schemaName,
              verticals: jwtPayload.tenant_verticals || [],
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
