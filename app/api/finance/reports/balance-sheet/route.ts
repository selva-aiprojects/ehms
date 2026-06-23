export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const asAtDate = searchParams.get("as_at_date") || new Date().toISOString().slice(0, 10);

    const assetAccounts = await sql`
      SELECT ca.id, ca.account_code, ca.account_name, ca.sub_type,
        ca.opening_balance +
        COALESCE((SELECT SUM(jl.debit - jl.credit) FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_id WHERE jl.account_id = ca.id AND je.is_posted = true AND je.entry_date <= ${asAtDate}::date ${propertyId ? sql`AND je.property_id = ${propertyId}` : sql``}), 0) as balance
      FROM chart_of_accounts ca
      WHERE ca.account_type = 'asset' AND ca.is_active = true
      ORDER BY ca.account_code`;

    const liabilityAccounts = await sql`
      SELECT ca.id, ca.account_code, ca.account_name, ca.sub_type,
        ca.opening_balance +
        COALESCE((SELECT SUM(jl.credit - jl.debit) FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_id WHERE jl.account_id = ca.id AND je.is_posted = true AND je.entry_date <= ${asAtDate}::date ${propertyId ? sql`AND je.property_id = ${propertyId}` : sql``}), 0) as balance
      FROM chart_of_accounts ca
      WHERE ca.account_type = 'liability' AND ca.is_active = true
      ORDER BY ca.account_code`;

    const equityAccounts = await sql`
      SELECT ca.id, ca.account_code, ca.account_name, ca.sub_type,
        ca.opening_balance +
        COALESCE((SELECT SUM(jl.credit - jl.debit) FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_id WHERE jl.account_id = ca.id AND je.is_posted = true AND je.entry_date <= ${asAtDate}::date ${propertyId ? sql`AND je.property_id = ${propertyId}` : sql``}), 0) as balance
      FROM chart_of_accounts ca
      WHERE ca.account_type = 'equity' AND ca.is_active = true
      ORDER BY ca.account_code`;

    const aList = assetAccounts as any[];
    const lList = liabilityAccounts as any[];
    const eList = equityAccounts as any[];
    const totalAssets = aList.reduce((s: number, r: any) => s + Number(r.balance), 0);
    const totalLiabilities = lList.reduce((s: number, r: any) => s + Number(r.balance), 0);
    const totalEquity = eList.reduce((s: number, r: any) => s + Number(r.balance), 0);

    return NextResponse.json({
      data: {
        as_at_date: asAtDate,
        assets: aList,
        liabilities: lList,
        equity: eList,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        total_equity: totalEquity,
        total_liabilities_equity: totalLiabilities + totalEquity,
      }
    });
  } catch (error) {
    console.error("[finance/reports/balance-sheet GET]", error);
    return NextResponse.json({ error: "Failed to generate balance sheet" }, { status: 500 });
  }
}
