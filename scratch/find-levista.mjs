import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
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
const pool = new pg.Pool({ connectionString: DB_URL, max: 1 });

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT id, name, code, schema_name, contact_email FROM public.tenants WHERE code = 'LEVISTA' OR name ILIKE '%Levista%'"
    );
    console.log("Tenant search results:", JSON.stringify(res.rows, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
