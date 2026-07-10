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
    const propId = '26b9252e-c62b-426e-905b-21e979696ba8';
    const buildings = await sql`SELECT * FROM viswa.buildings WHERE property_id = ${propId}`;
    console.log(`Buildings for Viswa Service Apartments (${buildings.length}):`);
    for (const b of buildings) {
      console.log(`  [${b.code}] ${b.name} (floors: ${b.floors}, id: ${b.id})`);
      const floors = await sql`SELECT * FROM viswa.floors WHERE building_id = ${b.id} ORDER BY floor_number`;
      for (const f of floors) {
        const units = await sql`SELECT * FROM viswa.units WHERE floor_id = ${f.id} ORDER BY unit_label`;
        console.log(`    Floor ${f.floor_number} (${f.name}) - ${units.length} units: ${units.map(u => u.unit_label).join(", ")}`);
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
