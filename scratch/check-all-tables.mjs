import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

const tables = [
  "guest_profiles", "asset_register", "fixed_assets", "deposit_ledger", "goods_received_notes", "parts_inventory", "purchase_orders", "inventory_items", "amc_contracts", "preventive_schedules", "workplace_bookings"
];

for (const t of tables) {
  try {
    const res = await sql.query(`SELECT COUNT(*)::int as cnt FROM viswa.${t}`);
    console.log(`${t.padEnd(25)} : ${res[0].cnt} rows`);
  } catch (e) {
    console.log(`${t.padEnd(25)} : ERROR ${e.message.split('\n')[0]}`);
  }
}
