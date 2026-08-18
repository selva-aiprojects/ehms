import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

async function checkFinal() {
  const tables = ['deposit_ledger', 'housekeeping_tasks', 'maintenance_tickets', 'asset_register', 'guest_profiles', 'bookings', 'units', 'properties', 'fiscal_years'];
  for (const t of tables) {
    const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='viswa' AND table_name=${t} ORDER BY ordinal_position`;
    console.log(`\n--- ${t} (${cols.length} cols) ---`);
    console.log(cols.map(c => `${c.column_name} (${c.data_type})`).join(", "));
  }
}

checkFinal().catch(console.error);
