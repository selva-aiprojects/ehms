import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR = resolve(__dirname, "../database");
const ENV_PATH = resolve(__dirname, "../.env.local");

const TENANT_SCHEMA = "viswa";

function getEnvVar(name) {
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(name + "=")) {
      return trimmed.slice(name.length + 1);
    }
  }
  return "";
}

const DB_URL = getEnvVar("DATABASE_URL");
if (!DB_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(DB_URL);

function splitStatements(content) {
  const noComments = content.replace(/--.*$/gm, "").trim();
  return noComments
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

async function run() {
  // ── Step 1: Reset tenant schema (preserve public for extensions) ──
  console.log(`🧹 Dropping tenant schema "${TENANT_SCHEMA}" for clean rebuild...`);
  await sql.query(`DROP SCHEMA IF EXISTS ${TENANT_SCHEMA} CASCADE`);
  await sql.query(`CREATE SCHEMA ${TENANT_SCHEMA}`);
  console.log("  Done.");

  // ── Step 2: Ensure extensions exist in public ──
  console.log("🔧 Installing extensions in public schema...");
  await sql.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public`);
  await sql.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public`);
  console.log("  Done.");

  // ── Step 3: Set search_path to tenant schema ──
  await sql.query(`SET search_path TO ${TENANT_SCHEMA}, public`);
  console.log(`  Search path: ${TENANT_SCHEMA}, public`);

  // ── Step 4: Run SQL files in order (tables created in viswa schema) ──
  const SQL_FILES = [
    "001_core_schema.sql",
    "002_rbac_identity.sql",
    "003_guest_crm.sql",
    "004_reservation_booking.sql",
    "005_finance_gl.sql",
    "006_housekeeping.sql",
    "007_maintenance_asset.sql",
    "008_vendor_procurement.sql",
    "009_hrms_payroll.sql",
    "010_lease_tenancy.sql",
    "011_workplace.sql",
    "012_notification_integration.sql",
    "013_master_data_dictionaries.sql",
    "014_frontdesk_operations.sql",
    "015_fnb_module.sql",
    "016_system_settings.sql",
    "017_hrms_extensions.sql",
    "018_masters_and_policies.sql",
    "019_housekeeping_maintenance_workflows.sql",
    "020_admin_module.sql",
    "021_accounts_module.sql",
    "022_inventory_module.sql",
    "seed.sql",
  ];

  for (const file of SQL_FILES) {
    const filePath = join(DATABASE_DIR, file);
    if (!existsSync(filePath)) {
      console.warn(`⚠ Skipping — not found: ${file}`);
      continue;
    }
    const content = readFileSync(filePath, "utf-8");
    const statements = splitStatements(content);
    console.log(`▶ ${file} (${statements.length} statements)`);
    for (const stmt of statements) {
      try {
        // Re-assert search_path before each file in case a migration changes it
        await sql.query(`SET search_path TO ${TENANT_SCHEMA}, public; ${stmt};`);
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
        console.error(`  Statement: ${stmt.substring(0, 120)}...`);
        process.exit(1);
      }
    }
  }

  // ── Step 5: Run multi-tenant sharding migration ──
  console.log("▶ 023_multi_tenant_sharding.sql (post-migration)");
  const shardingPath = join(DATABASE_DIR, "023_multi_tenant_sharding.sql");
  if (existsSync(shardingPath)) {
    const shardingContent = readFileSync(shardingPath, "utf-8");
    const shardingStatements = splitStatements(shardingContent);
    for (const stmt of shardingStatements) {
      try {
        await sql.query(`SET search_path TO public; ${stmt};`);
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
        console.error(`  Statement: ${stmt.substring(0, 120)}...`);
        process.exit(1);
      }
    }
  }

  // ── Step 6: Run platform admins migration ──
  console.log("▶ 024_platform_admins.sql (public schema)");
  const platformPath = join(DATABASE_DIR, "024_platform_admins.sql");
  if (existsSync(platformPath)) {
    const platformContent = readFileSync(platformPath, "utf-8");
    const platformStatements = splitStatements(platformContent);
    for (const stmt of platformStatements) {
      try {
        await sql.query(`SET search_path TO public; ${stmt};`);
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
        process.exit(1);
      }
    }
    const adminCount = await sql.query("SELECT count(*) AS cnt FROM public.platform_admins");
    console.log(`  Platform admins: ${adminCount[0].cnt}`);
  }

  // ── Step 7: Verify ──
  console.log("\n✅ Migration complete. Verifying tables...");
  const tables = await sql.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = '${TENANT_SCHEMA}' ORDER BY table_name`
  );
  console.log(tables.map((t) => `  • ${t.table_name}`).join("\n"));
  console.log(`\nTotal tables in ${TENANT_SCHEMA}: ${tables.length}`);

  const tenants = await sql.query("SELECT count(*) AS cnt FROM public.tenants");
  console.log(`Tenants registered: ${tenants[0].cnt}`);

  const users = await sql.query(`SELECT count(*) AS cnt FROM ${TENANT_SCHEMA}.users`);
  console.log(`Users in ${TENANT_SCHEMA}: ${users[0].cnt}`);

  const roles = await sql.query(`SELECT count(*) AS cnt FROM ${TENANT_SCHEMA}.roles`);
  console.log(`Roles in ${TENANT_SCHEMA}: ${roles[0].cnt}`);

  const mappings = await sql.query(
    `SELECT u.email, r.name AS role_name FROM ${TENANT_SCHEMA}.user_roles ur JOIN ${TENANT_SCHEMA}.users u ON u.id = ur.user_id JOIN ${TENANT_SCHEMA}.roles r ON r.id = ur.role_id ORDER BY u.email`
  );
  console.log("\nUser → Role mappings:");
  mappings.forEach(r => console.log(`  ${r.email} → ${r.role_name}`));
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
