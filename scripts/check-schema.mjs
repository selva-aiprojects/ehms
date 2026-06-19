import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf-8");
let DB_URL = "";
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("DATABASE_URL=")) {
    DB_URL = trimmed.slice("DATABASE_URL=".length);
    break;
  }
}

const sql = neon(DB_URL);

const [laCols, invCols, payStats, monthly] = await Promise.all([
  sql`SELECT column_name FROM information_schema.columns WHERE table_name='lease_agreements' AND table_schema='public' ORDER BY ordinal_position`,
  sql`SELECT column_name FROM information_schema.columns WHERE table_name='invoices' AND table_schema='public' ORDER BY ordinal_position`,
  sql`SELECT COUNT(*)::int AS cnt, COALESCE(SUM(amount::numeric),0) AS total FROM payments WHERE status='completed'`,
  sql`SELECT TO_CHAR(payment_date,'YYYY-MM') AS m, COUNT(*)::int AS cnt, SUM(amount::numeric) AS rev FROM payments WHERE status='completed' GROUP BY 1 ORDER BY 1`,
]);

console.log("lease_agreements columns:", laCols.map(r => r.column_name).join(", "));
console.log("invoices columns:", invCols.map(r => r.column_name).join(", "));
console.log("payments:", payStats[0]);
console.log("monthly revenue data:");
monthly.forEach(r => console.log(`  ${r.m}: ${r.cnt} payments, ₹${Number(r.rev).toLocaleString()}`));
