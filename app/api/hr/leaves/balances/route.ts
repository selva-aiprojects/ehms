import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const userId = req.headers.get("x-user-id");
    const employeeId = req.nextUrl.searchParams.get("employee_id");

    let targetEmployeeId = employeeId;
    if (!targetEmployeeId && userId) {
      let empQuery = `SELECT id, property_id FROM employees WHERE user_id = $1 LIMIT 1`;
      const empParams: unknown[] = [userId];
      if (scope.assignedPropertyIds.length > 0) {
        empParams.push(scope.assignedPropertyIds);
        empQuery = `SELECT id, property_id FROM employees WHERE user_id = $1 AND property_id = ANY($2) LIMIT 1`;
      }
      const empRows = await sql.query(empQuery, empParams);
      targetEmployeeId = empRows[0]?.id || null;
    }

    if (!targetEmployeeId) {
      return NextResponse.json({ data: [] });
    }

    const rows = await sql.query(
      `
      SELECT
        lb.id,
        lb.period_year,
        lb.total_allocated AS allocated,
        lb.used,
        lb.pending,
        lb.remaining,
        json_build_object('id', lt.id, 'name', lt.name, 'code', lt.code) AS leave_type
      FROM leave_balances lb
      JOIN leave_types lt ON lt.id = lb.leave_type_id
      WHERE lb.employee_id = $1
      ORDER BY lt.name
      `,
      [targetEmployeeId]
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/leaves/balances GET]", error);
    return NextResponse.json({ error: "Failed to fetch leave balances" }, { status: 500 });
  }
}
