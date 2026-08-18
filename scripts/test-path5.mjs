import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const DB_URL = envContent.split("\n").find(l => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();

async function main() {
  // Test 1: Does the Neon driver actually maintain state?
  const sql1 = neon(DB_URL);
  console.log("Test 1: Two queries, same sql instance");
  await sql1.query("SELECT 1");
  await sql1.query("SELECT 1");
  console.log("  OK - basic query works");

  // Test 2: Create a table with explicit schema, then query it
  const sql2 = neon(DB_URL);
  console.log("Test 2: Create table in viswa, then query unqualified");
  await sql2.query("CREATE TABLE IF NOT EXISTS viswa._test_tbl (id int)");
  await sql2.query("INSERT INTO viswa._test_tbl VALUES (1)");
  await sql2.query("SET search_path TO viswa, public");
  // Try to find it without prefix
  const r1 = await sql2.query("SELECT COUNT(*)::int AS cnt FROM _test_tbl").catch(e => ({error: e.message.slice(0,80)}));
  console.log("  unqualified:", r1.cnt ?? r1.error);
  // Try with prefix
  const r2 = await sql2.query("SELECT COUNT(*)::int AS cnt FROM viswa._test_tbl");
  console.log("  viswa._test_tbl:", r2[0].cnt);

  // Test 3: Create table without schema (with search_path set first, but will fail)
  const sql3 = neon(DB_URL);
  console.log("Test 3: Create unqualified table");
  await sql3.query("SET search_path TO viswa, public");
  const r3 = await sql3.query("CREATE TABLE IF NOT EXISTS _test_tbl2 (id int)");
  console.log("  create result:", r3);
  const r3b = await sql3.query("SELECT table_schema FROM information_schema.tables WHERE table_name='_test_tbl2'");
  console.log("  table_schema:", r3b.length > 0 ? r3b[0].table_schema : "not found");

  // Cleanup
  await sql2.query("DROP TABLE IF EXISTS viswa._test_tbl");
  await sql3.query("DROP TABLE IF EXISTS _test_tbl2").catch(() => {});
  await sql3.query("DROP TABLE IF EXISTS viswa._test_tbl2").catch(() => {});

  console.log("Done");
}
main().catch(e => console.error("FAILED:", e.message.slice(0, 200)));
