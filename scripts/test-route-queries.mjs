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
const param = null;

async function testAllRouteQueries() {
  const setPathSQL = `SET search_path TO viswa, public`;
  
  const queries = [
    { name: "1. Employees count", fn: (s) => s`SELECT COUNT(*)::int AS count FROM employees e WHERE e.is_active = true AND (${param}::uuid IS NULL OR e.department_id IN (SELECT d.id FROM departments d WHERE d.property_id = ${param}::uuid))` },
    { name: "2. Outstanding issues", fn: (s) => s`SELECT 'Vendor' AS category, COUNT(*)::int AS count FROM vendor_bills WHERE status IN ('pending', 'overdue') AND (${param}::uuid IS NULL OR property_id = ${param}::uuid) UNION ALL SELECT 'Housekeeping' AS category, COUNT(*)::int AS count FROM housekeeping_tasks WHERE status IN ('open', 'assigned', 'in_progress') AND (${param}::uuid IS NULL OR property_id = ${param}::uuid) UNION ALL SELECT 'Maintenance' AS category, COUNT(*)::int AS count FROM maintenance_tickets WHERE status IN ('open', 'assigned', 'in_progress') AND (${param}::uuid IS NULL OR property_id = ${param}::uuid) UNION ALL SELECT 'Other' AS category, COUNT(*)::int AS count FROM guest_requests WHERE status IN ('pending', 'in_progress') AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)` },
    { name: "3. Room status", fn: (s) => s`SELECT u.status, COUNT(*)::int AS count FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE u.is_active = true AND (${param}::uuid IS NULL OR b.property_id = ${param}::uuid) GROUP BY u.status` },
    { name: "4. Feedback counts", fn: (s) => s`SELECT COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today, COUNT(*)::int AS overall FROM guest_feedbacks WHERE ${param}::uuid IS NULL OR property_id = ${param}::uuid` },
    { name: "5. Revenue stats", fn: (s) => s`SELECT COALESCE(NULLIF(SUM(amount), 0), (SELECT COALESCE(SUM(paid_amount),0) FROM bookings WHERE paid_amount > 0 AND status IN ('checked_out','checked_in') AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)))::numeric AS total_revenue FROM payments WHERE status = 'completed' AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)` },
    { name: "6. Expense stats", fn: (s) => s`SELECT COALESCE(SUM(balance_due), 0)::numeric AS expected_expenses FROM vendor_bills WHERE status IN ('pending', 'approved') AND (${param}::uuid IS NULL OR property_id = ${param}::uuid)` },
    { name: "7. Vendor bills detail", fn: (s) => s`SELECT vb.bill_number, vb.bill_date, vb.due_date, vb.grand_total, vb.status, COALESCE(v.company_name, 'Unknown Vendor') AS vendor_name FROM vendor_bills vb LEFT JOIN vendors v ON v.id = vb.vendor_id WHERE vb.status IN ('pending', 'overdue') AND (${param}::uuid IS NULL OR vb.property_id = ${param}::uuid) ORDER BY vb.due_date ASC LIMIT 15` },
    { name: "8. HK tasks detail", fn: (s) => s`SELECT h.task_type, h.priority, h.status, COALESCE(h.scheduled_at, h.created_at) AS scheduled_at, COALESCE(u.unit_label, 'General') AS unit FROM housekeeping_tasks h LEFT JOIN units u ON u.id = h.unit_id WHERE h.status IN ('open', 'assigned', 'in_progress') AND (${param}::uuid IS NULL OR h.property_id = ${param}::uuid) ORDER BY COALESCE(h.scheduled_at, h.created_at) DESC LIMIT 15` },
    { name: "9. Maint tickets detail", fn: (s) => s`SELECT mt.ticket_number, mt.title, mt.priority, mt.status, mt.created_at, COALESCE(u.unit_label, 'Property Wide') AS unit FROM maintenance_tickets mt LEFT JOIN units u ON u.id = mt.unit_id WHERE mt.status IN ('open', 'assigned', 'in_progress') AND (${param}::uuid IS NULL OR mt.property_id = ${param}::uuid) ORDER BY mt.created_at DESC LIMIT 15` },
    { name: "10. Guest requests detail", fn: (s) => s`SELECT gr.request_type, gr.description, gr.status, gr.created_at, COALESCE(u.unit_label, 'Front Desk') AS unit FROM guest_requests gr LEFT JOIN bookings b ON b.id = gr.booking_id LEFT JOIN units u ON u.id = b.unit_id WHERE gr.status IN ('pending', 'in_progress') AND (${param}::uuid IS NULL OR gr.property_id = ${param}::uuid) ORDER BY gr.created_at DESC LIMIT 15` },
    { name: "11. Recent feedbacks", fn: (s) => s`SELECT gf.rating, gf.department, COALESCE(gf.comments, 'No comment') AS comments, gf.created_at, COALESCE(gp.first_name || ' ' || COALESCE(gp.last_name, ''), 'Anonymous Guest') AS guest_name FROM guest_feedbacks gf LEFT JOIN guest_profiles gp ON gp.id = gf.guest_id WHERE ${param}::uuid IS NULL OR gf.property_id = ${param}::uuid ORDER BY gf.created_at DESC LIMIT 15` },
    { name: "12. Recent payments", fn: (s) => s`SELECT amount, payment_method, payment_date, status, property_name FROM (SELECT p.amount, p.payment_method, p.payment_date, p.status, pv.name AS property_name FROM payments p LEFT JOIN properties pv ON pv.id = p.property_id WHERE p.status = 'completed' AND (${param}::uuid IS NULL OR p.property_id = ${param}::uuid) ORDER BY p.payment_date DESC LIMIT 20) t ORDER BY payment_date DESC` },
    { name: "13. Expense detail", fn: (s) => s`SELECT vb.bill_number, vb.bill_date, vb.grand_total, vb.status, COALESCE(v.company_name, 'Unknown Vendor') AS vendor_name FROM vendor_bills vb LEFT JOIN vendors v ON v.id = vb.vendor_id WHERE vb.status IN ('pending', 'approved') AND (${param}::uuid IS NULL OR vb.property_id = ${param}::uuid) ORDER BY vb.bill_date DESC LIMIT 20` },
    { name: "14. Employees detail", fn: (s) => s`SELECT e.employee_code, COALESCE(u.first_name || ' ' || COALESCE(u.last_name, ''), 'Staff ' || e.employee_code) AS employee_name, d.name AS department, e.designation, e.employment_type, e.doj FROM employees e LEFT JOIN users u ON u.id = e.user_id LEFT JOIN departments d ON d.id = e.department_id WHERE e.is_active = true AND (${param}::uuid IS NULL OR d.property_id = ${param}::uuid) ORDER BY e.created_at DESC LIMIT 20` },
    { name: "15. Rooms detail", fn: (s) => s`SELECT u.unit_label AS room_no, u.unit_type AS type, u.layout_type AS layout, u.status, u.base_rate AS rate, f.name AS floor, b.name AS building FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE u.is_active = true AND (${param}::uuid IS NULL OR b.property_id = ${param}::uuid) ORDER BY b.name, f.floor_number, u.unit_label LIMIT 30` },
  ];

  for (const q of queries) {
    try {
      const res = await sql.transaction([
        sql.query(setPathSQL),
        q.fn(sql)
      ]);
      console.log(`[SUCCESS] ${q.name} -> ${res[1].length} rows`);
    } catch (e) {
      console.error(`[FAILED] ${q.name} ->`, e.message);
    }
  }
}

testAllRouteQueries();
