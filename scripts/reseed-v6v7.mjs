import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR = resolve(__dirname, "../database");
const ENV_PATH = resolve(__dirname, "../.env.local");

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
const pool = new pg.Pool({ connectionString: DB_URL, max: 1 });

function splitStatements(content) {
  const noComments = content.replace(/--[^\n]*/g, "").trim();
  const stmts = [];
  let cur = "";
  let inD = false;
  let dTag = "";
  let inS = false;
  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    const next = noComments[i + 1] || "";
    if (ch === "'" && (i === 0 || noComments[i - 1] !== "\\")) {
      if (!inD) inS = !inS;
    }
    if (!inS && !inD && ch === "$" && next === "$") {
      inD = true;
      dTag = "$$";
      cur += ch + next;
      i++;
      continue;
    }
    if (!inS && !inD && ch === "$") {
      let j = i + 1;
      while (j < noComments.length && /[a-zA-Z0-9_]/.test(noComments[j])) j++;
      if (j < noComments.length && noComments[j] === "$") {
        inD = true;
        dTag = noComments.slice(i, j + 1);
        cur += dTag;
        i = j;
        continue;
      }
    }
    if (inD && noComments.startsWith(dTag, i)) {
      cur += dTag;
      i += dTag.length - 1;
      inD = false;
      dTag = "";
      continue;
    }
    if (!inD && !inS && ch === ";") {
      const t = cur.trim();
      if (t.length > 10) stmts.push(t);
      cur = "";
      continue;
    }
    cur += ch;
  }
  const rem = cur.trim();
  if (rem.length > 10) stmts.push(rem);
  return stmts;
}

async function runFile(file, label) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET search_path TO viswa, public");
    const stmts = splitStatements(readFileSync(file, "utf-8"));
    console.log(`▶ ${label} (${stmts.length} statements)`);
    let ok = 0, skip = 0;
    for (const s of stmts) {
      try {
        await client.query(s + ";");
        ok++;
      } catch (e) {
        const msg = e.message || "";
        if (msg.includes("duplicate") || msg.includes("already exists") || msg.includes("does not exist") || msg.includes("unique")) {
          skip++;
        } else {
          console.warn(`  ⚠ ${msg.slice(0, 120)}`);
          console.warn(`    ${s.slice(0, 80)}`);
        }
      }
    }
    await client.query("COMMIT");
    console.log(`  ✅ ${ok} ok, ${skip} skipped`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(`❌ ${e.message}`);
  } finally {
    client.release();
  }
}

async function main() {
  await runFile(join(DATABASE_DIR, "seed_v6_platform_and_workflows.sql"), "seed_v6 (fixed)");
  await runFile(join(DATABASE_DIR, "seed_v7_payments_backfill.sql"), "seed_v7 (fixed)");

  console.log("\n📈 Final counts:");
  const counts = [
    "users", "bookings", "payments", "guest_profiles", "employees",
    "housekeeping_tasks", "maintenance_tickets", "guest_requests",
    "vendor_bills", "guest_feedbacks"
  ];
  const v = await pool.connect();
  await v.query("SET search_path TO viswa, public");
  for (const t of counts) {
    const r = await v.query(`SELECT COUNT(*) AS cnt FROM ${t}`).catch(() => ({ rows: [{ cnt: "?" }] }));
    console.log(`   ${t.padEnd(24)} ${r.rows[0].cnt}`);
  }
  v.release();
  await pool.end();
}

main();
