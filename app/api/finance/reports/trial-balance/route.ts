export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("property_id");
    const asAtDate = searchParams.get("as_at_date") || new Date().toISOString().slice(0, 10);

    const accounts = await sql`
      SELECT ca.*,
        COALESCE((SELECT SUM(jl.debit) FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_id WHERE jl.account_id = ca.id AND je.is_posted = true AND je.entry_date <= ${asAtDate}::date ${propertyId ? sql`AND je.property_id = ${propertyId}` : sql``}), 0) as total_debits,
        COALESCE((SELECT SUM(jl.credit) FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_id WHERE jl.account_id = ca.id AND je.is_posted = true AND je.entry_date <= ${asAtDate}::date ${propertyId ? sql`AND je.property_id = ${propertyId}` : sql``}), 0) as total_credits
      FROM chart_of_accounts ca
      WHERE ca.is_active = true
      ORDER BY ca.account_code`;

    const accountList = accounts as any[];
    const rows: any[] = [];
    let totalDr = 0, totalCr = 0;

    for (const a of accountList) {
      const opening = Number(a.opening_balance || 0);
      const dr = Number(a.total_debits);
      const cr = Number(a.total_credits);
      const isDr = ["asset", "expense"].includes(a.account_type);
      const balance = opening + (isDr ? dr - cr : cr - dr);
      rows.push({
        account_id: a.id,
        account_code: a.account_code,
        account_name: a.account_name,
        account_type: a.account_type,
        opening_balance: opening,
        debit: dr,
        credit: cr,
        balance: Math.abs(balance),
        balance_type: balance >= 0 ? (isDr ? "Dr" : "Cr") : (isDr ? "Cr" : "Dr"),
      });
      totalDr += dr;
      totalCr += cr;
    }

    return NextResponse.json({
      data: { rows, as_at_date: asAtDate, total_debits: totalDr, total_credits: totalCr, in_balance: totalDr === totalCr }
    });
  } catch (error) {
    console.error("[finance/reports/trial-balance GET]", error);
    return NextResponse.json({ error: "Failed to generate trial balance" }, { status: 500 });
  }
}
