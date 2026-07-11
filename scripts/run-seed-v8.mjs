/**
 * run-seed-v8.mjs — Run seed_v8_workflow_certification.sql directly against NeonDB
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR = resolve(__dirname, "../database");
const ENV_PATH = resolve(__dirname, "../.env.local");

function getEnvVar(name) {
  if (!existsSync(ENV_PATH)) {
    console.error(`❌ .env.local not found at ${ENV_PATH}`);
    process.exit(1);
  }
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(name + "=")) {
      return trimmed.slice(name.length + 1).trim();
    }
  }
  return "";
}

const DB_URL = getEnvVar("DATABASE_URL");
if (!DB_URL) {
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DB_URL, max: 1 });

async function main() {
  console.log("▶️ Running seed_v8_workflow_certification.sql...");
  const filePath = join(DATABASE_DIR, "seed_v8_workflow_certification.sql");
  const content = readFileSync(filePath, "utf-8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET search_path TO viswa, public");
    
    console.log("Executing DO block...");
    const res = await client.query(content);
    await client.query("COMMIT");
    console.log("✅ seed_v8_workflow_certification.sql executed successfully!");

    // Verify metrics
    const propRes = await client.query("SELECT id, name, code, star_rating FROM properties WHERE code = 'OVH'");
    console.log("\nProperty Details:", propRes.rows[0]);

    const roomsCount = await client.query(`
      SELECT COUNT(*) as count FROM units u 
      JOIN floors f ON u.floor_id = f.id 
      JOIN buildings b ON f.building_id = b.id 
      WHERE b.property_id = $1
    `, [propRes.rows[0].id]);
    console.log(`Units / Rooms: ${roomsCount.rows[0].count}`);

    const bookingsCount = await client.query("SELECT COUNT(*) as count, status FROM bookings WHERE property_id = $1 GROUP BY status", [propRes.rows[0].id]);
    console.log("Bookings by Status:", bookingsCount.rows);

    const hkCount = await client.query("SELECT COUNT(*) as count, status FROM housekeeping_tasks WHERE property_id = $1 GROUP BY status", [propRes.rows[0].id]);
    console.log("Housekeeping Tasks by Status:", hkCount.rows);

    const mtCount = await client.query("SELECT COUNT(*) as count, status FROM maintenance_tickets WHERE property_id = $1 GROUP BY status", [propRes.rows[0].id]);
    console.log("Maintenance Tickets by Status:", mtCount.rows);

    const fbCount = await client.query("SELECT COUNT(*) as count FROM guest_feedbacks WHERE property_id = $1", [propRes.rows[0].id]);
    console.log(`Guest Feedbacks: ${fbCount.rows[0].count}`);

  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ Error running seed:", err.message);
    if (err.where) console.error("Where:", err.where);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
