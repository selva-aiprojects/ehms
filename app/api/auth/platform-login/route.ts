import { NextRequest, NextResponse } from "next/server";
import { getPublicDb } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const sql = getPublicDb();

    const rows = await sql`
      SELECT
        id, email, password_hash, first_name, last_name, avatar_url,
        (password_hash = crypt(${password}, password_hash)) AS pwd_ok
      FROM public.platform_admins
      WHERE email = ${email.toLowerCase()} AND is_active = true
      LIMIT 1
    `;

    const admin = (rows as Record<string, unknown>[])[0];

    if (!admin) {
      return NextResponse.json({ error: "Invalid platform admin credentials" }, { status: 401 });
    }

    if (admin.pwd_ok !== true) {
      return NextResponse.json({ error: "Invalid platform admin credentials" }, { status: 401 });
    }

    const payload = {
      user_id: admin.id as string,
      email: admin.email as string,
      role_name: "platform_super_admin",
      first_name: admin.first_name as string,
      last_name: admin.last_name as string | null,
      avatar_url: admin.avatar_url as string | null,
      is_platform_admin: true,
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
        is_platform_admin: true,
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
    const message = error instanceof Error ? error.message : "Platform login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
