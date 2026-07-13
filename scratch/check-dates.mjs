import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
const [_, bSample, rSample] = await sql.transaction([
  sql.query(`SET search_path TO viswa, public`),
  sql.query(`SELECT * FROM bookings LIMIT 1`),
  sql.query(`SELECT * FROM rent_invoices LIMIT 1`)
]);
console.log("bookings cols:", Object.keys(bSample[0] || {}));
console.log("rent_invoices cols:", Object.keys(rSample[0] || {}));
