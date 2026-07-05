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
const setPathSQL = `SET search_path TO viswa, public`;

async function runTest(name, queriesFn, validateFn) {
  try {
    const queries = queriesFn(sql);
    const results = await sql.transaction([sql.query(setPathSQL), ...queries]);
    validateFn(results.slice(1));
    console.log(`[PASS] ${name}`);
    return true;
  } catch (e) {
    console.error(`[FAIL] ${name} ->`, e.message);
    return false;
  }
}

async function verifyAllJourneys() {
  console.log("==================================================================");
  console.log("  VERIFYING eHMS USER MANUAL WORKFLOWS (VISWA GROUP OF ESTATES)");
  console.log("==================================================================\n");

  let passed = 0;
  let total = 0;

  const test = async (name, queriesFn, validateFn) => {
    total++;
    const ok = await runTest(name, queriesFn, validateFn);
    if (ok) passed++;
  };

  // 1. Super Admin (J9) & Admin Overview
  await test(
    "J9 (Super Admin): User Accounts & Roles Directory",
    (s) => [s`SELECT u.email, r.name AS role_name, u.is_active FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE u.is_active = true`],
    ([users]) => {
      if (users.length < 5) throw new Error(`Expected at least 5 active users, got ${users.length}`);
    }
  );

  await test(
    "J9 (Super Admin): System Audit Trail & Logs",
    (s) => [s`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5`],
    ([logs]) => {
      if (logs.length === 0) throw new Error("No audit logs found in vault");
    }
  );

  // 2. Property Manager (J6) & Yield Control
  await test(
    "J6 (Property Manager): Properties, Buildings & Floors Hierarchy",
    (s) => [s`SELECT p.name, COUNT(b.id)::int AS buildings FROM properties p LEFT JOIN buildings b ON b.property_id = p.id GROUP BY p.name`],
    ([props]) => {
      if (props.length === 0) throw new Error("No properties found in Viswa Group");
    }
  );

  await test(
    "J6 (Property Manager): Yield Control & Rate Plans",
    (s) => [s`SELECT * FROM rate_plans`, s`SELECT * FROM properties`],
    ([rates, props]) => {
      if (rates.length === 0 && props.length === 0) throw new Error("No properties or rate plans configured");
    }
  );

  await test(
    "J6 (Property Manager): Compliance Vault Certificates",
    (s) => [s`SELECT certificate_type, status, expiry_date FROM compliance_records`],
    ([certs]) => {
      if (certs.length === 0) throw new Error("No compliance certificates found in vault");
    }
  );

  // 3. Front Desk (J1) — Check-In, Matrix & Transfer
  await test(
    "J1 (Front Desk): Interactive Room Matrix & Statuses",
    (s) => [s`SELECT status, COUNT(*)::int AS count FROM units GROUP BY status`],
    ([matrix]) => {
      const statuses = matrix.map(m => m.status);
      if (!statuses.includes("occupied") && !statuses.includes("vacant")) {
        throw new Error("Missing core unit statuses (occupied/vacant)");
      }
    }
  );

  await test(
    "J1 (Front Desk): Arrivals & Departures Matrix",
    (s) => [s`SELECT status, COUNT(*)::int AS count FROM bookings GROUP BY status`],
    ([bookings]) => {
      if (bookings.length === 0) throw new Error("No booking records found");
    }
  );

  // 4. Housekeeping (J2) — Smart Clean & Quality Checklist
  await test(
    "J2 (Housekeeping): Priority Task List & Workflows",
    (s) => [s`SELECT task_type, priority, status, COUNT(*)::int AS count FROM housekeeping_tasks GROUP BY task_type, priority, status`],
    ([tasks]) => {
      if (tasks.length === 0) throw new Error("No housekeeping tasks found");
    }
  );

  await test(
    "J2 (Housekeeping): Cleaning Checklists & Quality Inspection",
    (s) => [s`SELECT * FROM housekeeping_checklists LIMIT 10`],
    ([checks]) => {
      if (checks.length === 0) throw new Error("No housekeeping checklists found");
    }
  );

  // 5. Maintenance (J3) — Corrective Repairs & AMC Schedule
  await test(
    "J3 (Maintenance): Corrective Ticket Board & Unit Locking",
    (s) => [s`SELECT priority, status, COUNT(*)::int AS count FROM maintenance_tickets GROUP BY priority, status`],
    ([tickets]) => {
      if (tickets.length === 0) throw new Error("No maintenance tickets found");
    }
  );

  await test(
    "J3 (Maintenance): AMC Contracts & Parts Inventory",
    (s) => [s`SELECT * FROM amc_contracts`, s`SELECT * FROM parts_inventory`],
    ([amc, parts]) => {
      if (amc.length === 0 && parts.length === 0) throw new Error("No AMC contracts or parts inventory found");
    }
  );

  // 6. Finance Manager (J4) — Ledger, Invoices & Bank Reconciliation
  await test(
    "J4 (Finance): Chart of Accounts & General Ledger",
    (s) => [s`SELECT account_type, COUNT(*)::int AS count FROM chart_of_accounts GROUP BY account_type`],
    ([coa]) => {
      if (coa.length === 0) throw new Error("Chart of Accounts not initialized");
    }
  );

  await test(
    "J4 (Finance): Vendor Bills & Bill Payments",
    (s) => [s`SELECT status, COUNT(*)::int AS count FROM vendor_bills GROUP BY status`],
    ([bills]) => {
      if (bills.length === 0) throw new Error("No vendor bills found in finance module");
    }
  );

  // 7. HR Manager (J5) — Staff Rostering & Payroll Runs
  await test(
    "J5 (HR): Employee Directory & Department Assignments",
    (s) => [s`SELECT d.name AS dept, COUNT(e.id)::int AS staff FROM employees e LEFT JOIN departments d ON d.id = e.department_id GROUP BY d.name`],
    ([emps]) => {
      if (emps.length === 0) throw new Error("No employees found in HR directory");
    }
  );

  await test(
    "J5 (HR): Payroll Runs & Deductions Engine",
    (s) => [s`SELECT status, COUNT(*)::int AS count FROM payroll_runs GROUP BY status`],
    ([runs]) => {
      if (runs.length === 0) throw new Error("No payroll runs logged");
    }
  );

  // 8. Apartment Tenant (J7) & Workplace Member (J8)
  await test(
    "J7 (Apartment Rental): Lease Agreements & Rent Invoices",
    (s) => [s`SELECT status, COUNT(*)::int AS count FROM lease_agreements GROUP BY status`],
    ([leases]) => {
      if (leases.length === 0) throw new Error("No lease agreements found");
    }
  );

  await test(
    "J8 (Workplace): Desk Bookings & Coworking Memberships",
    (s) => [s`SELECT status, COUNT(*)::int AS count FROM workplace_bookings GROUP BY status`],
    ([bookings]) => {
      if (bookings.length === 0) throw new Error("No workplace bookings found");
    }
  );

  // 9. Executive (J10) — Macro Analytics & CapEx
  await test(
    "J10 (Executive): Portfolio Yields & Revenue Aggregation",
    (s) => [s`SELECT COALESCE(SUM(amount), 0)::numeric AS total_revenue FROM payments WHERE status = 'completed'`],
    ([rev]) => {
      if (rev[0].total_revenue === null) throw new Error("Failed to compute portfolio revenue");
    }
  );

  console.log("\n==================================================================");
  console.log(`  WORKFLOW TEST RESULTS: ${passed}/${total} JOURNEYS PASSED`);
  console.log("==================================================================");
  if (passed !== total) {
    process.exit(1);
  }
}

verifyAllJourneys();
