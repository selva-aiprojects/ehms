import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const content = readFileSync(ENV_PATH, "utf-8");
let dbUrl = "";

for (const line of content.split("\n")) {
  const t = line.trim();
  if (t.startsWith("DATABASE_URL=")) {
    dbUrl = t.slice("DATABASE_URL=".length).replace(/['"]/g, "");
  }
}

const sql = neon(dbUrl);

async function checkSamples() {
  try {
    const tables = [
      "chart_of_accounts", "journal_entries", "journal_lines",
      "vendor_bills", "bill_payments", "budget_entries", "budget_heads",
      "tax_filings", "fixed_assets", "invoices", "payments"
    ];

    for (const t of tables) {
      const rows = await sql.query(`SELECT * FROM viswa.${t} LIMIT 1`);
      const count = await sql.query(`SELECT count(*) as c FROM viswa.${t}`);
      console.log(`\n=== viswa.${t} (Count: ${count[0].c}) ===`);
      if (rows.length > 0) {
        console.log("Columns:", Object.keys(rows[0]).join(", "));
        console.log("Sample:", JSON.stringify(rows[0], null, 2));
      } else {
        console.log("EMPTY TABLE");
      }
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

checkSamples();
