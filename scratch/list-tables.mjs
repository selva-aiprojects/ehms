import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
const res = await sql.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'viswa' ORDER BY table_name");
console.log(res.map(r => r.table_name));
