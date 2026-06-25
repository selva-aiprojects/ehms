export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("account_id");
    const propertyId = searchParams.get("property_id");
    const fromDate = searchParams.get("from_date");
    const toDate = searchParams.get("to_date");

    if (!accountId) return NextResponse.json({ error: "account_id is required" }, { status: 400 });

    const account = (await sql`SELECT * FROM chart_of_accounts WHERE id = ${accountId}`) as Record<string, unknown>[];
    if (!account.length) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    let query = sql`
      SELECT jl.*, je.entry_date, je.description as journal_description, je.reference_type, je.reference_id
      FROM journal_lines jl
      JOIN journal_entries je ON je.id = jl.journal_id
      WHERE jl.account_id = ${accountId} AND je.is_posted = true`;
    if (fromDate) query = sql`${query} AND je.entry_date >= ${fromDate}::date`;
    if (toDate) query = sql`${query} AND je.entry_date <= ${toDate}::date`;
    if (propertyId) query = sql`${query} AND je.property_id = ${propertyId}`;
    query = sql`${query} ORDER BY je.entry_date ASC, je.posted_at ASC`;

    const lines = await query;

    const linesList = lines as any[];
    const acct = account[0] as Record<string, unknown>;
    let runningBalance = Number(acct.opening_balance || 0);
    const isDebitAccount = ["asset", "expense"].includes(acct.account_type as string);
    const entries = linesList.map((l: any) => {
      const debit = Number(l.debit);
      const credit = Number(l.credit);
      runningBalance += isDebitAccount ? debit - credit : credit - debit;
      return { ...l, running_balance: runningBalance };
    });

    return NextResponse.json({
      data: {
        account: acct,
        opening_balance: Number(acct.opening_balance || 0),
        entries,
        total_debits: linesList.reduce((s: number, l: any) => s + Number(l.debit), 0),
        total_credits: linesList.reduce((s: number, l: any) => s + Number(l.credit), 0),
        closing_balance: runningBalance,
      }
    });
  } catch (error) {
    console.error("[finance/ledger GET]", error);
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}
