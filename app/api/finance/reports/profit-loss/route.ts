export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const fromDate = searchParams.get("from_date") || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const toDate = searchParams.get("to_date") || new Date().toISOString().slice(0, 10);

    const incomeAccounts = await sql`
      SELECT ca.id, ca.account_code, ca.account_name, ca.account_type,
        COALESCE(SUM(jl.credit - jl.debit), 0) as amount
      FROM chart_of_accounts ca
      JOIN journal_lines jl ON jl.account_id = ca.id
      JOIN journal_entries je ON je.id = jl.journal_id AND je.is_posted = true
        AND je.entry_date >= ${fromDate}::date AND je.entry_date <= ${toDate}::date
      WHERE ca.account_type IN ('income', 'revenue')
        ${propertyId ? sql`AND je.property_id = ${propertyId}` : sql``}
      GROUP BY ca.id, ca.account_code, ca.account_name, ca.account_type
      HAVING COALESCE(SUM(jl.credit - jl.debit), 0) != 0
      ORDER BY ca.account_code`;

    const expenseAccounts = await sql`
      SELECT ca.id, ca.account_code, ca.account_name, ca.account_type,
        COALESCE(SUM(jl.debit - jl.credit), 0) as amount
      FROM chart_of_accounts ca
      JOIN journal_lines jl ON jl.account_id = ca.id
      JOIN journal_entries je ON je.id = jl.journal_id AND je.is_posted = true
        AND je.entry_date >= ${fromDate}::date AND je.entry_date <= ${toDate}::date
      WHERE ca.account_type = 'expense'
        ${propertyId ? sql`AND je.property_id = ${propertyId}` : sql``}
      GROUP BY ca.id, ca.account_code, ca.account_name, ca.account_type
      HAVING COALESCE(SUM(jl.debit - jl.credit), 0) != 0
      ORDER BY ca.account_code`;

    const incomeList = incomeAccounts as any[];
    const expenseList = expenseAccounts as any[];
    const totalIncome = incomeList.reduce((s: number, r: any) => s + Number(r.amount), 0);
    const totalExpenses = expenseList.reduce((s: number, r: any) => s + Number(r.amount), 0);
    const netProfit = totalIncome - totalExpenses;

    return NextResponse.json({
      data: {
        from_date: fromDate,
        to_date: toDate,
        income: incomeList,
        expenses: expenseList,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        profit_margin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : "0",
      }
    });
  } catch (error) {
    console.error("[finance/reports/profit-loss GET]", error);
    return NextResponse.json({ error: "Failed to generate P&L" }, { status: 500 });
  }
}
