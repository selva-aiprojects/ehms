import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const deptId = searchParams.get("department_id");

    const rows = await sql`
      SELECT
        e.*,
        json_build_object('id', d.id, 'name', d.name) AS department,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name, 'email', u.email, 'avatar_url', u.avatar_url) AS user
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.is_active = true
        ${deptId ? sql`AND e.department_id = ${deptId}` : sql``}
        ${search ? sql`AND (
          e.employee_code ILIKE ${"%" + search + "%"} OR
          u.first_name ILIKE ${"%" + search + "%"} OR
          u.last_name ILIKE ${"%" + search + "%"} OR
          e.designation ILIKE ${"%" + search + "%"}
        )` : sql``}
      ORDER BY e.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/employees GET]", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}
