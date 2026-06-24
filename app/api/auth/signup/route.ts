import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

const ALLOWED_SIGNUP_ROLES = new Set([
  "super_admin",
  "executive",
  "property_manager",
  "front_desk",
  "housekeeping_staff",
  "maintenance_staff",
  "hr_manager",
  "finance_manager",
  "workplace_facility_manager"
]);

export async function POST(req: NextRequest) {
  try {
    const { first_name, last_name, email, password, role_name } = await req.json();

    // Basic Input Validation
    if (!first_name || !email || !password) {
      return NextResponse.json({ error: "First name, email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email address format" }, { status: 400 });
    }

    const selectedRole = role_name || "property_manager";
    if (!ALLOWED_SIGNUP_ROLES.has(selectedRole)) {
      return NextResponse.json({ error: "Invalid system role selected" }, { status: 400 });
    }

    const sql = getDb();

    // Check if user already exists
    const existingUsers = (await sql`
      SELECT id FROM users WHERE email = ${trimmedEmail}
    `) as any;

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    // Get Role ID
    const rolesQueryResult = (await sql`
      SELECT id FROM roles WHERE name = ${selectedRole} LIMIT 1
    `) as any;

    if (rolesQueryResult.length === 0) {
      return NextResponse.json({ error: "System role configuration error" }, { status: 500 });
    }

    const roleId = rolesQueryResult[0].id as string;

    // Hash Password using bcryptjs helper
    const hashedPassword = await hashPassword(password);

    // Insert User
    const usersInsertResult = (await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, is_active)
      VALUES (${trimmedEmail}, ${hashedPassword}, ${first_name.trim()}, ${last_name ? last_name.trim() : null}, true)
      RETURNING id, email, first_name, last_name, avatar_url
    `) as any;

    const newUser = usersInsertResult[0];

    // Assign Role
    await sql`
      INSERT INTO user_roles (user_id, role_id, property_id)
      VALUES (${newUser.id}, ${roleId}, NULL)
    `;

    const payload = {
      user_id: newUser.id as string,
      email: newUser.email as string,
      role_name: selectedRole,
      role_id: roleId,
      first_name: newUser.first_name as string,
      last_name: newUser.last_name as string | null,
      avatar_url: newUser.avatar_url as string | null,
      tenant_code: process.env.DEFAULT_TENANT_CODE || "VISWA",
      tenant_schema: process.env.DEFAULT_TENANT_SCHEMA || "viswa",
    };

    const token = signToken(payload);

    const response = NextResponse.json({
      user: {
        id: payload.user_id,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        avatar_url: payload.avatar_url,
        role_name: payload.role_name,
        role_id: payload.role_id,
      },
      token,
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
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
