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
  const pub = await sql.query("SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'").catch(() => [{cnt:0}]);
  const vis = await sql.query("SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema='viswa' AND table_type='BASE TABLE'").catch(() => [{cnt:0}]);
  console.log("Public tables:", pub[0].cnt);
  console.log("Viswa tables:", vis[0].cnt);

  if (pub[0].cnt > 0) {
    const names = await sql.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name LIMIT 10");
    console.log("Public tables (first 10):", names.map(n => n.table_name).join(", "));
  }
}
main().catch(e => console.error(e.message));
