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

const [properties, units, leases, guests] = await Promise.all([
  sql`SELECT COUNT(*)::int AS count FROM properties`,
  sql`SELECT COUNT(*)::int AS count FROM units`,
  sql`SELECT COUNT(*)::int AS count FROM lease_agreements`,
  sql`SELECT COUNT(*)::int AS count FROM guest_profiles`,
]);

console.log("=== DB Counts ===");
console.log("properties count:", properties[0].count);
console.log("units count:", units[0].count);
console.log("lease_agreements count:", leases[0].count);
console.log("guest_profiles count:", guests[0].count);

// Let's also print properties by vertical type
const propsByVertical = await sql`
  SELECT vertical_type, COUNT(*)::int AS count 
  FROM properties 
  GROUP BY vertical_type
`;
console.log("=== Properties by Vertical ===");
propsByVertical.forEach(r => {
  console.log(`  ${r.vertical_type}: ${r.count}`);
});

// Let's print units by status
const unitsByStatus = await sql`
  SELECT status, COUNT(*)::int AS count
  FROM units
  GROUP BY status
`;
console.log("=== Units by Status ===");
unitsByStatus.forEach(r => {
  console.log(`  ${r.status}: ${r.count}`);
});
