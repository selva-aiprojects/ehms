import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, ".env.local");

function getEnvVar(name) {
  if (!existsSync(ENV_PATH)) return "";
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
const sql = neon(DB_URL);

async function run() {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
  console.log("Tables:", tables.map(t => t.table_name).join(", "));
}
run().catch(console.error);
