import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
const tables = [
  "inventory_categories", "warehouses", "corporate_accounts", "corporate_members", "goods_received_notes", "grn_lines"
];

for (const t of tables) {
  const cols = await sql.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'viswa' AND table_name = '${t}'
    ORDER BY ordinal_position
  `);
  console.log(`\n--- ${t} ---`);
  console.log(cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
}
