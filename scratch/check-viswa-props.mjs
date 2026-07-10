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
  try {
    console.log("\n--- viswa.properties ---");
    await sql.query(`SET search_path TO viswa, public`);
    const propsViswa = await sql`SELECT id, name, code, vertical_type, is_active FROM properties ORDER BY name`;
    for (const p of propsViswa) {
      console.log(`  [${p.code}] ${p.name} (vertical: ${p.vertical_type}, id: ${p.id})`);
    }

    console.log("\n--- aishwaryam.properties ---");
    await sql.query(`SET search_path TO aishwaryam, public`);
    const propsAish = await sql`SELECT id, name, code, vertical_type, is_active FROM properties ORDER BY name`;
    for (const p of propsAish) {
      console.log(`  [${p.code}] ${p.name} (vertical: ${p.vertical_type}, id: ${p.id})`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
