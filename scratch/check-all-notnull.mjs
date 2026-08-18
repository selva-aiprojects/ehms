import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
for (const t of ['departments', 'employees', 'payroll_runs', 'payroll_lines', 'chart_of_accounts', 'journal_entries', 'journal_lines', 'vendors', 'vendor_bills', 'bill_payments']) {
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='viswa' AND table_name=${t} AND is_nullable='NO' AND is_generated='NEVER'`;
  console.log(`${t} NOT NULL cols:`, cols.map(c => c.column_name).join(', '));
}
