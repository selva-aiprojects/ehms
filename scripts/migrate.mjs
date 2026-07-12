/**
 * migrate.mjs — Database Reset & Rebuild Runner using pg (TCP connection)
 * Usage: node scripts/migrate.mjs
 *
 * Rebuilds the tenant schema from scratch and applies all DDL migrations cleanly.
 */
import pg from "pg";
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
      return trimmed.slice(name.length + 1).trim();
    }
  }
  return "";
}

const DB_URL = getEnvVar("DATABASE_URL");
if (!DB_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DB_URL, max: 1 });

function splitStatements(content) {
  const noComments = content.replace(/--.*$/gm, "").trim();
  const statements = [];
  let current = "";
  let inDollar = false;
  let dollarTag = "";
  let inSingleQuote = false;

  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    const next = noComments[i + 1] || "";

    if (ch === "'" && (i === 0 || noComments[i - 1] !== "\\")) {
      if (!inDollar) inSingleQuote = !inSingleQuote;
    }

    if (!inSingleQuote && !inDollar && ch === "$" && next === "$") {
      inDollar = true;
      dollarTag = "$$";
      current += ch + next;
      i++;
      continue;
    }

    if (!inSingleQuote && !inDollar && ch === "$") {
      let j = i + 1;
      while (j < noComments.length && /[a-zA-Z0-9_]/.test(noComments[j])) j++;
      if (j < noComments.length && noComments[j] === "$") {
        inDollar = true;
        dollarTag = noComments.slice(i, j + 1);
        current += dollarTag;
        i = j;
        continue;
      }
    }

    if (inDollar && noComments.startsWith(dollarTag, i)) {
      const endLen = dollarTag.length;
      current += dollarTag;
      i += endLen - 1;
      inDollar = false;
      dollarTag = "";
      continue;
    }

    if (!inDollar && !inSingleQuote && ch === ";") {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      continue;
    }

    current += ch;
  }

  const remaining = current.trim();
  if (remaining) statements.push(remaining);
  return statements;
}

async function run() {
  console.log("🚀 Starting eHMS Migration Runner...");
  const client = await pool.connect();
  try {
    // ── Step 0: Clean up leftover objects from public schema ──
    console.log("🧹 Cleaning public schema of leftover eHMS objects...");
    const oldTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('tenants', 'platform_admins')
    `);
    for (const row of oldTables.rows) {
      await client.query(`DROP TABLE IF EXISTS public.${row.table_name} CASCADE`);
    }

    const oldTypes = await client.query(`
      SELECT t.typname FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    `);
    for (const row of oldTypes.rows) {
      await client.query(`DROP TYPE IF EXISTS public.${row.typname} CASCADE`);
    }

    const oldSeqs = await client.query(`
      SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    `);
    for (const row of oldSeqs.rows) {
      await client.query(`DROP SEQUENCE IF EXISTS public.${row.sequence_name}`);
    }
    console.log("  Done.");

    // ── Step 1: Reset tenant schema ──
    console.log(`🧹 Dropping tenant schema "${TENANT_SCHEMA}" for clean rebuild...`);
    await client.query(`DROP SCHEMA IF EXISTS ${TENANT_SCHEMA} CASCADE`);
    await client.query(`CREATE SCHEMA ${TENANT_SCHEMA}`);
    console.log("  Done.");

    // ── Step 2: Ensure extensions exist in public ──
    console.log("🔧 Installing extensions in public schema...");
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public`);
    console.log("  Done.");

    // ── Step 3: Set search_path to tenant schema ──
    await client.query(`SET search_path TO ${TENANT_SCHEMA}, public`);
    console.log(`  Search path: ${TENANT_SCHEMA}, public`);

    // ── Step 4: Run SQL files in order ──
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
      "013-frontdesk-features.sql",
      "013_master_data_dictionaries.sql",
      "014-f-and-b-workflow.sql",
      "014_frontdesk_operations.sql",
      "015-guest-feedback.sql",
      "015_fnb_module.sql",
      "016_system_settings.sql",
      "017_hrms_extensions.sql",
      "018_masters_and_policies.sql",
      "019_housekeeping_maintenance_workflows.sql",
      "020_admin_module.sql",
      "021_accounts_module.sql",
      "022_inventory_module.sql",
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
          await client.query(stmt + ";");
        } catch (err) {
          console.error(`  ✗ Error in ${file}: ${err.message}`);
          console.error(`  Statement: ${stmt.substring(0, 120)}...`);
          throw err;
        }
      }
    }

    // ── Step 5: Run multi-tenant sharding migration ──
    console.log("▶ 023_multi_tenant_sharding.sql (public schema)");
    const shardingPath = join(DATABASE_DIR, "023_multi_tenant_sharding.sql");
    if (existsSync(shardingPath)) {
      await client.query(`SET search_path TO public`);
      const shardingStatements = splitStatements(readFileSync(shardingPath, "utf-8"));
      for (const stmt of shardingStatements) {
        await client.query(stmt + ";");
      }
    }

    // ── Step 6: Run platform admins migration ──
    console.log("▶ 024_platform_admins.sql (public schema)");
    const platformPath = join(DATABASE_DIR, "024_platform_admins.sql");
    if (existsSync(platformPath)) {
      await client.query(`SET search_path TO public`);
      const platformStatements = splitStatements(readFileSync(platformPath, "utf-8"));
      for (const stmt of platformStatements) {
        await client.query(stmt + ";");
      }
      const adminCount = await client.query("SELECT count(*) AS cnt FROM public.platform_admins");
      console.log(`  Platform admins: ${adminCount.rows[0].cnt}`);
    }

    // ── Step 7: Run property config features migration ──
    console.log(`▶ 025_property_config_features.sql (${TENANT_SCHEMA})`);
    const propConfigPath = join(DATABASE_DIR, "025_property_config_features.sql");
    if (existsSync(propConfigPath)) {
      await client.query(`SET search_path TO ${TENANT_SCHEMA}, public`);
      const statements = splitStatements(readFileSync(propConfigPath, "utf-8"));
      for (const stmt of statements) {
        await client.query(stmt + ";");
      }
    }

    // ── Step 8: Run ticketing system migration ──
    console.log("▶ 026_ticketing_system.sql (public schema)");
    const ticketPath = join(DATABASE_DIR, "026_ticketing_system.sql");
    if (existsSync(ticketPath)) {
      await client.query(`SET search_path TO public`);
      const statements = splitStatements(readFileSync(ticketPath, "utf-8"));
      for (const stmt of statements) {
        await client.query(stmt + ";");
      }
    }

    // ── Step 9: Run platform broadcasts migration ──
    console.log("▶ 027_platform_broadcasts.sql (public schema)");
    const broadcastPath = join(DATABASE_DIR, "027_platform_broadcasts.sql");
    if (existsSync(broadcastPath)) {
      await client.query(`SET search_path TO public`);
      const statements = splitStatements(readFileSync(broadcastPath, "utf-8"));
      for (const stmt of statements) {
        await client.query(stmt + ";");
      }
    }

    // ── Step 9.5: Run flat & room hierarchy migration ──
    console.log(`▶ 028_flat_room_hierarchy.sql (${TENANT_SCHEMA})`);
    const hierarchyPath = join(DATABASE_DIR, "028_flat_room_hierarchy.sql");
    if (existsSync(hierarchyPath)) {
      await client.query(`SET search_path TO ${TENANT_SCHEMA}, public`);
      const statements = splitStatements(readFileSync(hierarchyPath, "utf-8"));
      for (const stmt of statements) {
        await client.query(stmt + ";");
      }
    }

    // ── Step 10: Verify ──
    console.log("\n✅ Migration complete! Verifying tables...");
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = '${TENANT_SCHEMA}' ORDER BY table_name
    `);
    console.log(`Total tables in ${TENANT_SCHEMA}: ${tables.rows.length}`);

    const tenants = await client.query("SELECT count(*) AS cnt FROM public.tenants");
    console.log(`Tenants registered: ${tenants.rows[0].cnt}`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
