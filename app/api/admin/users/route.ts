import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT
        u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at, u.last_login_at,
        COALESCE(
          json_agg(
            json_build_object(
              'role', json_build_object('id', r.id, 'name', r.name, 'description', r.description),
              'property_id', ur.property_id
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS user_roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE 1=1
        ${status === "active" ? sql`AND u.is_active = true` : status === "inactive" ? sql`AND u.is_active = false` : sql``}
        ${search ? sql`AND (u.first_name ILIKE ${"%" + search + "%"} OR u.last_name ILIKE ${"%" + search + "%"} OR u.email ILIKE ${"%" + search + "%"})` : sql``}
        ${propertyId ? sql`AND ur.property_id = ${propertyId}` : sql``}
      GROUP BY u.id
      HAVING 1=1
        ${role ? sql`AND bool_or(r.name = ${role})` : sql``}
      ORDER BY u.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[admin/users GET]", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const requesterRole = req.headers.get("x-user-role");
    if (requesterRole !== "super_admin") {
      return NextResponse.json({ error: "Access denied. Only Super Admins can manage users." }, { status: 403 });
    }

    const { first_name, last_name, email, password, role_name, property_id } = await req.json();

    if (!first_name || !email || !password || !role_name) {
      return NextResponse.json({ error: "First name, email, password, and role are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email address format" }, { status: 400 });
    }

    const sql = getDb();

    const existingUsers = (await sql`
      SELECT id FROM users WHERE email = ${trimmedEmail}
    `) as any[];
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const rolesQueryResult = (await sql`
      SELECT id FROM roles WHERE name = ${role_name} LIMIT 1
    `) as any[];
    if (rolesQueryResult.length === 0) {
      return NextResponse.json({ error: "Selected system role does not exist" }, { status: 400 });
    }
    const roleId = rolesQueryResult[0].id;

    if (property_id) {
      const propertyQueryResult = (await sql`
        SELECT id FROM properties WHERE id = ${property_id} LIMIT 1
      `) as any[];
      if (propertyQueryResult.length === 0) {
        return NextResponse.json({ error: "Selected workspace does not exist" }, { status: 400 });
      }
    }

    const { hashPassword } = await import("@/lib/auth");
    const hashedPassword = await hashPassword(password);

    const usersInsertResult = (await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, is_active)
      VALUES (${trimmedEmail}, ${hashedPassword}, ${first_name.trim()}, ${last_name ? last_name.trim() : null}, true)
      RETURNING id, email, first_name, last_name
    `) as any[];
    const newUser = usersInsertResult[0];

    await sql`
      INSERT INTO user_roles (user_id, role_id, property_id)
      VALUES (${newUser.id}, ${roleId}, ${property_id || null})
    `;

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
      }
    }, { status: 201 });

  } catch (error: unknown) {
    console.error("[admin/users POST]", error);
    const message = error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
