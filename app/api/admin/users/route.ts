import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const rows = await sql`
      SELECT
        u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at, u.last_login_at,
        COALESCE(
          json_agg(json_build_object('role', json_build_object('id', r.id, 'name', r.name, 'description', r.description)))
          FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS user_roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE 1=1
        ${status === "active" ? sql`AND u.is_active = true` : status === "inactive" ? sql`AND u.is_active = false` : sql``}
        ${search ? sql`AND (u.first_name ILIKE ${"%" + search + "%"} OR u.last_name ILIKE ${"%" + search + "%"} OR u.email ILIKE ${"%" + search + "%"})` : sql``}
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
