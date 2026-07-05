import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
envContent.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
});

const sql = neon(process.env.DATABASE_URL);

async function syncAllTenants() {
  console.log("=== Synchronizing Tenant Workspaces with Properties Tables ===");
  
  // 1. Get all tenants from public.tenants
  const tenants = await sql`SELECT id, name, code, schema_name, config FROM public.tenants WHERE is_active = true`;
  console.log(`Found ${tenants.length} active tenant(s).`);

  const typeMap = {
    "hotels": "hotel",
    "apartments": "service_apartment",
    "rental": "rental_apartment",
    "workplace": "workplace"
  };

  for (const tenant of tenants) {
    const schemaName = tenant.schema_name;
    const config = tenant.config || {};
    const workspaces = config.workspaces || [];
    console.log(`\nProcessing Tenant: [${tenant.code}] ${tenant.name} (schema: ${schemaName})`);
    console.log(`Configured Workspaces:`, JSON.stringify(workspaces, null, 2));

    if (workspaces.length === 0) {
      console.log(`  No workspaces in config. Skipping sync.`);
      continue;
    }

    const setPathSQL = `SET search_path TO ${schemaName}, public`;
    const activeVerticals = workspaces.map(w => typeMap[w.type]).filter(Boolean);

    // Let's check properties before sync
    const beforeProps = await sql.transaction([
      sql.query(setPathSQL),
      sql.query("SELECT id, name, code, vertical_type, is_active FROM properties ORDER BY vertical_type")
    ]);
    console.log(`  Properties before sync:`, beforeProps[1]);

    // Perform sync for each workspace
    for (const ws of workspaces) {
      const dbType = typeMap[ws.type];
      if (!dbType) continue;

      console.log(`  Syncing workspace [${ws.type} -> ${dbType}]: "${ws.name}"...`);
      await sql.transaction([
        sql.query(setPathSQL),
        sql.query("UPDATE properties SET name = $1, is_active = true WHERE vertical_type::text = $2", [ws.name, dbType])
      ]);
    }

    // Deactivate properties not in workspaces
    if (activeVerticals.length > 0) {
      console.log(`  Deactivating properties not in:`, activeVerticals);
      await sql.transaction([
        sql.query(setPathSQL),
        sql.query("UPDATE properties SET is_active = false WHERE vertical_type::text NOT IN (SELECT unnest($1::text[]))", [activeVerticals])
      ]);
    }

    // Let's check properties after sync
    const afterProps = await sql.transaction([
      sql.query(setPathSQL),
      sql.query("SELECT id, name, code, vertical_type, is_active FROM properties ORDER BY vertical_type")
    ]);
    console.log(`  Properties after sync:`, afterProps[1]);
  }
}

syncAllTenants().catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
