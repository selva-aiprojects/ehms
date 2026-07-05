import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const content = readFileSync(ENV_PATH, "utf-8");
let dbUrl = "";

for (const line of content.split("\n")) {
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=")) {
    dbUrl = t.slice("DATABASE_URL=".length).replace(/['"]/g, "");
  }
}

const sql = neon(dbUrl);

async function main() {
  const tenants = await sql.query("SELECT code, name, config FROM public.tenants WHERE code = 'VISWA'");
  const properties = await sql.query("SELECT id, name, code, vertical_type FROM viswa.properties");
  console.log(JSON.stringify({ tenant: tenants[0], properties }, null, 2));
}
main().catch(console.error);
