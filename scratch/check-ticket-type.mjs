import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
const cols = await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='viswa' AND table_name='maintenance_tickets' AND is_nullable='NO'`;
console.log("maintenance_tickets NOT NULL cols:", cols);
