import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validatePropertyAccess } from "@/lib/property-scope";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const scope = await validatePropertyAccess(req);
    if (scope.error) return scope.error;

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const departmentId = searchParams.get("department_id");
    const roleName = searchParams.get("role_name");
    const targetDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const targetTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS

    const rows = await sql`
      SELECT
        e.id,
        e.employee_code,
        e.designation,
        e.department_id,
        e.property_id,
        e.shift_id,
        e.status AS employment_status,
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
        ELSE null END AS shift,
        (
          SELECT json_build_object(
            'id', t.id,
            'clock_in', t.clock_in,
            'clock_out', t.clock_out,
            'status', t.status
          )
          FROM timesheets t
          WHERE t.employee_id = e.id AND t.date = ${targetDate}::date
          ORDER BY t.created_at DESC LIMIT 1
        ) AS today_timesheet,
        EXISTS (
          SELECT 1 FROM leave_requests lr
          WHERE lr.employee_id = e.id
            AND lr.status = 'approved'
            AND ${targetDate}::date BETWEEN lr.from_date AND lr.to_date
        ) AS on_leave
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN shift_rotations s ON s.id = e.shift_id
      WHERE COALESCE(e.status, 'active') = 'active'
        ${propertyId ? sql`AND e.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND e.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
        ${departmentId ? sql`AND e.department_id = ${departmentId}` : sql``}
      ORDER BY u.first_name ASC, e.employee_code ASC
    `;

    const enriched = rows.map((emp: any) => {
      let status = "off_duty";
      let badge = { text: "Off Duty", color: "gray" };

      if (emp.on_leave) {
        status = "on_leave";
        badge = { text: "On Leave Today", color: "red" };
      } else if (emp.today_timesheet && emp.today_timesheet.clock_in && !emp.today_timesheet.clock_out) {
        status = "clocked_in";
        badge = { text: "Clocked In", color: "teal" };
      } else if (emp.shift) {
        const start = emp.shift.start_time;
        const end = emp.shift.end_time;
        if (start && end && targetTime >= start && targetTime <= end) {
          status = "on_duty";
          badge = { text: "On Shift (Active)", color: "amber" };
        } else {
          status = "shift_assigned";
          badge = { text: `${emp.shift.name || "Assigned Shift"}`, color: "blue" };
        }
      }

      return {
        ...emp,
        availability_status: status,
        availability_badge: badge,
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error("[hr/staff-availability GET]", error);
    return NextResponse.json({ error: "Failed to check staff availability" }, { status: 500 });
  }
}
