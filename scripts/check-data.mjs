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

const rp = await c.query("SELECT * FROM rate_plans LIMIT 10");
console.log("rate_plans:", JSON.stringify(rp.rows, null, 2));

// Also check if there are any rate plans
const rpCnt = await c.query("SELECT COUNT(*) FROM rate_plans");
console.log("rate_plans count:", rpCnt.rows[0].count);

c.release();
await pool.end();
