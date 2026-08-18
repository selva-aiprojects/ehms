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

async function enrichJournalData() {
  try {
    console.log("=== Enriching Journal Entries and Lines for Viswa Demo ===");

    // 1. Get properties
    const props = await runInSchema("SELECT id, name FROM properties LIMIT 5");
    const defaultPropId = props.length > 0 ? props[0].id : null;

    // 2. Check and get/create accounts in chart_of_accounts
    const accountDefs = [
      { code: "INC-FB", name: "Food & Beverage Revenue", type: "income" },
      { code: "INC-BNQ", name: "Banquet Revenue", type: "income" },
      { code: "INC-OTH", name: "Other Services Revenue", type: "income" },
      { code: "EXP-SAL", name: "Staff Salaries Expense", type: "expense" },
      { code: "EXP-VND", name: "Vendor Services Expense", type: "expense" },
      { code: "EXP-UTL", name: "Utilities Expense", type: "expense" },
      { code: "EXP-MNT", name: "Maintenance & Repairs Expense", type: "expense" },
      { code: "AST-BNK1", name: "HDFC Corporate Bank Account", type: "asset" },
      { code: "AST-BNK2", name: "ICICI Operating Bank Account", type: "asset" },
      { code: "LIA-AP", name: "Accounts Payable Control", type: "liability" }
    ];

    const accountIds = {};

    for (const def of accountDefs) {
      const existing = await runInSchema("SELECT id FROM chart_of_accounts WHERE account_code = $1 OR account_name = $2 LIMIT 1", [def.code, def.name]);
      if (existing.length > 0) {
        accountIds[def.code] = existing[0].id;
      } else {
        const inserted = await runInSchema(`
          INSERT INTO chart_of_accounts (property_id, account_code, account_name, account_type, is_active, opening_balance)
          VALUES ($1, $2, $3, $4, true, 0)
          RETURNING id
        `, [defaultPropId, def.code, def.name, def.type]);
        accountIds[def.code] = inserted[0].id;
        console.log(`Created account: ${def.name} (${def.code})`);
      }
    }

    // 3. Create realistic posted journal entries for recent months (April, May, June 2026)
    const txns = [
      // F&B Revenue collections into HDFC Bank
      { date: "2026-06-15", desc: "F&B POS Collections - June Week 2", drCode: "AST-BNK1", crCode: "INC-FB", amount: 285000 },
      { date: "2026-06-08", desc: "F&B POS Collections - June Week 1", drCode: "AST-BNK1", crCode: "INC-FB", amount: 310000 },
      { date: "2026-05-28", desc: "F&B POS Collections - May Month End", drCode: "AST-BNK1", crCode: "INC-FB", amount: 420000 },
      // Banquet Revenue collections into ICICI Bank
      { date: "2026-06-12", desc: "Banquet Booking - Corporate Seminar", drCode: "AST-BNK2", crCode: "INC-BNQ", amount: 180000 },
      { date: "2026-05-20", desc: "Banquet Booking - Wedding Reception", drCode: "AST-BNK2", crCode: "INC-BNQ", amount: 350000 },
      // Other services
      { date: "2026-06-10", desc: "Spa & Wellness Collections", drCode: "AST-BNK1", crCode: "INC-OTH", amount: 95000 },
      // Salary disbursements from ICICI Bank
      { date: "2026-06-01", desc: "May 2026 Staff Salary Disbursement", drCode: "EXP-SAL", crCode: "AST-BNK2", amount: 1250000 },
      { date: "2026-05-01", desc: "April 2026 Staff Salary Disbursement", drCode: "EXP-SAL", crCode: "AST-BNK2", amount: 1220000 },
      // Vendor bills & payments
      { date: "2026-06-14", desc: "Housekeeping & Laundry Vendor Payment", drCode: "EXP-VND", crCode: "AST-BNK1", amount: 320000 },
      { date: "2026-05-15", desc: "Security Services Vendor Payment", drCode: "EXP-VND", crCode: "AST-BNK1", amount: 260000 },
      // Utilities
      { date: "2026-06-05", desc: "Electricity & Water Bill Payment - May", drCode: "EXP-UTL", crCode: "AST-BNK1", amount: 145000 },
      { date: "2026-05-05", desc: "Electricity & Water Bill Payment - April", drCode: "EXP-UTL", crCode: "AST-BNK1", amount: 138000 },
      // Maintenance
      { date: "2026-06-11", desc: "HVAC Annual Maintenance Contract", drCode: "EXP-MNT", crCode: "AST-BNK2", amount: 110000 },
      { date: "2026-05-18", desc: "Elevator & Plumbing Repairs", drCode: "EXP-MNT", crCode: "AST-BNK2", amount: 85000 },
    ];

    let insertedCount = 0;
    for (const t of txns) {
      const drId = accountIds[t.drCode];
      const crId = accountIds[t.crCode];
      if (!drId || !crId) continue;

      // Check if entry already exists
      const existingJe = await runInSchema("SELECT id FROM journal_entries WHERE entry_date = $1::date AND description = $2 LIMIT 1", [t.date, t.desc]);
      if (existingJe.length > 0) continue;

      // Insert journal entry
      const je = await runInSchema(`
        INSERT INTO journal_entries (property_id, entry_date, description, reference_type, journal_type, is_posted, posted_at)
        VALUES ($1, $2::date, $3, 'AUTO-ENRICH', 'general', true, now())
        RETURNING id
      `, [defaultPropId, t.date, t.desc]);

      const jeId = je[0].id;

      // Insert debit line
      await runInSchema(`
        INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
        VALUES ($1, $2, $3, 0, $4)
      `, [jeId, drId, t.amount, t.desc]);

      // Insert credit line
      await runInSchema(`
        INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
        VALUES ($1, $2, 0, $3, $4)
      `, [jeId, crId, t.amount, t.desc]);

      insertedCount++;
    }

    console.log(`Successfully inserted ${insertedCount} new posted journal entries and lines!`);

    // 4. Verify new totals
    const jl = await runInSchema(`
      SELECT ca.account_name, ca.account_type, SUM(jl.debit) as total_debit, SUM(jl.credit) as total_credit
      FROM journal_lines jl
      JOIN chart_of_accounts ca ON ca.id = jl.account_id
      JOIN journal_entries je ON je.id = jl.journal_id AND je.is_posted = true
      GROUP BY ca.account_name, ca.account_type
      ORDER BY ca.account_type, ca.account_name
    `);
    console.log("Updated Accounts with posted journal lines:");
    console.table(jl);

  } catch (e) {
    console.error("Error enriching journal data:", e);
  }
}

enrichJournalData();
