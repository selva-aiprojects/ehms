import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

const props = await sql`SELECT id, name, code, vertical_type FROM viswa.properties`;
const units = await sql`SELECT id FROM viswa.units LIMIT 10`;

console.log("Seeding Workplace Bookings...");
const bTypes = ["hot_desk", "dedicated_desk", "meeting_room", "conference_hall"];
for (let i = 1; i <= 15; i++) {
  const pId = props[0]?.id;
  const uId = units[i % units.length]?.id || null;
  const bt = bTypes[i % bTypes.length];
  await sql`
    INSERT INTO viswa.workplace_bookings (
      id, property_id, unit_id, booking_type, start_time, end_time, status, total_amount, created_at
    ) VALUES (
      gen_random_uuid(), ${pId}, ${uId}, ${bt}, NOW() + INTERVAL '${sql.unsafe((i-5) + ' days')}', NOW() + INTERVAL '${sql.unsafe((i-5) + ' days 4 hours')}', 'confirmed', ${i * 450}, NOW()
    )
  `;
}
console.log("✅ Successfully seeded Workplace Bookings!");
