import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR = resolve(__dirname, "../../database");
const ENV_PATH = resolve(__dirname, "../.env.local");

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
  // Strip SQL comments first, then split by semicolon
  const noComments = content.replace(/--.*$/gm, "").trim();
  return noComments
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

async function run() {
  // ── Step 1: Drop everything from previous partial runs ──
  console.log("🧹 Dropping existing objects from previous runs...");
  await sql.query("DROP SCHEMA IF EXISTS public CASCADE");
  await sql.query("CREATE SCHEMA public");
  await sql.query("GRANT ALL ON SCHEMA public TO public");
  console.log("  Done.");

  // ── Step 2: Run SQL files in order ──
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
        await sql.query(stmt + ";");
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
        console.error(`  Statement: ${stmt.substring(0, 120)}...`);
        process.exit(1);
      }
    }
  }

  // ── Step 3: Verify ──
  console.log("\n✅ Migration complete. Verifying tables...");
  const tables = await sql.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log(tables.map((t) => `  • ${t.table_name}`).join("\n"));

  const users = await sql.query("SELECT count(*) AS cnt FROM users");
  console.log(`\nUsers in DB: ${users[0].cnt}`);

  const roles = await sql.query("SELECT count(*) AS cnt FROM roles");
  console.log(`Roles in DB: ${roles[0].cnt}`);

  const mappings = await sql.query(
    "SELECT u.email, r.name AS role_name FROM user_roles ur JOIN users u ON u.id = ur.user_id JOIN roles r ON r.id = ur.role_id ORDER BY u.email"
  );
  console.log("\nUser → Role mappings:");
  mappings.forEach(r => console.log(`  ${r.email} → ${r.role_name}`));
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
