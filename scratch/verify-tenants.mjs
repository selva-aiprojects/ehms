import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

async function verify() {
  const tenants = await sql`SELECT code, name, schema_name FROM public.tenants`;
  console.log("Current tenants in public.tenants:", tenants);
}

verify().catch(console.error);
