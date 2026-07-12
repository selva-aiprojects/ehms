/**
 * delete-tenant.mjs — Securely delete a tenant registry record and drop their PostgreSQL schema.
 * Usage: node scripts/delete-tenant.mjs <TENANT_CODE>
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
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

const tenantCode = process.argv[2];
if (!tenantCode) {
  console.error("❌ Tenant Code is required.\nUsage: node scripts/delete-tenant.mjs <TENANT_CODE>");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DB_URL, max: 1 });

async function main() {
  const client = await pool.connect();
  try {
    const codeUpper = tenantCode.toUpperCase();
    
    // 1. Resolve tenant details
    const tenantRes = await client.query(
      "SELECT id, name, schema_name FROM public.tenants WHERE code = $1",
      [codeUpper]
    );

    if (tenantRes.rows.length === 0) {
      console.error(`❌ No tenant found with code '${codeUpper}'`);
      process.exit(1);
    }

    const { name, schema_name } = tenantRes.rows[0];
    
    console.log(`⚠️  WARNING: You are about to permanently delete the tenant "${name}" (${codeUpper}).`);
    console.log(`🔥 This will DROP the database schema "${schema_name}" and delete all its tables/data.`);
    console.log(`Proceeding in 5 seconds... Press Ctrl+C to abort.`);
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log(`\n▶ Starting deletion of tenant "${name}"...`);

    // 2. Drop the schema
    console.log(`   Dropping PostgreSQL schema "${schema_name}"...`);
    await client.query(`DROP SCHEMA IF EXISTS ${schema_name} CASCADE`);
    console.log(`   ✓ Schema dropped successfully.`);

    // 3. Delete registry row
    console.log(`   Removing tenant registry row from public.tenants...`);
    await client.query(
      "DELETE FROM public.tenants WHERE code = $1",
      [codeUpper]
    );
    console.log(`   ✓ Registry row removed.`);

    console.log(`\n✨ Success: Tenant "${name}" has been completely deleted.`);
  } catch (err) {
    console.error(`❌ Deletion failed: ${err.message}`);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("Script error:", err);
  process.exit(1);
});
