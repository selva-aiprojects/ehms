import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

try {
  await sql.query(`SET search_path TO viswa, public`);
  try {
    await sql.query(`SELECT je.*, u.name as created_by_name FROM journal_entries je LEFT JOIN users u ON u.id = je.created_by LIMIT 1`);
    console.log("journal_entries query: SUCCESS");
  } catch (e) {
    console.log("journal_entries query ERROR:", e.message);
  }

  try {
    await sql.query(`SELECT vb.*, v.name as vendor_name, v.code as vendor_code FROM vendor_bills vb LEFT JOIN vendors v ON v.id = vb.vendor_id LIMIT 1`);
    console.log("vendor_bills query: SUCCESS");
  } catch (e) {
    console.log("vendor_bills query ERROR:", e.message);
  }
} catch (e) {
  console.error("Connection error:", e);
}
