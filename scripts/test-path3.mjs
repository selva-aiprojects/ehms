import { neon, NeonConfig } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const DB_URL = envContent.split("\n").find(l => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();

// Test with explicit poolQueryViaFetch = false
try {
  NeonConfig.poolQueryViaFetch = false;
  const sql6 = neon(DB_URL);
  await sql6.query("SET search_path TO viswa, public");
  let r1 = await sql6.query("SHOW search_path");
  console.log("poolQueryViaFetch=false SHOW search_path:", r1[0].search_path);
  let r2 = await sql6.query("SELECT COUNT(*)::int AS cnt FROM properties");
  console.log("properties count:", r2[0].cnt);
} catch(e) {
  console.log("FAILED:", e.message.slice(0, 120));
}

// Revert
NeonConfig.poolQueryViaFetch = true;
