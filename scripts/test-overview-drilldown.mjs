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

async function runInSchema(queryFn) {
  const results = await sql.transaction([
    sql.query("SET search_path TO viswa, public"),
    queryFn(sql)
  ]);
  return results[1];
}

async function testDrilldownQueries() {
  try {
    console.log("=== Testing Drilldown Queries in viswa schema ===");

    // 1. Employees
    console.log("\n--- EMPLOYEES ---");
    const employees = await runInSchema((s) => s`
      SELECT
        e.employee_code,
        COALESCE(u.first_name || ' ' || COALESCE(u.last_name, ''), 'Staff ' || e.employee_code) AS employee_name,
        d.name AS department,
        e.designation,
        e.employment_type,
        e.doj
      FROM employees e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.is_active = true
      ORDER BY e.created_at DESC
      LIMIT 10
    `);
    console.log(`Found ${employees.length} employees:`, employees.slice(0, 3));

    // 2. Rooms (Units)
    console.log("\n--- ROOMS / UNITS ---");
    const rooms = await runInSchema((s) => s`
      SELECT
        u.unit_label AS room_no,
        u.unit_type AS type,
        u.layout_type AS layout,
        u.status,
        u.base_rate AS rate,
        f.name AS floor,
        b.name AS building
      FROM units u
      JOIN floors f ON f.id = u.floor_id
      JOIN buildings b ON b.id = f.building_id
      WHERE u.is_active = true
      ORDER BY b.name, f.floor_number, u.unit_label
      LIMIT 10
    `);
    console.log(`Found ${rooms.length} rooms:`, rooms.slice(0, 3));

    // 3. Feedbacks
    console.log("\n--- FEEDBACKS ---");
    const feedbacks = await runInSchema((s) => s`
      SELECT gf.rating, gf.department, COALESCE(gf.comments, 'No comment') AS comments, gf.created_at,
        COALESCE(gp.first_name || ' ' || COALESCE(gp.last_name, ''), 'Anonymous Guest') AS guest_name
      FROM guest_feedbacks gf
      LEFT JOIN guest_profiles gp ON gp.id = gf.guest_id
      ORDER BY gf.created_at DESC
      LIMIT 10
    `);
    console.log(`Found ${feedbacks.length} feedbacks:`, feedbacks.slice(0, 3));

    // 4. Issues - Vendor Bills
    console.log("\n--- ISSUES: VENDOR BILLS ---");
    const vendorBills = await runInSchema((s) => s`
      SELECT vb.bill_number, vb.bill_date, vb.due_date, vb.grand_total, vb.status,
        COALESCE(v.company_name, 'Unknown Vendor') AS vendor_name
      FROM vendor_bills vb
      LEFT JOIN vendors v ON v.id = vb.vendor_id
      WHERE vb.status IN ('pending', 'overdue')
      ORDER BY vb.due_date ASC
      LIMIT 10
    `);
    console.log(`Found ${vendorBills.length} vendor bills:`, vendorBills.slice(0, 3));

    // 5. Issues - HK Tasks
    console.log("\n--- ISSUES: HK TASKS ---");
    const hkTasks = await runInSchema((s) => s`
      SELECT h.task_type, h.priority, h.status, COALESCE(h.scheduled_at, h.created_at) AS scheduled_at,
        COALESCE(u.unit_label, 'General') AS unit
      FROM housekeeping_tasks h
      LEFT JOIN units u ON u.id = h.unit_id
      WHERE h.status IN ('open', 'assigned', 'in_progress')
      ORDER BY COALESCE(h.scheduled_at, h.created_at) DESC
      LIMIT 10
    `);
    console.log(`Found ${hkTasks.length} hk tasks:`, hkTasks.slice(0, 3));

    // 6. Issues - Maintenance Tickets
    console.log("\n--- ISSUES: MAINTENANCE TICKETS ---");
    const maintTickets = await runInSchema((s) => s`
      SELECT mt.ticket_number, mt.title, mt.priority, mt.status, mt.created_at,
        COALESCE(u.unit_label, 'Property Wide') AS unit
      FROM maintenance_tickets mt
      LEFT JOIN units u ON u.id = mt.unit_id
      WHERE mt.status IN ('open', 'assigned', 'in_progress')
      ORDER BY mt.created_at DESC
      LIMIT 10
    `);
    console.log(`Found ${maintTickets.length} maintenance tickets:`, maintTickets.slice(0, 3));

    // 7. Issues - Guest Requests
    console.log("\n--- ISSUES: GUEST REQUESTS ---");
    const guestRequests = await runInSchema((s) => s`
      SELECT gr.request_type, gr.description, gr.status, gr.created_at,
        COALESCE(u.unit_label, 'Front Desk') AS unit
      FROM guest_requests gr
      LEFT JOIN bookings b ON b.id = gr.booking_id
      LEFT JOIN units u ON u.id = b.unit_id
      WHERE gr.status IN ('pending', 'in_progress')
      ORDER BY gr.created_at DESC
      LIMIT 10
    `);
    console.log(`Found ${guestRequests.length} guest requests:`, guestRequests.slice(0, 3));

  } catch (e) {
    console.error("Error executing drilldown queries:", e);
  }
}

testDrilldownQueries();
