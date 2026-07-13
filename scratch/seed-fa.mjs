import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

const props = await sql`SELECT id, name, code, vertical_type FROM viswa.properties`;

console.log("Seeding Fixed Assets...");
const fAssets = [
  { code: "FA-CHND-01", name: "Grand Crystal Lobby Chandelier", cat: "Fixtures & Fittings", cost: 450000, life: 10, loc: "Main Lobby" },
  { code: "FA-GEN-02", name: "100 KVA Silent Diesel Generator", cat: "Plant & Machinery", cost: 850000, life: 15, loc: "Utility Area" },
  { code: "FA-DISH-03", name: "Industrial Conveyor Dishwasher 20kW", cat: "Kitchen Equipment", cost: 320000, life: 8, loc: "Main Kitchen" },
  { code: "FA-GYM-04", name: "Commercial Motorized Treadmill Pro", cat: "Gym & Fitness", cost: 210000, life: 6, loc: "Fitness Center" },
];
for (const p of props) {
  for (const fa of fAssets) {
    await sql`
      INSERT INTO viswa.fixed_assets (
        id, property_id, asset_code, asset_name, category, purchase_date, purchase_cost,
        salvage_value, useful_life_yrs, depreciation_method, accumulated_dep,
        status, location, notes, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${p.id}, ${fa.code + '-' + p.code}, ${fa.name}, ${fa.cat}, '2025-06-15', ${fa.cost},
        ${fa.cost * 0.1}, ${fa.life}, 'Straight Line', ${fa.cost * 0.15},
        'active', ${fa.loc + ' (' + p.name + ')'}, 'Capital expenditure asset.', NOW(), NOW()
      )
    `;
  }
}
console.log("✅ Successfully seeded Fixed Assets!");
