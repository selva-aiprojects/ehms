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

const tables = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='viswa' AND table_name LIKE '%audit%' OR table_name LIKE '%event%' ORDER BY table_name");
console.log("Tables matching audit/event:", tables.rows.map(r => r.table_name).join(", "));

const emp = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='employees' ORDER BY ordinal_position");
console.log("\nemployees:", emp.rows.map(r => r.column_name).join(", "));

c.release();
await pool.end();
