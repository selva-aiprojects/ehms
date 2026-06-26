import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const DB_URL = envContent.split("\n").find(l => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();

async function main() {
  // Test exact migrate.mjs pattern - CREATE TABLE without prefix
  const sql = neon(DB_URL);
  console.log("Test: Exact migrate pattern - CREATE TABLE, INSERT, SELECT");
  
  await sql.query("SET search_path TO viswa, public");
  await sql.query("CREATE TABLE IF NOT EXISTS _path_test (id int, name text)");
  console.log("  Table created");

  await sql.query("SET search_path TO viswa, public");
  await sql.query("INSERT INTO _path_test VALUES (1, 'hello')");
  console.log("  Row inserted");

  await sql.query("SET search_path TO viswa, public");
  const r = await sql.query("SELECT * FROM _path_test");
  console.log("  SELECT result:", r);

  // Check where it actually went
  const [inViswa, inPublic] = await Promise.all([
    sql.query("SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_name='_path_test' AND table_schema='viswa'"),
    sql.query("SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_name='_path_test' AND table_schema='public'")
  ]);
  console.log("  In viswa:", inViswa[0].cnt, "| In public:", inPublic[0].cnt);

  // Cleanup
  await sql.query("DROP TABLE IF EXISTS viswa._path_test").catch(() => {});
  await sql.query("DROP TABLE IF EXISTS public._path_test").catch(() => {});
}
main().catch(e => console.error("FAILED:", e.message.slice(0, 200)));
