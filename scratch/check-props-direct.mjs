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
    const propsViswa = await sql`SELECT id, name, code, vertical_type, is_active FROM viswa.properties ORDER BY name`;
    console.log(`\n--- viswa.properties (${propsViswa.length}) ---`);
    for (const p of propsViswa) {
      console.log(`  [${p.code}] ${p.name} (vertical: ${p.vertical_type}, id: ${p.id})`);
    }

    const propsAish = await sql`SELECT id, name, code, vertical_type, is_active FROM aishwaryam.properties ORDER BY name`;
    console.log(`\n--- aishwaryam.properties (${propsAish.length}) ---`);
    for (const p of propsAish) {
      console.log(`  [${p.code}] ${p.name} (vertical: ${p.vertical_type}, id: ${p.id})`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
