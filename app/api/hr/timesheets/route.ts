import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employee_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const status = searchParams.get("status");
    const propertyId = searchParams.get("property_id");

    const rows = await sql`
      SELECT
        t.*,
        json_build_object('id', e.id, 'employee_code', e.employee_code, 'designation', e.designation, 'property_id', e.property_id) AS employee,
        json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) AS user
      FROM timesheets t
      LEFT JOIN employees e ON e.id = t.employee_id
      LEFT JOIN users u ON u.id = e.user_id
      WHERE 1=1
        ${employeeId  ? sql`AND t.employee_id = ${employeeId}` : sql``}
        ${dateFrom    ? sql`AND t.date >= ${dateFrom}::date` : sql``}
        ${dateTo      ? sql`AND t.date <= ${dateTo}::date` : sql``}
        ${status      ? sql`AND t.status = ${status}` : sql``}
        ${propertyId  ? sql`AND e.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND e.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
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

    if (!body.employee_id || !body.date) {
      return NextResponse.json({ error: "employee_id and date are required" }, { status: 400 });
    }

    const emp = await sql`SELECT property_id FROM employees WHERE id = ${body.employee_id} LIMIT 1`;
    if (emp.length > 0) {
      const accessErr = validateMutationPropertyAccess(req, (emp[0] as any).property_id);
      if (accessErr) return accessErr;
    }

    const rows = await sql`
      INSERT INTO timesheets (
        employee_id, date, clock_in, clock_out, total_hours, break_hours,
        project, task, notes, status
      ) VALUES (
        ${body.employee_id}, ${body.date}::date, ${body.clock_in ? new Date(body.clock_in).toISOString() : null}::timestamptz,
        ${body.clock_out ? new Date(body.clock_out).toISOString() : null}::timestamptz, ${body.total_hours || 0}, ${body.break_hours || 0},
        ${body.project || null}, ${body.task || null}, ${body.notes || null},
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

