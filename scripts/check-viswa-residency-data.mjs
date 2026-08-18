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

async function checkData() {
  console.log("=== CHECKING TENANTS REGISTRY ===");
  const tenants = await sql`SELECT id, name, code, schema_name, is_active FROM public.tenants`;
  console.log("Tenants:", tenants);

  console.log("\n=== CHECKING VISWA RESIDENCY DATA ===");
  const setPathSQL = `SET search_path TO viswa, public`;
  
  const props = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, name, code, vertical_type, is_active FROM properties WHERE name LIKE '%RESIDENCY%' OR vertical_type = 'rental_apartment'")
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
      SELECT 'leases', count(*)::int FROM leases WHERE property_id = $1
      UNION ALL
      SELECT 'rent_invoices', count(*)::int FROM rent_invoices WHERE lease_id IN (SELECT id FROM leases WHERE property_id = $1)
      UNION ALL
      SELECT 'security_deposits', count(*)::int FROM security_deposits WHERE lease_id IN (SELECT id FROM leases WHERE property_id = $1)
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
}

checkData().catch(err => {
  console.error("Check failed:", err);
  process.exit(1);
});
