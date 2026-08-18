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

async function runInSchema(queryText, params = []) {
  const results = await sql.transaction([
    sql.query("SET search_path TO viswa, public"),
    sql.query(queryText, params)
  ]);
  return results[1];
}

async function testSubmodules() {
  try {
    console.log("=== Testing Submodule Queries in viswa schema ===");

    // 1. Chart of Accounts types
    const types = await runInSchema("SELECT DISTINCT account_type FROM chart_of_accounts");
    console.log("Distinct account_types in chart_of_accounts:", types.map(t => t.account_type));

    // 2. Journal Entries count and date range
    const je = await runInSchema("SELECT MIN(entry_date) as min_date, MAX(entry_date) as max_date, COUNT(*) as count FROM journal_entries WHERE is_posted = true");
    console.log("Posted Journal Entries:", je[0]);

    // 3. Check what accounts have journal lines
    const jl = await runInSchema(`
      SELECT ca.account_name, ca.account_type, SUM(jl.debit) as total_debit, SUM(jl.credit) as total_credit
      FROM journal_lines jl
      JOIN chart_of_accounts ca ON ca.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_id AND je.is_posted = true
      GROUP BY ca.account_name, ca.account_type
    `);
    console.log("Accounts with posted journal lines:", jl);

    console.log("All submodule checks completed successfully!");
  } catch (e) {
    console.error("Error executing submodule queries:", e);
  }
}

testSubmodules();
