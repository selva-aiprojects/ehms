import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
try {
  const [_, res] = await sql.transaction([
    sql.query(`SET search_path TO viswa, public`),
    sql.query(`SELECT count(*) as c FROM payments`)
  ]);
  console.log("viswa.payments count:", res[0].c);
} catch (e) {
  console.log("viswa.payments error:", e.message);
}
