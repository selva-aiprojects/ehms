import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const deptId = searchParams.get("department_id");
    const propertyId = searchParams.get("property_id");
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

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
        ${propertyId ? sql`AND e.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND e.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
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

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const countRows = await sql`SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code, 5) AS INTEGER)), 0) + 1 AS next_code FROM employees`;
    const nextCode = (countRows[0] as { next_code: number }).next_code;
    const employeeCode = `EMP-${String(nextCode).padStart(4, "0")}`;

    const rows = await sql`
      INSERT INTO employees (
        employee_code, user_id, department_id, designation, employment_type, doj,
        base_salary, bank_account, bank_ifsc, pan_number, uan_number, esi_number,
        reporting_manager_id, shift_id, band_id, property_id
      ) VALUES (
        ${employeeCode}, ${body.user_id}, ${body.department_id}, ${body.designation},
        ${body.employment_type}, ${body.doj}, ${body.base_salary}, ${body.bank_account},
        ${body.bank_ifsc}, ${body.pan_number}, ${body.uan_number}, ${body.esi_number},
        ${body.reporting_manager_id}, ${body.shift_id}, ${body.band_id}, ${body.property_id || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/employees POST]", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
