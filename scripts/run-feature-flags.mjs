/**
 * run-feature-flags.mjs — Apply 040/041/042 feature flag migrations
 * Creates the feature flag tables in the tenant schema (viswa template),
 * helper functions in public (shared across shards), and seeds vertical
 * availability + Viswa workspace mapping.
 * Usage: node scripts/run-feature-flags.mjs
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

const FILES = [
  { name: "040_feature_flags_module.sql", searchPath: "viswa, public" },
  { name: "041_feature_flags_vertical_extension.sql", searchPath: "viswa, public" },
  { name: "042_viswa_vertical_mapping.sql", searchPath: "public, viswa" },
];

async function run() {
  const client = await pool.connect();
  try {
    for (const file of FILES) {
      const sqlPath = join(__dirname, "../database", file.name);
      const content = readFileSync(sqlPath, "utf-8");
      const statements = splitStatements(content);
      console.log(`▶ ${file.name} (${statements.length} statements, search_path=${file.searchPath})`);
      await client.query(`SET search_path TO ${file.searchPath}`);
      for (const stmt of statements) {
        try {
          await client.query(`${stmt};`);
        } catch (err) {
          console.error(`  ✗ Error in ${file.name}: ${err.message}`);
          console.error(`  Statement: ${stmt.substring(0, 120)}...`);
          throw err;
        }
      }
      console.log(`  ✓ ${file.name} applied`);
    }

    console.log("\n✅ Feature flag migrations applied successfully!");
    await client.query(`SET search_path TO viswa, public`);
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'viswa' AND table_name IN ('feature_flags','feature_availability','feature_flag_overrides') ORDER BY table_name`
    );
    console.log("Feature flag tables in viswa:", tables.rows.map((t) => t.table_name).join(", "));
    const flags = await client.query(`SELECT count(*) AS cnt FROM viswa.feature_flags`);
    console.log(`Feature flags seeded: ${flags.rows[0].cnt}`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
