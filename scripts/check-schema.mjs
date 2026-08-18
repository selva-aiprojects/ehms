import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const DB_URL = envContent.split("\n").find(l => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();
const sql = neon(DB_URL);

async function check() {
  const schemas = await sql.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast') ORDER BY schema_name");
  const pubTables = await sql.query("SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
  const visTables = await sql.query("SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema='viswa' AND table_type='BASE TABLE'");
  const pubUsers = await sql.query("SELECT COUNT(*)::int AS cnt FROM public.users").catch(() => [{cnt:0}]);
  const visUsers = await sql.query("SELECT COUNT(*)::int AS cnt FROM viswa.users").catch(() => [{cnt:0}]);

  console.log("Schemas:", schemas.map(s => s.schema_name).join(", "));
  console.log("Public tables:", pubTables[0].cnt);
  console.log("Viswa tables:", visTables[0].cnt);
  console.log("Public users:", pubUsers[0].cnt);
  console.log("Viswa users:", visUsers[0].cnt);
}
check().catch(e => console.error(e));
