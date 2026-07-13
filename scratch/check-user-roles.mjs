import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema='viswa' AND table_name='user_roles'`;
console.log("user_roles cols:", cols.map(c => c.column_name).join(', '));
const roles = await sql`SELECT u.email, ur.property_id FROM viswa.users u JOIN viswa.user_roles ur ON u.id = ur.user_id LIMIT 10`;
console.log("user roles sample:", roles);
