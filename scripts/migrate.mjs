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
  const statements = [];
  let current = "";
  let inDollar = false;
  let dollarTag = "";
  let inSingleQuote = false;

  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    const next = noComments[i + 1] || "";

    // Toggle single-quote (skip if preceded by backslash)
    if (ch === "'" && (i === 0 || noComments[i - 1] !== "\\")) {
      if (!inDollar) inSingleQuote = !inSingleQuote;
    }

    // Detect dollar-quote start
    if (!inSingleQuote && !inDollar && ch === "$" && next === "$") {
      inDollar = true;
      dollarTag = "$$";
      current += ch + next;
      i++;
      continue;
    }
    // Detect tagged dollar-quote start (e.g., $func$)
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

    // Detect dollar-quote end
    if (inDollar && noComments.startsWith(dollarTag, i)) {
      const endLen = dollarTag.length;
      current += dollarTag;
      i += endLen - 1;
      inDollar = false;
      dollarTag = "";
      continue;
    }

    // Top-level semicolon = statement boundary
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
  // ── Step 0: Clean up any leftover eHMS objects from public schema ──
  console.log("🧹 Cleaning public schema of leftover eHMS objects...");
  const oldTables = await sql.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('tenants', 'platform_admins')
  `);
  for (const t of oldTables) {
    await sql.query(`DROP TABLE IF EXISTS public.${t.table_name} CASCADE`);
  }

  const oldTypes = await sql.query(`
    SELECT t.typname FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
  `);
  for (const t of oldTypes) {
    await sql.query(`DROP TYPE IF EXISTS public.${t.typname} CASCADE`);
  }

  const oldSeqs = await sql.query(`
    SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
  `);
  for (const s of oldSeqs) {
    await sql.query(`DROP SEQUENCE IF EXISTS public.${s.sequence_name}`);
  }
  console.log("  Done.");

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
        // Re-assert search_path before each statement
        await sql.query(`SET search_path TO ${TENANT_SCHEMA}, public`);
        await sql.query(`${stmt};`);
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
        await sql.query(`SET search_path TO public`);
        await sql.query(`${stmt};`);
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
        await sql.query(`SET search_path TO public`);
        await sql.query(`${stmt};`);
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
        console.error(`  Statement: ${stmt.substring(0, 120)}...`);
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
