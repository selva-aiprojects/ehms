import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

try {
  const [_, vendors] = await sql.transaction([
    sql.query(`SET search_path TO viswa, public`),
    sql.query(`SELECT * FROM vendors LIMIT 1`)
  ]);
  console.log("Vendors columns:", Object.keys(vendors[0] || {}));

  try {
    const [__, vb] = await sql.transaction([
      sql.query(`SET search_path TO viswa, public`),
      sql.query(`SELECT vb.*, v.name as vendor_name, v.code as vendor_code FROM vendor_bills vb LEFT JOIN vendors v ON v.id = vb.vendor_id LIMIT 1`)
    ]);
    console.log("Vendor bills query: SUCCESS, rows:", vb.length);
  } catch (e) {
    console.log("Vendor bills query ERROR:", e.message);
  }

  try {
    const [___, je] = await sql.transaction([
      sql.query(`SET search_path TO viswa, public`),
      sql.query(`SELECT je.*, u.name as created_by_name FROM journal_entries je LEFT JOIN users u ON u.id = je.created_by LIMIT 1`)
    ]);
    console.log("Journal entries query: SUCCESS, rows:", je.length);
  } catch (e) {
    console.log("Journal entries query ERROR:", e.message);
  }
} catch (e) {
  console.error("Error:", e);
}
