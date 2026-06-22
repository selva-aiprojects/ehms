import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employee_id");
    const status = searchParams.get("status");

    const rows = await sql`
      SELECT
        i.*,
        json_build_object('id', e.id, 'employee_code', e.employee_code, 'user_id', e.user_id) AS employee,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) AS approved_by_user
      FROM increments i
      LEFT JOIN employees e ON e.id = i.employee_id
      LEFT JOIN users u ON u.id = i.approved_by
      WHERE 1=1
        ${employeeId ? sql`AND i.employee_id = ${employeeId}` : sql``}
        ${status ? sql`AND i.status = ${status}` : sql``}
      ORDER BY i.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/increments GET]", error);
    return NextResponse.json({ error: "Failed to fetch increments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO increments (
        employee_id, appraisal_id, current_ctc, new_ctc, increment_pct,
        effective_date, reason, approved_by, status
      ) VALUES (
        ${body.employee_id}, ${body.appraisal_id}, ${body.current_ctc}, ${body.new_ctc},
        ${body.increment_pct}, ${body.effective_date}, ${body.reason},
        ${body.approved_by}, ${body.status}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/increments POST]", error);
    return NextResponse.json({ error: "Failed to create increment" }, { status: 500 });
  }
}
