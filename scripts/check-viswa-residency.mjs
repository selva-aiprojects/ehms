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

async function checkResidency() {
  const setPathSQL = `SET search_path TO viswa, public`;
  
  const props = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, name, code, vertical_type, is_active FROM properties WHERE vertical_type = 'rental_apartment'")
  ]);
  console.log("Viswa Residency Property:", props[1]);
  
  const propId = props[1][0]?.id;
  if (!propId) {
    console.log("No residency property found!");
    return;
  }

  const counts = await sql.transaction([
    sql.query(setPathSQL),
    sql.query(`
      SELECT 'buildings' as table_name, count(*)::int as count FROM buildings WHERE property_id = $1
      UNION ALL
      SELECT 'floors', count(*)::int FROM floors WHERE building_id IN (SELECT id FROM buildings WHERE property_id = $1)
      UNION ALL
      SELECT 'units', count(*)::int FROM units WHERE floor_id IN (SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE b.property_id = $1)
      UNION ALL
      SELECT 'lease_agreements', count(*)::int FROM lease_agreements WHERE property_id = $1
      UNION ALL
      SELECT 'rent_invoices', count(*)::int FROM rent_invoices WHERE lease_id IN (SELECT id FROM lease_agreements WHERE property_id = $1)
      UNION ALL
      SELECT 'deposit_ledger', count(*)::int FROM deposit_ledger WHERE lease_id IN (SELECT id FROM lease_agreements WHERE property_id = $1)
      UNION ALL
      SELECT 'housekeeping_tasks', count(*)::int FROM housekeeping_tasks WHERE property_id = $1
      UNION ALL
      SELECT 'maintenance_tickets', count(*)::int FROM maintenance_tickets WHERE property_id = $1
      UNION ALL
      SELECT 'employees', count(*)::int FROM employees WHERE property_id = $1
      UNION ALL
      SELECT 'vendors', count(*)::int FROM vendors WHERE property_id = $1
    `, [propId])
  ]);
  console.log("Data counts for Viswa Residency:", counts[1]);

  const units = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, unit_number, unit_type, status, rental_price FROM units WHERE floor_id IN (SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE b.property_id = $1) LIMIT 10", [propId])
  ]);
  console.log("\nSample units:", units[1]);

  const leases = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, lease_number, tenant_name, start_date, end_date, rent_amount, status FROM lease_agreements WHERE property_id = $1 LIMIT 10", [propId])
  ]);
  console.log("\nSample leases:", leases[1]);
}

checkResidency().catch(err => {
  console.error("Check failed:", err);
  process.exit(1);
});
