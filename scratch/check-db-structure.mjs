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

async function main() {
  console.log("Checking schemas and tables...");
  
  try {
    const schemas = await sql`SELECT schema_name FROM information_schema.schemata`;
    console.log("Schemas:", schemas.map(s => s.schema_name).join(", "));
    
    const tables = await sql`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema') 
      ORDER BY table_schema, table_name
    `;
    console.log(`\nFound ${tables.length} tables:`);
    for (const t of tables) {
      if (t.table_name === 'properties' || t.table_name === 'tenants' || t.table_schema === 'viswa') {
        console.log(`  ${t.table_schema}.${t.table_name}`);
      }
    }

    const propsPublic = await sql`SELECT id, name, code, vertical_type, is_active FROM public.properties ORDER BY name`;
    console.log(`\nProperties in public.properties (${propsPublic.length}):`);
    for (const p of propsPublic) {
      console.log(`  [${p.code}] ${p.name} (vertical: ${p.vertical_type}, id: ${p.id})`);
    }

    const tenants = await sql`SELECT id, code, name, schema_name FROM public.tenants ORDER BY code`;
    console.log(`\nTenants in public.tenants (${tenants.length}):`);
    for (const t of tenants) {
      console.log(`  [${t.code}] ${t.name} -> schema: ${t.schema_name}`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
