import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

const vb = await sql`SELECT id, bill_number, bill_date, category, grand_total, status, property_id FROM viswa.vendor_bills`;
console.log("Vendor bills:", vb);

try {
  const pr = await sql`SELECT id, payroll_month, total_gross, total_net, status FROM viswa.payroll_runs`;
  console.log("Payroll runs:", pr);
} catch (e) {
  console.log("Payroll runs error:", e.message);
}

try {
  const emp = await sql`SELECT COUNT(*), SUM(base_salary) as tot_sal FROM viswa.employees`;
  console.log("Employees salary sum:", emp);
} catch (e) {
  console.log("Employees error:", e.message);
}
