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
  // Test 1
  try {
    await sql.query("SET search_path TO viswa, public");
    let r = await sql.query("SELECT COUNT(*)::int AS cnt FROM properties");
    console.log("Test 1 - search_path then query:", r[0].cnt);
  } catch(e) {
    console.log("Test 1 FAILED:", e.message.slice(0, 100));
  }

  // Test 2
  try {
    let r = await sql.query("SELECT COUNT(*)::int AS cnt FROM viswa.properties");
    console.log("Test 2 - viswa.properties:", r[0].cnt);
  } catch(e) {
    console.log("Test 2 FAILED:", e.message.slice(0, 100));
  }

  // Test 3
  try {
    let r = await sql.query("SELECT COUNT(*)::int AS cnt FROM public.properties").catch(() => [{cnt:0}]);
    console.log("Test 3 - public.properties:", r[0].cnt);
  } catch(e) {
    console.log("Test 3 FAILED:", e.message.slice(0, 100));
  }

  // Test 4: Include search_path in same query
  try {
    let r = await sql.query("SET search_path TO viswa, public; SELECT COUNT(*)::int AS cnt FROM properties");
    console.log("Test 4 - inline search_path:", r?.[0] || r);
  } catch(e) {
    console.log("Test 4 FAILED:", e.message.slice(0, 100));
  }

  // Test 5: Use the sql() tagged template directly
  try {
    let r = await sql("SELECT COUNT(*)::int AS cnt FROM viswa.properties");
    console.log("Test 5 - sql tagged template:", r[0].cnt);
  } catch(e) {
    console.log("Test 5 FAILED:", e.message.slice(0, 100));
  }
}
main().catch(e => console.error(e));
