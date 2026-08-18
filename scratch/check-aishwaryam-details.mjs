import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const content = readFileSync(envPath, "utf-8");
let dbUrl = "";

for (const line of content.split("\n")) {
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=")) {
    dbUrl = t.slice("DATABASE_URL=".length).replace(/['"]/g, "");
  }
}

const sql = neon(dbUrl);

async function inspect() {
  console.log("=== PUBLIC.TENANTS ===");
  const tenants = await sql`SELECT id, name, code, schema_name, contact_email, is_active, config FROM public.tenants`;
  for (const t of tenants) {
    console.log(`Tenant: ${t.name} | Code: ${t.code} | Schema: ${t.schema_name} | Contact: ${t.contact_email} | Active: ${t.is_active}`);
    try {
      const schema = t.schema_name;
      const roles = await sql.query(`SELECT id, name FROM ${schema}.roles`);
      console.log(`  Roles in ${schema}:`, roles);
      const userRoles = await sql.query(`SELECT * FROM ${schema}.user_roles`);
      console.log(`  UserRoles in ${schema}:`, userRoles);
      const users = await sql.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, r.name as role_name
        FROM ${schema}.users u
        LEFT JOIN ${schema}.user_roles ur ON ur.user_id = u.id
        LEFT JOIN ${schema}.roles r ON r.id = ur.role_id
      `);
      console.log(`  Users in ${schema}:`, users);
    } catch (err) {
      console.log(`  Could not query users in ${t.schema_name}:`, err.message);
    }
  }
}

inspect();
