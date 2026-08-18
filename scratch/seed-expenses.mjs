import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

const props = await sql`SELECT id, name, code FROM viswa.properties`;

console.log("Categorizing vendor bills...");
const cats = ["Utilities", "Maintenance", "Office Supplies", "F&B Supplies", "Cleaning"];
const vbs = await sql`SELECT id FROM viswa.vendor_bills`;
for (let i = 0; i < vbs.length; i++) {
  const cat = cats[i % cats.length];
  await sql`UPDATE viswa.vendor_bills SET category = ${cat}, status = 'paid' WHERE id = ${vbs[i].id}`;
}

console.log("Seeding Payroll Runs...");
const months = [
  { start: '2026-05-01', end: '2026-05-31', run: '2026-05-28' },
  { start: '2026-06-01', end: '2026-06-30', run: '2026-06-28' },
  { start: '2026-07-01', end: '2026-07-31', run: '2026-07-28' },
];

for (const p of props) {
  for (const m of months) {
    // Check if payroll already exists for this property and month
    const existing = await sql`SELECT id FROM viswa.payroll_runs WHERE property_id = ${p.id} AND period_start = ${m.start}`;
    if (existing.length === 0) {
      const gross = 218000 + Math.floor(Math.random() * 50000);
      await sql`
        INSERT INTO viswa.payroll_runs (
          id, property_id, period_start, period_end, run_date, status,
          total_gross, total_deductions, total_net, created_at
        ) VALUES (
          gen_random_uuid(), ${p.id}, ${m.start}, ${m.end}, ${m.run}, 'paid',
          ${gross}, ${gross * 0.12}, ${gross * 0.88}, NOW()
        )
      `;
    }
  }
}

console.log("✅ Successfully categorized vendor bills and seeded monthly payroll runs for all properties!");
