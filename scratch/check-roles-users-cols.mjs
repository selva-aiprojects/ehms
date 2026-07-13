import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
const uCols = await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='viswa' AND table_name='users'`;
console.log("users cols:", uCols.map(c => `${c.column_name}(${c.data_type})`).join(', '));
const roles = await sql`SELECT id, name, code FROM viswa.roles`;
console.log("roles:", roles);
