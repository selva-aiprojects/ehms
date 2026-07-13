import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

async function inspect() {
  const tenants = await sql`SELECT id, name, code, schema_name, config FROM public.tenants WHERE code = 'VISWA'`;
  console.log("VISWA Tenant:", JSON.stringify(tenants, null, 2));

  const props = await sql`SELECT id, name, code, vertical_type, is_active FROM viswa.properties`;
  console.log("viswa.properties:", JSON.stringify(props, null, 2));
}

inspect().catch(console.error);
