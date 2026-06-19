import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signToken, comparePassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const sql = getDb();

    const rows = await sql`
      SELECT
        u.id, u.email, u.password_hash, u.first_name, u.last_name, u.avatar_url,
        r.id AS role_id, r.name AS role_name
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE u.email = ${email} AND u.is_active = true
      LIMIT 1
    `;

    const user = rows[0] as Record<string, unknown> | undefined;

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password_hash as string);
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

    await sql`UPDATE users SET last_login_at = now() WHERE id = ${user.id}`;

    const response = NextResponse.json({
      user: payload,
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
