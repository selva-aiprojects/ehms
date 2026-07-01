import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const requesterRole = req.headers.get("x-user-role");
    const allowedRoles = ["super_admin", "executive", "property_manager", "housekeeping_supervisor", "maintenance_supervisor"];
    if (!allowedRoles.includes(requesterRole || "")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const requesterId = req.headers.get("x-user-id");
    const sql = getDb();
    
    const requesterRoles = await sql`
      SELECT property_id 
      FROM user_roles 
      WHERE user_id = ${requesterId}
    `;
    const requesterPropertyId = requesterRoles[0]?.property_id || null;

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const propertyId = searchParams.get("property_id");

    let finalPropertyId = requesterPropertyId;
    if (!finalPropertyId) {
      finalPropertyId = propertyId;
    }

    const queryParams: unknown[] = [];
    let paramIdx = 1;
    let whereClauses = "";

    if (status === "active") {
      whereClauses += " AND u.is_active = true";
    } else if (status === "inactive") {
      whereClauses += " AND u.is_active = false";
    }

    if (search) {
      whereClauses += ` AND (u.first_name ILIKE $${paramIdx} OR u.last_name ILIKE $${paramIdx + 1} OR u.email ILIKE $${paramIdx + 2})`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIdx += 3;
    }

    if (finalPropertyId) {
      whereClauses += ` AND ur.property_id = $${paramIdx}`;
      queryParams.push(finalPropertyId);
      paramIdx += 1;
    }

    let havingClauses = "";
    if (role) {
      havingClauses += ` HAVING bool_or(r.name = $${paramIdx})`;
      queryParams.push(role);
      paramIdx += 1;
    }

    const queryText = `
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
      WHERE 1=1 ${whereClauses}
      GROUP BY u.id
      ${havingClauses}
      ORDER BY u.created_at DESC
    `;

    const rows = await sql.query(queryText, queryParams);

    return NextResponse.json({ data: rows, requester_property_id: requesterPropertyId });
  } catch (error) {
    console.error("[admin/users GET]", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const requesterRole = req.headers.get("x-user-role");
    const allowedRoles = ["super_admin", "property_manager", "housekeeping_supervisor", "maintenance_supervisor"];
    if (!allowedRoles.includes(requesterRole || "")) {
      return NextResponse.json({ error: "Access denied. Only authorized administrators can manage users." }, { status: 403 });
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
    const requesterId = req.headers.get("x-user-id");
    
    const requesterRoles = await sql`
      SELECT property_id 
      FROM user_roles 
      WHERE user_id = ${requesterId}
    `;
    const requesterPropertyId = requesterRoles[0]?.property_id || null;

    if (requesterPropertyId) {
      if (property_id !== requesterPropertyId) {
        return NextResponse.json({ error: "Access denied. Scoped administrators can only create users within their workspace." }, { status: 403 });
      }
      if (role_name === "super_admin") {
        return NextResponse.json({ error: "Access denied. Scoped administrators cannot assign the super_admin role." }, { status: 403 });
      }
    }

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
