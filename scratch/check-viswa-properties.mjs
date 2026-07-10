import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf-8");
let DB_URL = "";
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("DATABASE_URL=")) {
    DB_URL = trimmed.slice("DATABASE_URL=".length).trim();
    break;
  }
}

const sql = neon(DB_URL);

async function main() {
  console.log("Checking properties across schemas...");
  
  try {
    const schemas = ['viswa', 'public'];
    for (const schema of schemas) {
      console.log(`\n--- SCHEMA: ${schema} ---`);
      await sql.query(`SET search_path TO ${schema}, public`);
      const props = await sql`SELECT id, name, code, vertical_type, is_active FROM properties ORDER BY name`;
      console.log(`Found ${props.length} properties in ${schema}:`);
      for (const p of props) {
        console.log(`  [${p.code}] ${p.name} (vertical: ${p.vertical_type}, active: ${p.is_active}, id: ${p.id})`);
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
