/**
 * apply-037-push.mjs — Applies 037_push_subscriptions.sql to the viswa
 * master schema AND every tenant shard registered in public.tenants.
 * Safe: CREATE TABLE IF NOT EXISTS — idempotent, no data loss.
 *
 * Usage: node scripts/apply-037-push.mjs
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const SQL_PATH = join(__dirname, "../database/037_push_subscriptions.sql");

function getEnvVar(name) {
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(name + "=")) {
      return trimmed.slice(name.length + 1).replace(/^"|"$/g, "");
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

async function main() {
  console.log("▶ Applying 037_push_subscriptions.sql ...");
  const content = readFileSync(SQL_PATH, "utf-8");
  const statements = splitStatements(content);
  console.log(`  ${statements.length} statements loaded`);

  const schemas = ["viswa"];
  try {
    const tenants = await sql`SELECT schema_name FROM public.tenants WHERE is_active = true`;
    for (const t of tenants) {
      if (t.schema_name && !schemas.includes(t.schema_name)) schemas.push(t.schema_name);
    }
  } catch {
    console.log("  (no tenants table yet — applying to viswa only)");
  }

  for (const schema of schemas) {
    console.log(`  → ${schema}`);
    // Neon HTTP driver is stateless — search_path must be set in the same
    // transaction as the statement (same pattern as lib/db.ts).
    for (const stmt of statements) {
      await sql.transaction([
        sql.query(`SET search_path TO "${schema}", public`),
        sql.query(`${stmt};`),
      ]);
    }
  }

  console.log("✅ 037_push_subscriptions.sql applied to all tenant schemas");
}

main().catch((err) => {
  console.error("Apply failed:", err);
  process.exit(1);
});
