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

    const rows = await sql`
      SELECT
        pr.*,
        json_build_object('id', pu.id, 'first_name', pu.first_name, 'last_name', pu.last_name) AS processed_by_user,
        json_build_object('id', au.id, 'first_name', au.first_name, 'last_name', au.last_name) AS approved_by_user
      FROM payroll_runs pr
      LEFT JOIN users pu ON pu.id = pr.processed_by
      LEFT JOIN users au ON au.id = pr.approved_by
      WHERE 1=1
        ${propertyId ? sql`AND pr.property_id = ${propertyId}` : scope.assignedPropertyIds.length > 0 ? sql`AND pr.property_id = ANY(${scope.assignedPropertyIds})` : sql``}
      ORDER BY pr.created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[hr/payroll GET]", error);
    return NextResponse.json({ error: "Failed to fetch payroll runs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getDb();
    const body = await req.json();

    const accessErr = validateMutationPropertyAccess(req, body.property_id);
    if (accessErr) return accessErr;

    const empRows = (await sql`
      SELECT e.id, e.base_salary
      FROM employees e
      WHERE e.is_active = true
    `) as Array<{ id: string; base_salary: string | number }>;

    if (empRows.length === 0) {
      return NextResponse.json({ error: "No active employees found" }, { status: 400 });
    }

    const prInsert = await sql`
      INSERT INTO payroll_runs (property_id, period_start, period_end, run_date, status, processed_by)
      VALUES (
        ${body.property_id}, ${body.period_start}::date, ${body.period_end}::date,
        CURRENT_DATE, 'draft', ${body.processed_by}
      )
      RETURNING id, period_start, period_end
    `;
    const payrollRun = prInsert[0] as { id: string; period_start: string; period_end: string };
    const periodStart = new Date(payrollRun.period_start);
    const periodEnd = new Date(payrollRun.period_end);
    const daysInPeriod = Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let totalGross = 0;
    let totalDeductions = 0;

    for (const emp of empRows as Array<{ id: string; base_salary: string | number }>) {
      const baseSalary = Number(emp.base_salary) || 0;
      const grossPay = Math.round((baseSalary * daysInPeriod / 365) * 100) / 100;
      const basic = grossPay * 0.5;
      const pfDeduction = Math.min(Math.round(basic * 0.12 * 100) / 100, 1800);
      const esiDeduction = grossPay <= 21000 ? Math.round(grossPay * 0.0075 * 100) / 100 : 0;
      const ptDeduction = 200;
      const tdsDeduction = grossPay >= 25000 ? Math.round(grossPay * 0.1 * 100) / 100 : 0;

      totalGross += grossPay;
      totalDeductions += pfDeduction + esiDeduction + ptDeduction + tdsDeduction;

      await sql`
        INSERT INTO payroll_lines (payroll_id, employee_id, gross_pay, pf_deduction, esi_deduction, pt_deduction, tds_deduction)
        VALUES (
          ${payrollRun.id}, ${emp.id}, ${grossPay}, ${pfDeduction},
          ${esiDeduction}, ${ptDeduction}, ${tdsDeduction}
        )
      `;
    }

    totalGross = Math.round(totalGross * 100) / 100;
    totalDeductions = Math.round(totalDeductions * 100) / 100;
    const totalNet = Math.round((totalGross - totalDeductions) * 100) / 100;

    const updated = await sql`
      UPDATE payroll_runs SET
        total_gross = ${totalGross},
        total_deductions = ${totalDeductions},
        total_net = ${totalNet}
      WHERE id = ${payrollRun.id}
      RETURNING *
    `;

    return NextResponse.json({ data: updated[0] }, { status: 201 });
  } catch (error) {
    console.error("[hr/payroll POST]", error);
    return NextResponse.json({ error: "Failed to create payroll run" }, { status: 500 });
  }
}
