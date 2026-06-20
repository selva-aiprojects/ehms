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

console.log("=== Properties ===");
const props = await sql`SELECT id, name, code, vertical_type FROM properties`;
props.forEach(p => console.log(`  ${p.code}: ${p.name} (${p.vertical_type})`));

console.log("=== Buildings by Property ===");
const blds = await sql`
  SELECT p.code AS property_code, b.name, b.code 
  FROM buildings b 
  JOIN properties p ON b.property_id = p.id
`;
blds.forEach(b => console.log(`  Property ${b.property_code}: Building name=${b.name}, code=${b.code}`));

console.log("=== Floors by Property ===");
const fls = await sql`
  SELECT p.code AS property_code, f.name, f.floor_number 
  FROM floors f 
  JOIN buildings b ON f.building_id = b.id
  JOIN properties p ON b.property_id = p.id
`;
console.log(`Total floors: ${fls.length}`);

console.log("=== Units by Property ===");
const units = await sql`
  SELECT p.code AS property_code, u.unit_type, COUNT(*)::int AS count
  FROM units u
  JOIN floors f ON u.floor_id = f.id
  JOIN buildings b ON f.building_id = b.id
  JOIN properties p ON b.property_id = p.id
  GROUP BY p.code, u.unit_type
`;
units.forEach(u => console.log(`  Property ${u.property_code}: Type ${u.unit_type} count=${u.count}`));
