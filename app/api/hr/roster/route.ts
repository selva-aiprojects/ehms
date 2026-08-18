import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess, validateMutationPropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const shiftId = searchParams.get("shift_id");

    const rows = await sql`
      SELECT
        e.id,
        e.employee_code,
        e.designation,
        e.department_id,
        e.property_id,
        e.shift_id,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'email', u.email,
          'phone', u.phone
        ) AS user,
        CASE WHEN s.id IS NOT NULL THEN
          json_build_object(
            'id', s.id,
            'name', s.name,
            'start_time', s.start_time,
            'end_time', s.end_time
          )
        ELSE null END AS shift
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN shift_rotations s ON s.id = e.shift_id
      WHERE (e.is_active = true OR e.is_active IS NULL)
        ${propertyId ? sql`AND e.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND e.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
        ${shiftId ? (shiftId === "unassigned" ? sql`AND e.shift_id IS NULL` : sql`AND e.shift_id = ${shiftId}`) : sql``}
      ORDER BY s.name ASC NULLS LAST, u.first_name ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/roster GET]", error);
    return NextResponse.json({ error: "Failed to fetch duty roster" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    if (body.employee_ids && Array.isArray(body.employee_ids)) {
      // Bulk assignment
      for (const empId of body.employee_ids) {
        const emp = await sql`SELECT property_id FROM employees WHERE id = ${empId} LIMIT 1`;
        if (emp[0] && (emp[0] as any).property_id) {
          const accessErr = validateMutationPropertyAccess(req, (emp[0] as any).property_id);
          if (accessErr) return accessErr;
        }
      }

      const rows = await sql`
        UPDATE employees
        SET shift_id = ${body.shift_id || null}
        WHERE id = ANY(${body.employee_ids})
        RETURNING id, employee_code, shift_id
      `;
      return NextResponse.json({ data: rows, success: true });
    } else if (body.employee_id) {
      // Single assignment
      const emp = await sql`SELECT property_id FROM employees WHERE id = ${body.employee_id} LIMIT 1`;
      if (emp[0] && (emp[0] as any).property_id) {
        const accessErr = validateMutationPropertyAccess(req, (emp[0] as any).property_id);
        if (accessErr) return accessErr;
      }

      const rows = await sql`
        UPDATE employees
        SET shift_id = ${body.shift_id || null}
        WHERE id = ${body.employee_id}
        RETURNING *
      `;
      if (!rows[0]) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      return NextResponse.json({ data: rows[0], success: true });
    }

    return NextResponse.json({ error: "employee_id or employee_ids required" }, { status: 400 });
  } catch (error) {
    console.error("[hr/roster PUT]", error);
    return NextResponse.json({ error: "Failed to update duty roster" }, { status: 500 });
  }
}
