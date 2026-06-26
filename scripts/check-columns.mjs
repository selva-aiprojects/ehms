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

const rp = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='rate_plans' ORDER BY ordinal_position");
console.log("rate_plans:", rp.rows.map(r => r.column_name).join(", "));

const dep = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='viswa' AND table_name LIKE '%depart%'");
console.log("depart% tables:", dep.rows.map(r => r.table_name).join(", "));

const bs = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name='booking_source'");
console.log("bookings.booking_source exists:", bs.rows.length > 0);

const coa = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='chart_of_accounts' ORDER BY ordinal_position");
console.log("chart_of_accounts:", coa.rows.map(r => r.column_name).join(", "));

const fa = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='fixed_assets' ORDER BY ordinal_position");
console.log("fixed_assets:", fa.rows.map(r => r.column_name).join(", "));

c.release();
await pool.end();
