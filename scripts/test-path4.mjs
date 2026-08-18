import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const DB_URL = envContent.split("\n").find(l => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();
const sql = neon(DB_URL);

async function main() {
  // Simulate the migrate.mjs pattern exactly
  console.log("=== Simulating migrate.mjs pattern ===");
  await sql.query("SET search_path TO viswa, public");
  await sql.query("CREATE TEMP TABLE IF NOT EXISTS test_search_path (id int)");
  await sql.query("INSERT INTO test_search_path VALUES (42)");
  const r = await sql.query("SELECT * FROM test_search_path");
  console.log("Result:", r);
}
main().catch(e => console.error("FAILED:", e.message.slice(0, 150)));
