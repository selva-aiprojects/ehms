import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
for(const t of ['inventory_categories', 'warehouses', 'corporate_accounts', 'corporate_members', 'goods_received_notes', 'grn_lines', 'po_line_items']) {
  try {
    const res = await sql.query('SELECT COUNT(*)::int as cnt FROM viswa.' + t);
    console.log(t.padEnd(25) + ' : ' + res[0].cnt + ' rows');
  } catch(e) {
    console.log(t.padEnd(25) + ' : ' + e.message.split('\n')[0]);
  }
}
