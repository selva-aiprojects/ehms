import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employee_id");
    const status = searchParams.get("status");
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");

    const rows = await sql`
      SELECT
        lr.*,
        json_build_object('id', lt.id, 'name', lt.name, 'code', lt.code) AS leave_type,
        json_build_object('id', e.id, 'employee_code', e.employee_code) AS employee,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) AS approved_by_user
      FROM leave_requests lr
      LEFT JOIN leave_types lt ON lt.id = lr.leave_type_id
      LEFT JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN users u ON u.id = lr.approved_by
      WHERE 1=1
        ${employeeId ? sql`AND lr.employee_id = ${employeeId}` : sql``}
        ${status ? sql`AND lr.status = ${status}` : sql``}
        ${fromDate ? sql`AND lr.start_date >= ${fromDate}::date` : sql``}
        ${toDate ? sql`AND lr.end_date <= ${toDate}::date` : sql``}
      ORDER BY lr.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/leaves GET]", error);
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();
    const currentYear = new Date().getFullYear();

    const leaveTypeRows = await sql`SELECT id, days_per_year FROM leave_types WHERE id = ${body.leave_type_id}`;
    if (!leaveTypeRows[0]) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    let balanceRows = await sql`
      SELECT id, total_allocated, used, pending, remaining
      FROM leave_balances
      WHERE employee_id = ${body.employee_id}
        AND leave_type_id = ${body.leave_type_id}
        AND period_year = ${currentYear}
    `;

    if (!balanceRows[0]) {
      const daysPerYear = (leaveTypeRows[0] as { days_per_year: number }).days_per_year;
      balanceRows = await sql`
        INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, period_year)
        VALUES (${body.employee_id}, ${body.leave_type_id}, ${daysPerYear}, ${currentYear})
        RETURNING id, total_allocated, used, pending, remaining
      `;
    }

    const balance = balanceRows[0] as { remaining: number };
    if (balance.remaining < body.total_days) {
      return NextResponse.json(
        { error: `Insufficient leave balance. Available: ${balance.remaining}, Requested: ${body.total_days}` },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status)
      VALUES (
        ${body.employee_id}, ${body.leave_type_id}, ${body.start_date}::date,
        ${body.end_date}::date, ${body.total_days}, ${body.reason}, 'pending'
      )
      RETURNING *
    `;

    await sql`
      UPDATE leave_balances SET pending = pending + ${body.total_days}
      WHERE employee_id = ${body.employee_id}
        AND leave_type_id = ${body.leave_type_id}
        AND period_year = ${currentYear}
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/leaves POST]", error);
    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 });
  }
}
