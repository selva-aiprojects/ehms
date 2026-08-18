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

async function checkFull() {
  const setPathSQL = `SET search_path TO viswa, public`;
  
  const props = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, name, code, vertical_type, is_active FROM properties WHERE vertical_type = 'rental_apartment'")
  ]);
  const propId = props[1][0]?.id;
  console.log("Viswa Residency ID:", propId);

  const tablesWithPropId = [
    "buildings", "floors", "units", "lease_agreements", "housekeeping_tasks",
    "maintenance_tickets", "preventive_schedules", "amc_contracts", "inventory_items",
    "vendors", "purchase_orders", "employees", "payroll_runs", "accounts",
    "journal_entries", "vendor_bills", "fixed_assets", "budget_entries", "visitors"
  ];

  for (const tbl of tablesWithPropId) {
    try {
      const res = await sql.transaction([
        sql.query(setPathSQL),
        sql.query(`SELECT count(*)::int as count FROM ${tbl} WHERE property_id = $1`, [propId])
      ]);
      console.log(`  ${tbl}: ${res[1][0].count}`);
    } catch (e) {
      console.log(`  ${tbl}: (error or no property_id column)`);
    }
  }

  // Check deposit_ledger via lease_agreements
  try {
    const res = await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`SELECT count(*)::int as count FROM deposit_ledger WHERE lease_id IN (SELECT id FROM lease_agreements WHERE property_id = $1)`, [propId])
    ]);
    console.log(`  deposit_ledger: ${res[1][0].count}`);
  } catch (e) {
    console.log(`  deposit_ledger: error`);
  }

  // Check rent_invoices via lease_agreements
  try {
    const res = await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`SELECT count(*)::int as count FROM rent_invoices WHERE lease_id IN (SELECT id FROM lease_agreements WHERE property_id = $1)`, [propId])
    ]);
    console.log(`  rent_invoices: ${res[1][0].count}`);
  } catch (e) {
    console.log(`  rent_invoices: error`);
  }
}

checkFull().catch(err => {
  console.error("Check failed:", err);
  process.exit(1);
});
