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
    const units = await sql`
      SELECT u.unit_label, u.layout_type, u.base_rate, u.sq_ft, u.max_occupancy, u.attributes 
      FROM viswa.units u
      JOIN viswa.floors f ON u.floor_id = f.id
      JOIN viswa.buildings b ON f.building_id = b.id
      WHERE b.property_id = ${propId}
      ORDER BY u.unit_label LIMIT 10
    `;
    console.log("Sample existing units specs:");
    for (const u of units) {
      console.log(`  Room ${u.unit_label}: layout=${u.layout_type}, rate=₹${u.base_rate}, sq_ft=${u.sq_ft}, attr=${JSON.stringify(u.attributes)}`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
