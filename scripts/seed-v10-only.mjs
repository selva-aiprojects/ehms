/**
 * seed-v10-only.mjs — Run only database/seed_v10_all_modules.sql
 * Avoids re-running non-idempotent v2-v9 files which duplicate core data.
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const FILE = resolve(__dirname, "../database/seed_v10_all_modules.sql");

function getEnvVar(name) {
  if (!existsSync(ENV_PATH)) {
    console.error(`.env.local not found at ${ENV_PATH}`);
    process.exit(1);
  }
  for (const line of readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(name + "=")) return trimmed.slice(name.length + 1).trim();
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

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET search_path TO viswa, public");
    const statements = splitStatements(readFileSync(FILE, "utf-8"));
    let ok = 0, skip = 0;
    for (const stmt of statements) {
      try {
        await client.query("SAVEPOINT sp");
        await client.query(stmt + ";");
        await client.query("RELEASE SAVEPOINT sp");
        ok++;
      } catch (err) {
        await client.query("ROLLBACK TO SAVEPOINT sp").catch(() => {});
        if (err.message?.includes("duplicate key") || err.message?.includes("already exists")) {
          skip++;
          console.warn(`↷ skip: ${err.message?.slice(0, 100)}`);
          console.warn(`   stmt: ${stmt.slice(0, 70)}...`);
        } else {
          console.warn(`⚠ ${err.message?.slice(0, 120)}`);
          console.warn(`  stmt: ${stmt.slice(0, 90)}...`);
        }
      }
    }
    await client.query("COMMIT");
    console.log(`✅ Done: ${ok} statements succeeded, ${skip} skipped (conflicts)`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(`❌ Failed: ${err.message}`);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
