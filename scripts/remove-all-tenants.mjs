/**
 * remove-all-tenants.mjs
 * Drops all tenant schemas (except viswa) and removes their records from public.tenants.
 */
import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
if (!dbUrlMatch) {
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}
const sql = neon(dbUrlMatch[1]);

async function removeAllTenants() {
  console.log("=== Removing all non-viswa tenant schemas and registry records ===");
  // Note: we query information_schema.schemata in case registry records were deleted
  const schemas = await sql`
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name NOT IN ('public', 'viswa', 'information_schema', 'pg_catalog', 'pg_toast')
    AND schema_name NOT LIKE 'pg_temp_%' AND schema_name NOT LIKE 'pg_toast_temp_%'
  `;
  console.log(`Found ${schemas.length} schemas to drop:`, schemas.map(s => s.schema_name));

  for (const s of schemas) {
    const name = s.schema_name;
    console.log(`Dropping schema "${name}" CASCADE...`);
    try {
      await sql.query(`DROP SCHEMA IF EXISTS "${name}" CASCADE`);
      console.log(`  ✓ Dropped schema "${name}"`);
    } catch (e) {
      console.error(`  ❌ Error dropping schema "${name}":`, e.message);
    }
  }

  console.log("Removing registry records from public.tenants WHERE schema_name != 'viswa'...");
  await sql`DELETE FROM public.tenants WHERE schema_name != 'viswa'`;
  console.log("✓ All non-viswa tenants removed cleanly.");
}

removeAllTenants().catch(console.error);
