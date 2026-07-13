import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);
const [_, payments, bookings, rent] = await sql.transaction([
  sql.query(`SET search_path TO viswa, public`),
  sql.query(`SELECT count(*) as c, SUM(amount) as total FROM bill_payments`),
  sql.query(`SELECT count(*) as c, SUM(total_amount) as total FROM bookings WHERE status IN ('checked_in', 'checked_out')`),
  sql.query(`SELECT count(*) as c, SUM(total_amount) as total FROM rent_invoices WHERE status = 'paid'`)
]);
console.log("bill_payments count & total:", payments[0]);
console.log("bookings revenue:", bookings[0]);
console.log("rent revenue:", rent[0]);
