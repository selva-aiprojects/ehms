import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");

function getEnvVar(name) {
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith(name + "=")) {
      return trimmed.slice(name.length + 1);
    }
  }
  return "";
}

const DB_URL = getEnvVar("DATABASE_URL");
const rawSql = neon(DB_URL);

async function q(text, params = []) {
  const results = await rawSql.transaction([
    rawSql.query("SET search_path TO viswa, public"),
    rawSql.query(text, params),
  ]);
  return results[1];
}

async function seedAuditLogs() {
  console.log("=== Seeding audit_logs for Viswa tenant ===");

  // Get existing user IDs
  const users = await q("SELECT id, first_name, last_name, email FROM users LIMIT 10");
  console.log(`Found ${users.length} users`);

  if (users.length === 0) {
    console.error("No users found in viswa schema. Run seed first.");
    process.exit(1);
  }

  // Get some entity IDs
  const properties = await q("SELECT id FROM properties LIMIT 4");
  const units = await q("SELECT id FROM units LIMIT 4");

  const propId = properties[0]?.id || "00000000-0000-0000-0000-000000000001";
  const unitId = units[0]?.id || "00000000-0000-0000-0000-000000000001";

  const now = new Date();
  const logs = [];

  for (let i = 0; i < 30; i++) {
    const user = users[i % users.length];
    const offsetHours = i * 2;
    const ts = new Date(now.getTime() - offsetHours * 60 * 60 * 1000).toISOString();
    
    const actions = [
      { action: "LOGIN", entity_type: "user", entity_id: user.id },
      { action: "UPDATE", entity_type: "property", entity_id: propId },
      { action: "CREATE", entity_type: "reservation", entity_id: "00000000-0000-0000-0000-000000000002" },
      { action: "UPDATE", entity_type: "unit", entity_id: unitId },
      { action: "DELETE", entity_type: "audit_log", entity_id: "00000000-0000-0000-0000-000000000003" },
      { action: "READ",   entity_type: "invoice", entity_id: "00000000-0000-0000-0000-000000000004" },
      { action: "CREATE", entity_type: "housekeeping_task", entity_id: "00000000-0000-0000-0000-000000000005" },
      { action: "UPDATE", entity_type: "maintenance_ticket", entity_id: "00000000-0000-0000-0000-000000000006" },
    ];
    
    const { action, entity_type, entity_id } = actions[i % actions.length];
    logs.push({ user_id: user.id, action, entity_type, entity_id, created_at: ts });
  }

  let seeded = 0;
  for (const log of logs) {
    await q(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, created_at)
       VALUES ($1, $2, $3, $4::uuid, $5, $6)`,
      [log.user_id, log.action, log.entity_type, log.entity_id, "192.168.1.1", log.created_at]
    );
    seeded++;
  }

  console.log(`✅ Seeded ${seeded} audit log records.`);

  const check = await q("SELECT COUNT(*) as count FROM audit_logs");
  console.log(`Total audit_logs in viswa schema: ${check[0]?.count}`);
}

seedAuditLogs().catch(console.error);
