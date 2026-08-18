import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;

    const runRows = await sql`
      SELECT pr.*,
        json_build_object('id', pu.id, 'first_name', pu.first_name, 'last_name', pu.last_name) AS processed_by_user,
        json_build_object('id', au.id, 'first_name', au.first_name, 'last_name', au.last_name) AS approved_by_user
      FROM payroll_runs pr
      LEFT JOIN users pu ON pu.id = pr.processed_by
      LEFT JOIN users au ON au.id = pr.approved_by
      WHERE pr.id = ${id}
      LIMIT 1
    `;

    if (!runRows[0]) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });

    const lines = await sql`
      SELECT pl.*,
        json_build_object('id', e.id, 'employee_code', e.employee_code, 'designation', e.designation) AS employee,
        json_build_object('id', d.id, 'name', d.name) AS department
      FROM payroll_lines pl
      LEFT JOIN employees e ON e.id = pl.employee_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE pl.payroll_id = ${id}
      ORDER BY e.employee_code
    `;

    return NextResponse.json({ data: { ...runRows[0], lines } });
  } catch (error) {
    console.error("[hr/payroll GET]", error);
    return NextResponse.json({ error: "Failed to fetch payroll run" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sql = getDb();
    const { id } = await params;
    const body = await req.json();

    const current = await sql`SELECT id, status FROM payroll_runs WHERE id = ${id}`;
    if (!current[0]) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });

    const curStatus = (current[0] as { status: string }).status;
    const nextStatus = body.status;

    const validTransitions: Record<string, string[]> = {
      draft: ["computed"],
      computed: ["approved"],
      approved: ["paid"],
    };

    if (nextStatus && !(validTransitions[curStatus] || []).includes(nextStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from '${curStatus}' to '${nextStatus}'` },
        { status: 400 }
      );
    }

    const rows = await sql`
      UPDATE payroll_runs SET
        status      = COALESCE(${nextStatus}, status),
        approved_by = CASE WHEN ${nextStatus} = 'approved' THEN ${body.approved_by} ELSE approved_by END
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("[hr/payroll PUT]", error);
    return NextResponse.json({ error: "Failed to update payroll run" }, { status: 500 });
  }
}
