import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, ".env.local");

const DB_URL = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf-8").split("\n").find(l => l.startsWith("DATABASE_URL=")).slice(13).trim() : "";
const sql = neon(DB_URL);

async function run() {
  const fileContent = readFileSync(resolve(__dirname, "database", "014-f-and-b-workflow.sql"), "utf-8");
  const statements = fileContent
    .replace(/--[^\n]*/g, "") // strip line comments
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 10);
    
  console.log(`Running ${statements.length} statements...`);
  for (const stmt of statements) {
    try {
      await sql.query(stmt + ";");
      console.log("Success:", stmt.slice(0, 50) + "...");
    } catch (e) {
      console.error("Error on:", stmt.slice(0, 50) + "...");
      console.error(e.message);
    }
  }
}

run().catch(console.error);
