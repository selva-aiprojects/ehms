/**
 * seed-only.mjs — Run seed files against the existing NeonDB schema
 * Usage: node scripts/seed-only.mjs
 *
 * This does NOT drop/recreate the schema. Only inserts data.
 * Uses pg (node-postgres) TCP connection so SET search_path persists.
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR = resolve(__dirname, "../database");
const ENV_PATH = resolve(__dirname, "../.env.local");

function getEnvVar(name) {
  if (!existsSync(ENV_PATH)) {
    console.error(`\u274C .env.local not found at ${ENV_PATH}`);
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
  console.error("\u274C DATABASE_URL not found in .env.local");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DB_URL, max: 1 });

/**
 * Split SQL into top-level statements, respecting $$ and tagged
 * dollar-quoting (e.g. $func$) and single-quoted strings.
 */
function splitStatements(content) {
  const noComments = content.replace(/--[^\n]*/g, "").trim();
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

    if (!inSingleQuote && !inDollar && ch === "$") {
      if (next === "$") {
        inDollar = true;
        dollarTag = "$$";
        current += ch + next;
        i++;
        continue;
      }
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
      current += dollarTag;
      i += dollarTag.length - 1;
      inDollar = false;
      dollarTag = "";
      continue;
    }

    if (!inDollar && !inSingleQuote && ch === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 10) statements.push(trimmed);
      current = "";
      continue;
    }

    current += ch;
  }

  const remaining = current.trim();
  if (remaining.length > 10) statements.push(remaining);
  return statements;
}

async function runSeedFile(filePath, label) {
  if (!existsSync(filePath)) {
    console.warn(`\u26A0  Skipping \u2014 not found: ${label}`);
    return;
  }

  console.log(`\n\u25B6 Running ${label}...`);
  const content = readFileSync(filePath, "utf-8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET search_path TO viswa, public");

    const statements = splitStatements(content);

    let ok = 0, skip = 0;
    for (const stmt of statements) {
      try {
        const result = await client.query(stmt + ";");
        if (result && result.rows && result.rows[0]) {
          console.log("  \u2713", JSON.stringify(result.rows[0]).slice(0, 120));
        }
        ok++;
      } catch (err) {
        if (err.message?.includes("duplicate key") || err.message?.includes("already exists")) {
          skip++;
        } else {
          console.warn(`  \u26A0 ${err.message?.slice(0, 100)}`);
          console.warn(`    stmt: ${stmt.slice(0, 80)}...`);
        }
      }
    }

    await client.query("COMMIT");
    console.log(`  \u2705 Done: ${ok} statements succeeded, ${skip} skipped (conflicts)`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(`\u274C Failed: ${err.message}`);
    process.exit(1);
  } finally {
    client.release();
  }
}

async function main() {
  console.log("\uD83C\uDF31 eHMS Seed Runner v2");
  console.log("=".repeat(50));

  // Use one client for initial checks
  const client = await pool.connect();
  try {
    await client.query("SET search_path TO viswa, public");

    // Check current state
    try {
      const tables = await client.query(
        "SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema='viswa'"
      );
      console.log(`\uD83D\uDCCA Tables in DB: ${tables.rows[0].cnt}`);

      const userCount = await client.query("SELECT COUNT(*) AS cnt FROM users").catch(() => ({ rows: [{ cnt: 0 }] }));
      const bookingCount = await client.query("SELECT COUNT(*) AS cnt FROM bookings").catch(() => ({ rows: [{ cnt: 0 }] }));
      console.log(`   Users:    ${userCount.rows[0].cnt}`);
      console.log(`   Bookings: ${bookingCount.rows[0].cnt}`);
    } catch (err) {
      console.warn("\u26A0  Could not check current state:", err.message);
    }
  } finally {
    client.release();
  }

  // Run seed files
  await runSeedFile(join(DATABASE_DIR, "seed.sql"),    "seed.sql (base demo users & roles)");
  await runSeedFile(join(DATABASE_DIR, "seed_v2.sql"), "seed_v2.sql (rich metrics data)");
  await runSeedFile(join(DATABASE_DIR, "seed_csa.sql"), "seed_csa.sql (Serviced Apartments data)");
  await runSeedFile(join(DATABASE_DIR, "seed_v3.sql"), "seed_v3.sql (Comprehensive All-Vertical Staff & Revenue data)");
  await runSeedFile(join(DATABASE_DIR, "seed_v4_full.sql"), "seed_v4_full.sql (Admin module & additional static data)");
  await runSeedFile(join(DATABASE_DIR, "seed_v5_yearly.sql"), "seed_v5_yearly.sql (1-2 years demo data)");
  await runSeedFile(join(DATABASE_DIR, "seed_v6_platform_and_workflows.sql"), "seed_v6_platform_and_workflows.sql (Platform Broadcasts & Workflow data)");
  await runSeedFile(join(DATABASE_DIR, "seed_v7_payments_backfill.sql"), "seed_v7_payments_backfill.sql (Payments backfill + live activity data)");

  // Final verification
  console.log("\n\uD83D\uDCC8 Final counts:");
  const verifyClient = await pool.connect();
  try {
    await verifyClient.query("SET search_path TO viswa, public");

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

    for (const [label, q] of checks) {
      const result = await verifyClient.query(q).catch(() => ({ rows: [{ cnt: "?" }] }));
      console.log(`   ${label.padEnd(22)} ${result.rows[0].cnt}`);
    }
  } finally {
    verifyClient.release();
  }

  await pool.end();
  console.log("\n\u2705 Seeding complete! Start the app and log in with any demo user.");
  console.log("   Password: Demo@1234\n");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
