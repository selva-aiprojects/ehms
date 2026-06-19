import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signToken, comparePassword } from "@/lib/auth";
import { DEMO_ROLE_MAP } from "@/lib/role-access";

// Demo users whose passwords are stored via pgcrypto crypt() in the seed.sql
// We verify them directly in SQL using crypt() for compatibility
const DEMO_EMAILS = new Set(Object.keys(DEMO_ROLE_MAP));
const DEMO_PASSWORD = "Demo@1234";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const sql = getDb();

    // Determine if this is a demo user (passwords stored with pgcrypto crypt())
    const isDemoUser = DEMO_EMAILS.has(email.toLowerCase());

    let rows;

    if (isDemoUser) {
      // For demo users: verify password in-database using pgcrypto crypt()
      // This handles the seed.sql which uses crypt('Demo@1234', gen_salt('bf'))
      rows = await sql`
        SELECT
          u.id, u.email, u.password_hash, u.first_name, u.last_name, u.avatar_url,
          r.id AS role_id, r.name AS role_name,
          (u.password_hash = crypt(${password}, u.password_hash)) AS pwd_ok
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.email = ${email.toLowerCase()} AND u.is_active = true
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
      // For regular users: fetch row and compare with bcrypt
      rows = await sql`
        SELECT
          u.id, u.email, u.password_hash, u.first_name, u.last_name, u.avatar_url,
          r.id AS role_id, r.name AS role_name,
          true AS pwd_ok
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.email = ${email.toLowerCase()} AND u.is_active = true
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

    // Validate password
    let valid = false;
    if (isDemoUser) {
      // pwd_ok was computed in SQL via pgcrypto
      valid = user.pwd_ok === true;
    } else {
      // bcrypt compare for non-demo users
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
    };

    const token = signToken(payload);

    // Update last login (fire and forget)
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
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
