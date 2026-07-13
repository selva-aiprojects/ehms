import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
console.log("=== Final Verification of Viswa Group Demo Dataset ===");
for (const t of ['properties', 'units', 'guest_profiles', 'rate_plans', 'bookings', 'guest_feedbacks', 'lease_agreements', 'rent_invoices', 'housekeeping_tasks', 'linen_items', 'asset_register', 'maintenance_tickets', 'departments', 'employees', 'payroll_runs', 'chart_of_accounts', 'journal_entries', 'vendor_bills', 'users', 'user_roles']) {
  const count = await sql`SELECT count(*) as c FROM viswa.${sql.unsafe(t)}`;
  console.log(`${t.padEnd(22)} : ${count[0].c} rows`);
}
