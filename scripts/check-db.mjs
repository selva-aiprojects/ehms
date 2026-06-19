import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const content = readFileSync(ENV_PATH, "utf-8");
for (const line of content.split("\n")) {
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=")) {
    const sql = neon(t.slice("DATABASE_URL=".length));
    const r1 = await sql.query("SELECT extname, extversion FROM pg_extension WHERE extname = 'uuid-ossp'");
    console.log("uuid-ossp:", JSON.stringify(r1));
    const r2 = await sql.query("SELECT gen_random_uuid() AS uid");
    console.log("gen_random_uuid:", JSON.stringify(r2));
  }
}
