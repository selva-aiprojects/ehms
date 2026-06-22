import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employee_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const status = searchParams.get("status");

    const rows = await sql`
      SELECT
        t.*,
        json_build_object('id', e.id, 'employee_code', e.employee_code, 'designation', e.designation) AS employee,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) AS user
      FROM timesheets t
      LEFT JOIN employees e ON e.id = t.employee_id
      LEFT JOIN users u ON u.id = e.user_id
      WHERE 1=1
        ${employeeId ? sql`AND t.employee_id = ${employeeId}` : sql``}
        ${dateFrom ? sql`AND t.date >= ${dateFrom}::date` : sql``}
        ${dateTo ? sql`AND t.date <= ${dateTo}::date` : sql``}
        ${status ? sql`AND t.status = ${status}` : sql``}
      ORDER BY t.date DESC, t.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/timesheets GET]", error);
    return NextResponse.json({ error: "Failed to fetch timesheets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const rows = await sql`
      INSERT INTO timesheets (
        employee_id, date, clock_in, clock_out, total_hours, break_hours,
        project, task, notes, status
      ) VALUES (
        ${body.employee_id}, ${body.date}::date, ${body.clock_in}::timestamptz,
        ${body.clock_out}::timestamptz, ${body.total_hours}, ${body.break_hours},
        ${body.project}, ${body.task}, ${body.notes},
        COALESCE(${body.status}, 'draft')
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/timesheets POST]", error);
    return NextResponse.json({ error: "Failed to create timesheet" }, { status: 500 });
  }
}
