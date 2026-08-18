import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

async function checkMore() {
  const tables = ['payslips', 'payroll_lines', 'bill_payments', 'depreciation_schedule', 'budget_heads', 'budget_entries', 'lease_agreements', 'rent_invoices', 'tenant_deposits', 'guest_feedbacks', 'timesheets'];
  for (const t of tables) {
    const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='viswa' AND table_name=${t} ORDER BY ordinal_position`;
    console.log(`\n--- ${t} (${cols.length} cols) ---`);
    console.log(cols.map(c => `${c.column_name} (${c.data_type})`).join(", "));
  }
}

checkMore().catch(console.error);
