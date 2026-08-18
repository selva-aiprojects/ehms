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
    try {
      const r = await sql.query("SELECT extname, extversion FROM pg_extension WHERE extname = 'pgcrypto'");
      console.log("pgcrypto extension:", JSON.stringify(r));
    } catch (e) { console.log("pgcrypto error:", e.message); }
    try {
      const r = await sql.query("SELECT crypt('test123', gen_salt('bf')) AS hash");
      console.log("crypt result works:", r[0].hash.substring(0, 20) + "...");
    } catch (e) { console.log("crypt error:", e.message); }
  }
}
