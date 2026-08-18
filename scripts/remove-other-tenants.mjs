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

async function removeOtherTenants() {
  console.log("=== CHECKING PUBLIC TABLES ===");
  const pubTables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;
  console.log("Public tables:", pubTables.map(t => t.table_name));

  console.log("\n=== REMOVING OMEGA AND GRT TENANTS ===");
  const beforeTenants = await sql`SELECT id, name, code, schema_name FROM public.tenants`;
  console.log("Tenants before removal:", beforeTenants);

  // Drop schemas
  console.log("Dropping schema omega CASCADE...");
  await sql`DROP SCHEMA IF EXISTS omega CASCADE`;
  
  console.log("Dropping schema grt CASCADE...");
  await sql`DROP SCHEMA IF EXISTS grt CASCADE`;

  // Delete from public.tenants
  console.log("Deleting OMEGA and GRT from public.tenants...");
  const deleted = await sql`DELETE FROM public.tenants WHERE code IN ('OMEGA', 'GRT') RETURNING code, name`;
  console.log("Deleted tenants:", deleted);

  const afterTenants = await sql`SELECT id, name, code, schema_name, is_active FROM public.tenants`;
  console.log("\nTenants remaining in public.tenants:", afterTenants);
}

removeOtherTenants().catch(err => {
  console.error("Removal failed:", err);
  process.exit(1);
});
