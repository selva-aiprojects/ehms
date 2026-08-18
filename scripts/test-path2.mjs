import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const DB_URL = envContent.split("\n").find(l => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();

// Test with options= parameter in URL
const urlWithOptions = DB_URL + (DB_URL.includes("?") ? "&" : "?") + "options=--search_path%3Dviswa,public";
console.log("URL with options");
try {
  const sql2 = neon(urlWithOptions);
  let r = await sql2.query("SELECT COUNT(*)::int AS cnt FROM properties");
  console.log("  properties via URL options:", r[0].cnt);
} catch(e) {
  console.log("  FAILED:", e.message.slice(0, 100));
}

// Test with fetch驱动的 neon
try {
  const sql3 = neon(DB_URL);
  // Try setting search_path via options parameter
  let r = await sql3.query("BEGIN; SET search_path TO viswa, public; SELECT COUNT(*)::int AS cnt FROM properties; COMMIT");
  console.log("  transaction:", r?.[0] || "?");
} catch(e) {
  console.log("  transaction FAILED:", e.message.slice(0, 100));
}

// Investigate: does SET search_path actually work?
try {
  const sql4 = neon(DB_URL);
  let r1 = await sql4.query("SET search_path TO viswa, public");
  console.log("  SET search_path result:", r1);
  let r2 = await sql4.query("SHOW search_path");
  console.log("  SHOW search_path:", r2[0].search_path);
  let r3 = await sql4.query("SELECT COUNT(*)::int AS cnt FROM properties");
  console.log("  properties count:", r3[0].cnt || "error");
} catch(e) {
  console.log("  Investigation FAILED:", e.message.slice(0, 100));
}

// Test with tagged template literal
try {
  const sql5 = neon(DB_URL);
  await sql5`SET search_path TO viswa, public`;
  let r = await sql5`SHOW search_path`;
  console.log("  Tagged template SHOW search_path:", r[0].search_path);
  r = await sql5`SELECT COUNT(*)::int AS cnt FROM properties`;
  console.log("  Tagged template properties:", r[0].cnt);
} catch(e) {
  console.log("  Tagged template FAILED:", e.message.slice(0, 100));
}

// Test: prepend viswa. prefix
try {
  const sql6 = neon(DB_URL);
  let r = await sql6.query("SELECT COUNT(*)::int AS cnt FROM viswa.properties");
  console.log("  viswa.properties (direct):", r[0].cnt);
} catch(e) {
  console.log("  viswa.properties FAILED:", e.message.slice(0, 100));
}
