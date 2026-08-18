import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const url = envContent.split("\n").find(l => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();
const pool = new pg.Pool({ connectionString: url, max: 1 });
const c = await pool.connect();
await c.query("SET search_path TO viswa, public");

const cols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='bookings' ORDER BY ordinal_position");
console.log("bookings columns:");
for (const r of cols.rows) {
  console.log("  " + r.column_name + " (" + r.data_type + ")");
}

const le = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='lease_agreements' ORDER BY ordinal_position");
console.log("\nlease_agreements columns:", le.rows.map(r => r.column_name).join(", "));

const gf = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='guest_feedbacks' ORDER BY ordinal_position");
console.log("\nguest_feedbacks columns:", gf.rows.map(r => r.column_name).join(", "));

c.release();
await pool.end();
