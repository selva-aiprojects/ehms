import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

async function listAll() {
  const rows = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='viswa' AND table_type='BASE TABLE' ORDER BY table_name`;
  console.log(rows.map(r => r.table_name).join("\n"));
}

listAll().catch(console.error);
