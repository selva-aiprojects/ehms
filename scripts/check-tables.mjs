import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const url = envContent.split("\n").find(l => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();
const pool = new pg.Pool({ connectionString: url, max: 1 });
const c = await pool.connect();
await c.query("SET search_path TO viswa, public");

const tables = ["rent_invoices", "journal_entries", "journal_lines", "fiscal_years", "cost_centers", "budget_heads", "budget_entries", "vendor_bills", "bill_line_items", "bill_payments", "tax_filings", "leave_types", "leave_requests", "timesheets", "payroll_runs", "payroll_lines", "workplace_bookings", "audit_events", "maintenance_time_entries", "maintenance_approvals"];
for (const t of tables) {
  const cols = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position", [t]).catch(() => ({ rows: [] }));
  if (cols.rows.length > 0) {
    console.log(t + ":", cols.rows.map(r => r.column_name).join(", "));
  } else {
    console.log(t + ": NOT FOUND");
  }
}

c.release();
await pool.end();
