/**
 * run-044.mjs — Apply 044_subscription_provisioning.sql (public schema)
 * Creates subscription_plans + tenant_subscriptions, seeds plans,
 * backfills subscriptions for existing tenants.
 * Usage: node scripts/run-044.mjs
 */
import pg from "pg";
import { readFileSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
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
if (!DB_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DB_URL, max: 1 });

function splitStatements(content) {
  const noBlockComments = content.replace(/\/\*[\s\S]*?\*\//g, "");
  const noComments = noBlockComments.replace(/--.*$/gm, "").trim();
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
  const client = await pool.connect();
  try {
    const sqlPath = join(__dirname, "../database", "044_subscription_provisioning.sql");
    const content = readFileSync(sqlPath, "utf-8");
    const statements = splitStatements(content);
    console.log(`▶ 044_subscription_provisioning.sql (${statements.length} statements, search_path=public)`);
    await client.query(`SET search_path TO public`);
    for (const stmt of statements) {
      try {
        await client.query(`${stmt};`);
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
        console.error(`  Statement: ${stmt.substring(0, 120)}...`);
        throw err;
      }
    }

    const plans = await client.query(`SELECT code, name, tier, price FROM public.subscription_plans ORDER BY price`);
    console.log("Plans:");
    for (const p of plans.rows) console.log(`  - ${p.name} (${p.tier}) ₹${p.price}`);

    const subs = await client.query(
      `SELECT t.code, ts.tier, ts.status, ts.subscribed_verticals FROM public.tenant_subscriptions ts
       JOIN public.tenants t ON t.id = ts.tenant_id ORDER BY t.code`
    );
    console.log("Tenant subscriptions:");
    for (const s of subs.rows) console.log(`  - ${s.code}: ${s.tier}/${s.status} ${JSON.stringify(s.subscribed_verticals)}`);

    console.log("\n✅ 044 applied successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
