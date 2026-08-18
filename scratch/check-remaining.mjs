import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
for (const t of ['guest_feedbacks', 'deposit_ledger', 'asset_register', 'bill_payments']) {
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='viswa' AND table_name=${t}`;
  console.log(`${t} cols:`, cols.map(c => c.column_name).join(', '));
}
