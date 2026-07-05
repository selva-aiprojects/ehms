import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
envContent.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
});

const sql = neon(process.env.DATABASE_URL);

async function checkCols() {
  const tables = [
    "employees", "departments", "designations", "vendors", "vendor_services",
    "inventory_items", "inventory_categories", "warehouses", "maintenance_tickets",
    "amc_contracts", "preventive_schedules", "housekeeping_tasks", "deposit_ledger",
    "fixed_assets", "vendor_bills", "journal_entries", "budget_entries", "budget_heads", "fiscal_years"
  ];

  for (const tbl of tables) {
    const cols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'viswa' AND table_name = ${tbl}
      ORDER BY ordinal_position
    `;
    console.log(`\nTable: ${tbl} (${cols.length} cols)`);
    console.log(cols.map(c => `${c.column_name} (${c.data_type})`).join(", "));
  }
}

checkCols().catch(err => {
  console.error("Check failed:", err);
  process.exit(1);
});
