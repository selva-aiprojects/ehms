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

async function enrichData() {
  try {
    console.log("=== Checking invoice_status enum and finishing enrichment ===");

    const enums = await sql.query(`
      SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'invoice_status'
    `);
    console.log("Invoice status enum values:", enums.map(e => e.enumlabel));

    // Let's see if we have overdue or draft or cancelled
    const sentInvoices = await sql.query("SELECT id FROM viswa.invoices WHERE status = 'sent' LIMIT 150");
    if (sentInvoices.length >= 100) {
      const overdueIds = sentInvoices.slice(0, 50).map(i => i.id);
      for (const id of overdueIds) {
        // Only update to overdue if overdue is in enum
        if (enums.some(e => e.enumlabel === 'overdue')) {
          await sql.query("UPDATE viswa.invoices SET status = 'overdue' WHERE id = $1", [id]);
        }
      }
      console.log("Updated invoice statuses to overdue where applicable.");
    }

    // Verify final budget and invoice numbers
    const finalBudget = await sql.query(`
      SELECT sum(budget_amount) as b_tot, sum(actual_amount) as a_tot FROM viswa.budget_entries
    `);
    console.log("Final Budget Totals:", finalBudget[0]);

    const finalAR = await sql.query(`
      SELECT status, count(*) as c, sum(COALESCE(balance_due, grand_total, 0)) as due
      FROM viswa.invoices
      WHERE status IN ('sent', 'pending', 'overdue', 'draft')
      GROUP BY status
    `);
    console.log("Final Outstanding AR Breakdown:", finalAR);

  } catch (e) {
    console.error("Error:", e);
  }
}

enrichData();
