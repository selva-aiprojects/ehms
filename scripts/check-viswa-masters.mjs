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

async function checkMasters() {
  const setPathSQL = `SET search_path TO viswa, public`;
  
  const users = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, email, first_name, last_name FROM users LIMIT 10")
  ]);
  console.log("Users:", users[1]);

  const depts = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, name, code, property_id FROM departments WHERE name IN ('Housekeeping', 'Maintenance', 'Human Resources', 'Finance', 'Front Desk', 'Security') LIMIT 15")
  ]);
  console.log("Departments:", depts[1]);

  const cats = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, name FROM inventory_categories")
  ]);
  console.log("Inventory Categories:", cats[1]);

  const whs = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, name, code, property_id FROM warehouses")
  ]);
  console.log("Warehouses:", whs[1]);

  const accounts = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, account_code, account_name, account_type FROM chart_of_accounts LIMIT 10")
  ]);
  console.log("Chart of Accounts:", accounts[1]);

  const units = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, unit_label, status FROM units WHERE floor_id IN (SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE b.property_id = 'dbef5ad0-5ac3-42a9-b5da-94175977c78e') LIMIT 15")
  ]);
  console.log("Units for Viswa Residency:", units[1]);

  const leases = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, lease_number, tenant_name, start_date, end_date, rent_amount, status FROM lease_agreements WHERE property_id = 'dbef5ad0-5ac3-42a9-b5da-94175977c78e' LIMIT 10")
  ]);
  console.log("Lease Agreements:", leases[1]);
}

checkMasters().catch(err => {
  console.error("Check failed:", err);
  process.exit(1);
});
