/**
 * seed-only.mjs — Run seed_v2.sql against the existing NeonDB schema
 * Usage: node scripts/seed-only.mjs
 *
 * This does NOT drop/recreate the schema. Only inserts data.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR = resolve(__dirname, "../database");
const ENV_PATH = resolve(__dirname, "../.env.local");

function getEnvVar(name) {
  if (!existsSync(ENV_PATH)) {
    console.error(`❌ .env.local not found at ${ENV_PATH}`);
    process.exit(1);
  }
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
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(DB_URL);

async function runSeedFile(filePath, label) {
  if (!existsSync(filePath)) {
    console.warn(`⚠  Skipping — not found: ${label}`);
    return;
  }

  console.log(`\n▶ Running ${label}...`);
  const content = readFileSync(filePath, "utf-8");

  // Use a single transaction for the whole seed file
  try {
    await sql.query("BEGIN");

    // Split on semicolons but preserve dollar-quoted strings and CTEs
    // Simple approach: send whole file as one statement via raw query
    // Neon supports multi-statement queries when using sql.query()
    const statements = content
      .replace(/--[^\n]*/g, "") // strip line comments
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 10); // skip empty/whitespace

    let ok = 0, skip = 0;
    for (const stmt of statements) {
      try {
        const result = await sql.query(stmt + ";");
        if (result && result[0]) {
          console.log("  ✓", JSON.stringify(result[0]).slice(0, 120));
        }
        ok++;
      } catch (err) {
        // ON CONFLICT DO NOTHING causes no error, but other errors we log and continue
        if (err.message?.includes("duplicate key") || err.message?.includes("already exists")) {
          skip++;
        } else {
          console.warn(`  ⚠ ${err.message?.slice(0, 100)}`);
          console.warn(`    stmt: ${stmt.slice(0, 80)}...`);
        }
      }
    }

    await sql.query("COMMIT");
    console.log(`  ✅ Done: ${ok} statements succeeded, ${skip} skipped (conflicts)`);
  } catch (err) {
    await sql.query("ROLLBACK").catch(() => {});
    console.error(`❌ Failed: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  console.log("🌱 eHMS Seed Runner v2");
  console.log("=".repeat(50));

  // Check current state
  try {
    const tables = await sql.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema='public'"
    );
    console.log(`📊 Tables in DB: ${tables[0].cnt}`);

    const userCount = await sql.query("SELECT COUNT(*) AS cnt FROM users").catch(() => [{ cnt: 0 }]);
    const bookingCount = await sql.query("SELECT COUNT(*) AS cnt FROM bookings").catch(() => [{ cnt: 0 }]);
    console.log(`   Users:    ${userCount[0].cnt}`);
    console.log(`   Bookings: ${bookingCount[0].cnt}`);
  } catch (err) {
    console.warn("⚠  Could not check current state:", err.message);
  }

  // Run seed files
  await runSeedFile(join(DATABASE_DIR, "seed.sql"),    "seed.sql (base demo users & roles)");
  await runSeedFile(join(DATABASE_DIR, "seed_v2.sql"), "seed_v2.sql (rich metrics data)");

  // Final verification
  console.log("\n📈 Final counts:");
  const checks = [
    ["users",            "SELECT COUNT(*) AS cnt FROM users"],
    ["bookings",         "SELECT COUNT(*) AS cnt FROM bookings"],
    ["payments",         "SELECT COUNT(*) AS cnt FROM payments"],
    ["guest_profiles",   "SELECT COUNT(*) AS cnt FROM guest_profiles"],
    ["employees",        "SELECT COUNT(*) AS cnt FROM employees"],
    ["units",            "SELECT COUNT(*) AS cnt FROM units"],
    ["housekeeping_tasks","SELECT COUNT(*) AS cnt FROM housekeeping_tasks"],
    ["maintenance_tickets","SELECT COUNT(*) AS cnt FROM maintenance_tickets"],
  ];

  for (const [label, query] of checks) {
    const result = await sql.query(query).catch(() => [{ cnt: "?" }]);
    console.log(`   ${label.padEnd(22)} ${result[0].cnt}`);
  }

  console.log("\n✅ Seeding complete! Start the app and log in with any demo user.");
  console.log("   Password: Demo@1234\n");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
