import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const content = readFileSync(ENV_PATH, "utf-8");
let dbUrl = "";

for (const line of content.split("\n")) {
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=")) {
    dbUrl = t.slice("DATABASE_URL=".length).replace(/['"]/g, "");
  }
}

const sql = neon(dbUrl);

async function runInSchema(queryFn) {
  const results = await sql.transaction([
    sql.query("SET search_path TO viswa, public"),
    queryFn(sql)
  ]);
  return results[1];
}

async function testReportQueries() {
  try {
    console.log("=== Testing Report Queries exactly as in API Routes ===");

    const asAtDate = new Date().toISOString().slice(0, 10);
    const fromDate = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const toDate = asAtDate;
    const propertyId = null;

    // 1. Trial Balance query
    console.log("Testing Trial Balance query...");
    const tb = await runInSchema((s) => s`
      SELECT ca.*,
        COALESCE((SELECT SUM(jl.debit) FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_id WHERE jl.account_id = ca.id AND je.is_posted = true AND je.entry_date <= ${asAtDate}::date ${propertyId ? s`AND je.property_id = ${propertyId}` : s``}), 0) as total_debits,
        COALESCE((SELECT SUM(jl.credit) FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_id WHERE jl.account_id = ca.id AND je.is_posted = true AND je.entry_date <= ${asAtDate}::date ${propertyId ? s`AND je.property_id = ${propertyId}` : s``}), 0) as total_credits
      FROM chart_of_accounts ca
      WHERE ca.is_active = true
      ORDER BY ca.account_code
    `);
    console.log("Trial Balance rows:", tb.length);

    // 2. P&L income accounts query
    console.log("Testing P&L Income query...");
    const income = await runInSchema((s) => s`
      SELECT ca.id, ca.account_code, ca.account_name, ca.account_type,
        COALESCE(SUM(jl.credit - jl.debit), 0) as amount
      FROM chart_of_accounts ca
      JOIN journal_lines jl ON jl.account_id = ca.id
      JOIN journal_entries je ON je.id = jl.journal_id AND je.is_posted = true
        AND je.entry_date >= ${fromDate}::date AND je.entry_date <= ${toDate}::date
      WHERE ca.account_type IN ('income', 'revenue')
        ${propertyId ? s`AND je.property_id = ${propertyId}` : s``}
      GROUP BY ca.id, ca.account_code, ca.account_name, ca.account_type
      HAVING COALESCE(SUM(jl.credit - jl.debit), 0) != 0
      ORDER BY ca.account_code
    `);
    console.log("P&L Income rows:", income.length);

    // 3. P&L expense accounts query
    console.log("Testing P&L Expense query...");
    const expense = await runInSchema((s) => s`
      SELECT ca.id, ca.account_code, ca.account_name, ca.account_type,
        COALESCE(SUM(jl.debit - jl.credit), 0) as amount
      FROM chart_of_accounts ca
      JOIN journal_lines jl ON jl.account_id = ca.id
      JOIN journal_entries je ON je.id = jl.journal_id AND je.is_posted = true
        AND je.entry_date >= ${fromDate}::date AND je.entry_date <= ${toDate}::date
      WHERE ca.account_type = 'expense'
        ${propertyId ? s`AND je.property_id = ${propertyId}` : s``}
      GROUP BY ca.id, ca.account_code, ca.account_name, ca.account_type
      HAVING COALESCE(SUM(jl.debit - jl.credit), 0) != 0
      ORDER BY ca.account_code
    `);
    console.log("P&L Expense rows:", expense.length);

    console.log("All report queries succeeded!");
  } catch (e) {
    console.error("Error executing report queries:", e);
  }
}

testReportQueries();
