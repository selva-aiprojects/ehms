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
  console.log("🌱 Seeding Greenwood Residency (GWR) Space Items...");

  try {
    // 1. Get GWR property ID
    const propertyResult = await sql`SELECT id FROM properties WHERE code = 'GWR'`;
    if (propertyResult.length === 0) {
      console.error("❌ Greenwood Residency (GWR) property not found in database.");
      process.exit(1);
    }
    const propId = propertyResult[0].id;
    console.log(`Found GWR Property ID: ${propId}`);

    // 2. Create Building "Tower A"
    await sql`
      INSERT INTO buildings (property_id, name, code, floors)
      VALUES (${propId}, 'Tower A', 'T-A', 3)
      ON CONFLICT (property_id, code) DO NOTHING
    `;
    const buildingResult = await sql`SELECT id FROM buildings WHERE property_id = ${propId} AND code = 'T-A'`;
    const buildingId = buildingResult[0].id;
    console.log(`Created/Found Building "Tower A" ID: ${buildingId}`);

    // 3. Create Floors 1, 2, 3
    for (let fNum = 1; fNum <= 3; fNum++) {
      await sql`
        INSERT INTO floors (building_id, name, floor_number)
        VALUES (${buildingId}, ${'Floor ' + fNum}, ${fNum})
        ON CONFLICT (building_id, floor_number) DO NOTHING
      `;
    }
    const floorsResult = await sql`SELECT id, floor_number FROM floors WHERE building_id = ${buildingId}`;
    console.log(`Created/Found ${floorsResult.length} floors.`);

    // 4. Create Units (101, 102, 201, 202, 301, 302)
    let unitCount = 0;
    for (const floor of floorsResult) {
      const fNum = floor.floor_number;
      const fId = floor.id;
      
      const labels = [`${fNum}01`, `${fNum}02`].map(String);
      for (const label of labels) {
        const layout = label.endsWith("1") ? "2BHK" : "3BHK";
        const rate = label.endsWith("1") ? 25000.00 : 32000.00;
        const sqft = label.endsWith("1") ? 1200 : 1600;
        const maxOcc = label.endsWith("1") ? 4 : 6;

        await sql`
          INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status)
          VALUES (
            ${fId}, 
            'apartment'::unit_type, 
            ${label}, 
            ${layout}, 
            ${sqft}, 
            ${maxOcc}, 
            ${rate}, 
            'vacant'::room_status
          )
          ON CONFLICT (floor_id, unit_label) DO NOTHING
        `;
        unitCount++;
      }
    }

    console.log(`✅ Success! Seeded/Confirmed ${unitCount} apartment units for Greenwood Residency.`);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
