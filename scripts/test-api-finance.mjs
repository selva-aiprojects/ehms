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

async function testAll() {
  try {
    console.log("=== Testing all finance queries in viswa schema ===");

    const inv = await sql.query("SELECT * FROM viswa.invoices ORDER BY created_at DESC LIMIT 100");
    const pay = await sql.query("SELECT amount, payment_date, payment_method FROM viswa.payments WHERE status = 'completed'");
    const ar = await sql.query("SELECT COALESCE(sum(COALESCE(balance_due, grand_total, 0)), 0) as total_due FROM viswa.invoices WHERE status IN ('sent', 'overdue')");
    const vb = await sql.query("SELECT * FROM viswa.vendor_bills ORDER BY bill_date DESC LIMIT 50");
    const bg = await sql.query("SELECT b.*, h.name as head_name, h.code as head_code FROM viswa.budget_entries b LEFT JOIN viswa.budget_heads h ON h.id = b.budget_head_id ORDER BY b.period_month ASC");
    const tax = await sql.query("SELECT * FROM viswa.tax_filings ORDER BY period_end DESC");

    console.log("Invoices count:", inv.length);
    console.log("Payments count:", pay.length);
    console.log("Outstanding AR:", ar[0].total_due);
    console.log("Vendor Bills count:", vb.length);
    console.log("Budget Entries count:", bg.length);
    console.log("Tax Filings count:", tax.length);

    const totalRev = pay.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalVb = vb.reduce((s, b) => s + Number(b.grand_total || 0), 0);
    const paidVb = vb.reduce((s, b) => s + Number(b.paid_total || b.grand_total || 0), 0);
    const totBudget = bg.reduce((s, b) => s + Number(b.budget_amount || 0), 0);
    const totActual = bg.reduce((s, b) => s + Number(b.actual_amount || 0), 0);

    console.log("Total Revenue:", totalRev);
    console.log("Total Vendor Bills:", totalVb, "Paid Vendor Bills:", paidVb);
    console.log("Total Budget:", totBudget, "Total Actual:", totActual);

  } catch (e) {
    console.error("Error:", e);
  }
}

testAll();
