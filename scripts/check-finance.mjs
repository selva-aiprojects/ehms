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

async function checkFinance() {
  try {
    const res = await sql`
      SELECT 
        (SELECT count(*) FROM viswa.chart_of_accounts) as chart_of_accounts,
        (SELECT count(*) FROM viswa.journal_entries) as journal_entries,
        (SELECT count(*) FROM viswa.journal_lines) as journal_lines,
        (SELECT count(*) FROM viswa.vendor_bills) as vendor_bills,
        (SELECT count(*) FROM viswa.bill_payments) as bill_payments,
        (SELECT count(*) FROM viswa.budget_entries) as budget_entries,
        (SELECT count(*) FROM viswa.budget_heads) as budget_heads,
        (SELECT count(*) FROM viswa.tax_filings) as tax_filings,
        (SELECT count(*) FROM viswa.fixed_assets) as fixed_assets,
        (SELECT count(*) FROM viswa.asset_register) as asset_register,
        (SELECT count(*) FROM viswa.invoices) as invoices,
        (SELECT count(*) FROM viswa.payments) as payments,
        (SELECT count(*) FROM viswa.bank_reconciliation) as bank_reconciliation
    `;
    console.log("=== Finance Tables Row Counts in VISWA schema ===");
    console.log(JSON.stringify(res[0], null, 2));

    const totals = await sql`
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM viswa.payments WHERE status = 'completed') as total_payments,
        (SELECT COALESCE(SUM(grand_total), 0) FROM viswa.vendor_bills) as total_vendor_bills,
        (SELECT COALESCE(SUM(amount), 0) FROM viswa.budget_entries) as total_budget,
        (SELECT COALESCE(SUM(tax_amount), 0) FROM viswa.tax_filings) as total_tax,
        (SELECT COALESCE(SUM(purchase_price), 0) FROM viswa.fixed_assets) as total_assets
    `;
    console.log("\n=== Finance Tables Totals (in ₹) ===");
    console.log(JSON.stringify(totals[0], null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

checkFinance();
