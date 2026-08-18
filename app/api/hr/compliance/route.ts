import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest) {
  try {
    const sql = getDb();

    const rows = await sql`
      SELECT
        COUNT(DISTINCT pl.employee_id)::int AS employee_count,
        COALESCE(SUM(pl.gross_pay), 0) AS total_gross,
        COALESCE(SUM(pl.pf_deduction), 0) AS total_pf,
        COALESCE(SUM(pl.esi_deduction), 0) AS total_esi,
        COALESCE(SUM(pl.pt_deduction), 0) AS total_pt,
        COALESCE(SUM(pl.tds_deduction), 0) AS total_tds,
        COALESCE(SUM(pl.net_pay), 0) AS total_net
      FROM payroll_lines pl
      JOIN payroll_runs pr ON pr.id = pl.payroll_id
      WHERE pr.period_start >= date_trunc('month', CURRENT_DATE)
        AND pr.period_start < date_trunc('month', CURRENT_DATE) + interval '1 month'
    `;

    const stats = rows[0] as {
      employee_count: number;
      total_gross: number;
      total_pf: number;
      total_esi: number;
      total_pt: number;
      total_tds: number;
      total_net: number;
    };

    const totalDeductions =
      Number(stats.total_pf) +
      Number(stats.total_esi) +
      Number(stats.total_pt) +
      Number(stats.total_tds);

    const compliance = {
      month: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
      employee_count: Number(stats.employee_count),
      total_gross: Number(stats.total_gross),
      total_deductions: totalDeductions,
      total_net: Number(stats.total_net),
      contributions: {
        pf: { amount: Number(stats.total_pf), rate: "12% (max 1,800/month)" },
        esi: { amount: Number(stats.total_esi), rate: "0.75% (gross <= 21,000)" },
        pt: { amount: Number(stats.total_pt), rate: "200/month (default)" },
        tds: { amount: Number(stats.total_tds), rate: "10% (gross >= 25,000)" },
      },
    };

    return NextResponse.json({ data: compliance });
  } catch (error) {
    console.error("[hr/compliance GET]", error);
    return NextResponse.json({ error: "Failed to fetch compliance data" }, { status: 500 });
  }
}
