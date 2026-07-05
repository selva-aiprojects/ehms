import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
envContent.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
});

const sql = neon(process.env.DATABASE_URL);

async function seedResidency() {
  console.log("=== SEEDING VISWA RESIDENCY DATA ===");
  const setPathSQL = `SET search_path TO viswa, public`;
  
  // Get Viswa Residency Property ID
  const props = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, name, code FROM properties WHERE vertical_type = 'rental_apartment' LIMIT 1")
  ]);
  const prop = props[1][0];
  if (!prop) {
    console.error("Viswa Residency property not found!");
    return;
  }
  const propId = prop.id;
  console.log(`Target Property: [${prop.code}] ${prop.name} (ID: ${propId})`);

  // Fetch Master references
  const masters = await sql.transaction([
    sql.query(setPathSQL),
    sql.query("SELECT id, email, first_name, last_name FROM users LIMIT 15"),
    sql.query("SELECT id, name, code FROM departments"),
    sql.query("SELECT id, unit_label, status FROM units WHERE floor_id IN (SELECT f.id FROM floors f JOIN buildings b ON b.id = f.building_id WHERE b.property_id = $1) LIMIT 20", [propId]),
    sql.query("SELECT id, name, code FROM warehouses WHERE property_id = $1 OR property_id IS NULL", [propId]),
    sql.query("SELECT id, name FROM inventory_categories"),
    sql.query("SELECT id, agreement_ref, rent_amount, security_deposit, status FROM lease_agreements WHERE property_id = $1", [propId]),
    sql.query("SELECT id, account_code, account_name, account_type FROM chart_of_accounts LIMIT 15")
  ]);

  const users = masters[1];
  const depts = masters[2];
  const units = masters[3];
  const warehouses = masters[4];
  const categories = masters[5];
  const leases = masters[6];
  const accounts = masters[7];

  console.log(`Loaded ${users.length} users, ${depts.length} depts, ${units.length} units, ${leases.length} leases.`);

  if (units.length === 0) {
    console.error("No units found for residency!");
    return;
  }

  const getDeptId = (code) => depts.find(d => d.code === code)?.id || depts[0]?.id || null;

  // 1. SEED SECURITY DEPOSIT LEDGER
  console.log("\n1. Seeding Security Deposit Ledger...");
  let depositCount = 0;
  for (const lease of leases) {
    const depAmt = Number(lease.security_deposit || (Number(lease.rent_amount) * 6));
    await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO deposit_ledger (lease_id, transaction_type, amount, description, transaction_date, created_by)
        VALUES ($1, 'deposit_received', $2, 'Initial security deposit received via NEFT/Bank Transfer at lease inception', now() - interval '6 months', $3)
      `, [lease.id, depAmt, users[0]?.id || null])
    ]);
    depositCount++;

    if (lease.status === 'active' && Math.random() > 0.4) {
      const intAmt = Math.round(depAmt * 0.045);
      await sql.transaction([
        sql.query(setPathSQL),
        sql.query(`
          INSERT INTO deposit_ledger (lease_id, transaction_type, amount, description, transaction_date, created_by)
          VALUES ($1, 'interest', $2, 'Annual bank interest credited on deposit balance (4.5% p.a.)', now() - interval '1 month', $3)
        `, [lease.id, intAmt, users[0]?.id || null])
      ]);
      depositCount++;
    }
  }
  console.log(`  Inserted ${depositCount} deposit ledger records.`);

  // 2. SEED HOUSEKEEPING TASKS
  console.log("\n2. Seeding Housekeeping Tasks...");
  const hkTasks = [
    { type: 'deep_clean', priority: 'high', status: 'in_progress', notes: 'Move-in deep cleaning and sanitization before tenant arrival' },
    { type: 'stayover_tidy', priority: 'medium', status: 'resolved', notes: 'Bi-weekly balcony scrubbing and window glass wiping' },
    { type: 'turnaround', priority: 'critical', status: 'open', notes: 'Post move-out turnaround cleaning, plumbing leak check, and repainting prep' },
    { type: 'inspection', priority: 'low', status: 'resolved', notes: 'Quarterly smoke detector battery test and fire sprinkler head inspection' },
    { type: 'deep_clean', priority: 'medium', status: 'open', notes: 'Common corridor mopping, granite floor buffing, and elevator lobby sanitization' },
    { type: 'stayover_tidy', priority: 'high', status: 'in_progress', notes: 'Clubhouse gym equipment sanitization and locker room deep cleaning' },
    { type: 'turnaround', priority: 'medium', status: 'closed', notes: 'Basement B1 parking bay sweeping, oil stain removal, and drainage clearing' },
    { type: 'inspection', priority: 'high', status: 'resolved', notes: 'Garbage chute sanitization, deodorizing, and exhaust fan maintenance check' },
    { type: 'deep_clean', priority: 'critical', status: 'open', notes: 'Swimming pool deck scrubbing, shower area disinfection, and lounge chair setup' },
    { type: 'stayover_tidy', priority: 'low', status: 'closed', notes: 'Terrace garden dry leaf sweeping, solar panel dusting, and drain clearance' }
  ];

  for (let i = 0; i < 15; i++) {
    const t = hkTasks[i % hkTasks.length];
    const unit = units[i % units.length];
    const assignedUser = users[i % users.length];
    await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, assigned_by, task_type, priority, status, scheduled_at, notes)
        VALUES ($1, $2, $3, $4, $5, $6::ticket_priority, $7::ticket_status, now() + (interval '1 day' * $8), $9)
      `, [unit.id, propId, assignedUser?.id || null, users[0]?.id || null, t.type, t.priority, t.status, (i - 5), t.notes])
    ]);
  }
  console.log(`  Inserted 15 housekeeping tasks.`);

  // 3. SEED VENDORS
  console.log("\n3. Seeding Vendors...");
  const vendorData = [
    { name: 'Azalea Elevator Maintenance Pvt Ltd', contact: 'Rajesh Verma', email: 'service@azaleaelevators.demo', phone: '+91-80-2234-5601', gst: '29AAACA1234A1Z1', service: 'Elevator AMC & Emergency Repairs', rate: 45000 },
    { name: 'Bangalore Greenery & Landscaping Co.', contact: 'Sunil Gowda', email: 'info@bglgreen.demo', phone: '+91-80-2234-5602', gst: '29AAACB2345B1Z2', service: 'Garden & Clubhouse Lawn Maintenance', rate: 28000 },
    { name: 'Southern Shield Security Services', contact: 'Capt. (Retd.) M. Nair', email: 'ops@southernshield.demo', phone: '+91-80-2234-5603', gst: '29AAACC3456C1Z3', service: '24/7 Gate & Perimeter Security Patrols', rate: 185000 },
    { name: 'AquaPure Water Treatment Solutions', contact: 'Pooja Reddy', email: 'support@aquapure.demo', phone: '+91-80-2234-5604', gst: '29AAACD4567D1Z4', service: 'WTP, STP & Swimming Pool Chlorination', rate: 32000 },
    { name: 'Sparkle Clean Waste Management Ltd', contact: 'Imran Khan', email: 'dispatch@sparkleclean.demo', phone: '+91-80-2234-5605', gst: '29AAACE5678E1Z5', service: 'Daily Solid Waste Disposal & Recycling', rate: 24000 },
    { name: 'VoltTech Electrical & Generator Engineers', contact: 'Anil Kumar', email: 'service@volttech.demo', phone: '+91-80-2234-5606', gst: '29AAACF6789F1Z6', service: 'DG Set AMC & Transformer Maintenance', rate: 38000 }
  ];

  const insertedVendors = [];
  for (const v of vendorData) {
    const res = await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO vendors (company_name, contact_person, email, phone, gst_number, is_compliant, status, property_id)
        VALUES ($1, $2, $3, $4, $5, true, 'active', $6)
        RETURNING id, company_name
      `, [v.name, v.contact, v.email, v.phone, v.gst, propId])
    ]);
    const vId = res[1][0].id;
    insertedVendors.push({ id: vId, name: v.name });

    await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO vendor_services (vendor_id, service_type, description, rate, rate_unit, is_active)
        VALUES ($1, $2, $3, $4, 'monthly', true)
      `, [vId, v.service, `Comprehensive monthly contract for ${v.service}`, v.rate])
    ]);
  }
  console.log(`  Inserted ${insertedVendors.length} vendors and their services.`);

  // 4. SEED AMC CONTRACTS & PREVENTIVE SCHEDULES
  console.log("\n4. Seeding AMC Contracts & Preventive Schedules...");
  const amcs = [
    { name: 'Annual Elevator Maintenance Contract - Tower A & B', ref: 'AMC-2026-ELV01', val: 540000, vendorIdx: 0 },
    { name: '24/7 Security Patrol & Guarding Services Contract', ref: 'AMC-2026-SEC02', val: 2220000, vendorIdx: 2 },
    { name: 'STP & WTP Comprehensive Water Treatment AMC', ref: 'AMC-2026-WTP03', val: 384000, vendorIdx: 3 },
    { name: '250 KVA Diesel Generator & Electrical AMC', ref: 'AMC-2026-DGS04', val: 456000, vendorIdx: 5 }
  ];

  for (const amc of amcs) {
    const vId = insertedVendors[amc.vendorIdx]?.id || insertedVendors[0]?.id;
    await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO amc_contracts (property_id, vendor_id, contract_name, contract_ref, start_date, end_date, coverage, value, status)
        VALUES ($1, $2, $3, $4, '2026-01-01', '2026-12-31', '{"parts_included": true, "emergency_calls": "unlimited", "routine_visits": "monthly"}'::jsonb, $5, 'active')
      `, [propId, vId, amc.name, amc.ref, amc.val])
    ]);
  }

  const prevScheds = [
    { type: 'Swimming Pool Treatment Plant', freq: 7, desc: 'Weekly water chemical balance testing, pH level adjustment, and filter backwashing' },
    { type: '250 KVA Diesel Generator Set', freq: 30, desc: 'Monthly DG set no-load & full-load test, coolant level check, and battery voltage inspection' },
    { type: 'Schindler High-Speed Elevators', freq: 30, desc: 'Monthly safety brake test, door sensor calibration, emergency alarm check, and lubrication' },
    { type: 'STP Sewage Treatment Plant', freq: 14, desc: 'Bi-weekly aeration tank sludge testing, blower motor greasing, and treated water BOD analysis' },
    { type: 'Fire Fighting System & Hydrants', freq: 30, desc: 'Monthly fire pump pressure check, jockey pump auto-start test, and extinguisher gauge inspection' },
    { type: 'Main Transformer & HT Panel', freq: 90, desc: 'Quarterly transformer oil breakdown voltage test, silica gel breather inspection, and earth resistance check' }
  ];

  for (const ps of prevScheds) {
    await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO preventive_schedules (property_id, asset_type, frequency_days, task_template, last_run, next_due, is_active)
        VALUES ($1, $2, $3, $4, now() - interval '10 days', now() + interval '20 days', true)
      `, [propId, ps.type, ps.freq, ps.desc])
    ]);
  }
  console.log(`  Inserted 4 AMC contracts and 6 preventive schedules.`);

  // 5. SEED MAINTENANCE TICKETS
  console.log("\n5. Seeding Maintenance Tickets...");
  const mTickets = [
    { title: 'Tower A Elevator #2 door sensor glitching', cat: 'electrical', pri: 'critical', stat: 'in_progress', desc: 'Elevator doors reopening repeatedly on 4th floor without obstruction. Vendor notified.' },
    { title: 'Unit 204 master bathroom geyser leakage', cat: 'plumbing', pri: 'high', stat: 'assigned', desc: 'Water dripping from inlet valve connection of 25L geyser. Needs washer replacement.' },
    { title: 'Clubhouse swimming pool pump tripping MCB', cat: 'electrical', pri: 'critical', stat: 'open', desc: 'Main filtration pump tripping circuit breaker after 15 minutes of operation.' },
    { title: 'Basement B1 parking bay #12 water seepage', cat: 'civil', pri: 'medium', stat: 'in_progress', desc: 'Dampness and minor water seepage observed on overhead beam near Pillar P-14.' },
    { title: 'Tower B 4th floor corridor emergency exit light out', cat: 'electrical', pri: 'low', stat: 'resolved', desc: 'LED battery backup unit failed during monthly routine inspection. Replaced unit.' },
    { title: 'Generator DG-1 coolant leak during backup test', cat: 'mechanical', pri: 'high', stat: 'open', desc: 'Minor coolant leakage observed from bottom radiator hose during weekly 15-min trial run.' },
    { title: 'Unit 302 intercom not connecting to main gate guard cabin', cat: 'it_telecom', pri: 'medium', stat: 'assigned', desc: 'Audio static and no ringtone when dialing gate cabin. Wiring junction box check required.' },
    { title: 'Children play area swing set chain rusted', cat: 'civil', pri: 'low', stat: 'resolved', desc: 'Rusted chain link replaced with heavy-duty galvanized steel chain and greased.' },
    { title: 'Gym treadmill #2 belt slipping at high speed', cat: 'mechanical', pri: 'medium', stat: 'open', desc: 'Running belt slipping and making grinding noise when speed exceeds 10 km/h.' },
    { title: 'Main entrance automated boom barrier slow response', cat: 'electrical', pri: 'high', stat: 'in_progress', desc: 'RFID reader taking 5-7 seconds to open boom barrier during peak morning hours.' },
    { title: 'Tower A roof terrace solar panel cleaning & inspection', cat: 'electrical', pri: 'low', stat: 'closed', desc: 'Quarterly washing of 50 kWp solar array completed. Energy generation output normalized.' },
    { title: 'STP aeration blower motor vibration and noise', cat: 'mechanical', pri: 'medium', stat: 'assigned', desc: 'Blower motor #2 vibrating abnormally. Bearing lubrication and belt tensioning scheduled.' }
  ];

  for (let i = 0; i < mTickets.length; i++) {
    const t = mTickets[i];
    const unit = units[i % units.length];
    const repUser = users[i % users.length];
    const vId = insertedVendors[i % insertedVendors.length]?.id || null;
    await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, category, title, description, priority, status, reported_by, vendor_id, cost_parts, cost_labor)
        VALUES ($1, $2, $3, 'corrective', $4, $5, $6, $7::ticket_priority, $8::ticket_status, $9, $10, $11, $12)
      `, [propId, unit.id, `TICK-2026-R${100 + i}`, t.cat, t.title, t.desc, t.pri, t.stat, repUser?.id || null, vId, (i * 450), (i * 300)])
    ]);
  }
  console.log(`  Inserted ${mTickets.length} maintenance tickets.`);

  // 6. SEED INVENTORY ITEMS
  console.log("\n6. Seeding Inventory Items...");
  const whId = warehouses[0]?.id || null;
  const catId = categories[0]?.id || null;
  const invItems = [
    { name: '12W LED Ceiling Downlight (Warm White)', sku: 'LED-12W-WW', unit: 'Pcs', qoh: 45, cost: 350 },
    { name: '1/2 Inch Heavy Duty Brass Ball Valve', sku: 'VALVE-BR-12', unit: 'Pcs', qoh: 24, cost: 480 },
    { name: '32A Double Pole MCB Circuit Breaker', sku: 'MCB-32A-DP', unit: 'Pcs', qoh: 15, cost: 850 },
    { name: '45 uF Motor Run Capacitor for AC/Pump', sku: 'CAP-45UF', unit: 'Pcs', qoh: 18, cost: 290 },
    { name: 'Stabilized Chlorine Tablets for Swimming Pool (1 kg)', sku: 'CHLOR-TAB-1K', unit: 'Jars', qoh: 12, cost: 1450 },
    { name: 'Industrial Floor Cleaner & Sanitizer (5 Liter Drum)', sku: 'FLR-CLN-5L', unit: 'Drums', qoh: 20, cost: 650 },
    { name: 'Heavy Duty Black Garbage Bags (Large - Roll of 50)', sku: 'GRB-BAG-L', unit: 'Rolls', qoh: 60, cost: 220 },
    { name: 'Automatic Aerosol Air Freshener Refill (Lobby/Corridor)', sku: 'AIR-FRSH-REF', unit: 'Cans', qoh: 36, cost: 310 },
    { name: '15W-40 Synthetic Diesel Generator Engine Oil (5 Liter)', sku: 'OIL-DG-15W40', unit: 'Cans', qoh: 8, cost: 2100 },
    { name: 'Hydraulically Damped Door Closer (Heavy Duty Silver)', sku: 'DR-CLSR-HD', unit: 'Pcs', qoh: 10, cost: 1250 }
  ];

  for (const item of invItems) {
    await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO inventory_items (category_id, name, sku, description, unit, quantity_on_hand, reorder_level, reorder_quantity, unit_cost, warehouse_id, property_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, 10, 25, $7, $8, $9, true)
      `, [catId, item.name, item.sku, `High quality replacement part: ${item.name}`, item.unit, item.qoh, item.cost, whId, propId])
    ]);
  }
  console.log(`  Inserted ${invItems.length} inventory items.`);

  // 7. SEED FIXED ASSETS
  console.log("\n7. Seeding Fixed Assets...");
  const assets = [
    { code: 'FA-DGS-001', name: '250 KVA Cummins Diesel Generator Set', cat: 'Generator & MEP', cost: 2850000, life: 15, dep: 427500, val: 2422500, loc: 'Tower A Utility Yard' },
    { code: 'FA-ELV-001', name: 'Schindler High-Speed Passenger Elevators (4 Units)', cat: 'Elevator System', cost: 6400000, life: 20, dep: 640000, val: 5760000, loc: 'Tower A & B Lift Shafts' },
    { code: 'FA-GYM-001', name: 'Clubhouse Commercial Gym Fitness Equipment Suite', cat: 'Fitness & Sports', cost: 1450000, life: 7, dep: 414000, val: 1036000, loc: 'Clubhouse 1st Floor Gym' },
    { code: 'FA-WTP-001', name: 'Automated WTP & Sewage Treatment Plant (100 KLD)', cat: 'Water Treatment', cost: 3200000, life: 15, dep: 480000, val: 2720000, loc: 'Basement B2 Treatment Plant' },
    { code: 'FA-CCTV-001', name: 'Hikvision 64-Channel IP CCTV & Security System', cat: 'Security & IT', cost: 850000, life: 5, dep: 340000, val: 510000, loc: 'Main Gate & Perimeter' },
    { code: 'FA-SLR-001', name: 'Solar Power Rooftop Array (50 kWp Grid Connected)', cat: 'Renewable Energy', cost: 2200000, life: 20, dep: 220000, val: 1980000, loc: 'Tower A & B Rooftop' }
  ];

  for (const fa of assets) {
    await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO fixed_assets (property_id, asset_code, asset_name, category, purchase_date, purchase_cost, salvage_value, useful_life_yrs, depreciation_method, accumulated_dep, status, location)
        VALUES ($1, $2, $3, $4, '2024-04-01', $5, ($5 * 0.1), $6, 'straight_line', $7, 'active', $8)
      `, [propId, fa.code, fa.name, fa.cat, fa.cost, fa.life, fa.dep, fa.loc])
    ]);
  }
  console.log(`  Inserted ${assets.length} fixed assets.`);

  // 8. SEED VENDOR BILLS & JOURNAL ENTRIES
  console.log("\n8. Seeding Vendor Bills & Journal Entries...");
  const vBills = [
    { num: 'VB-2026-041', vIdx: 0, amt: 45000, cat: 'Repairs & Maintenance', notes: 'Monthly Elevator AMC maintenance charges for Tower A & B' },
    { num: 'VB-2026-042', vIdx: 1, amt: 28000, cat: 'Landscaping & Gardening', notes: 'Monthly lawn maintenance, hedge trimming, and garden watering' },
    { num: 'VB-2026-043', vIdx: 2, amt: 185000, cat: 'Security Services', notes: 'Monthly payroll bill for 12 security guards across 3 shifts' },
    { num: 'VB-2026-044', vIdx: 3, amt: 32000, cat: 'Water Treatment', notes: 'Monthly STP maintenance and swimming pool chlorination chemicals' },
    { num: 'VB-2026-045', vIdx: 4, amt: 24000, cat: 'Waste Management', notes: 'Daily municipal solid waste collection and dry waste recycling' },
    { num: 'VB-2026-046', vIdx: 5, amt: 38000, cat: 'Generator Maintenance', notes: 'Monthly DG set AMC check and routine filter cleaning' }
  ];

  for (const vb of vBills) {
    const vId = insertedVendors[vb.vIdx]?.id || insertedVendors[0]?.id;
    await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, paid_total, status, notes)
        VALUES ($1, $2, $3, now() - interval '15 days', now() + interval '15 days', $4, $5, ($5 * 0.18), ($5 * 1.18), ($5 * 1.18), 'paid', $6)
      `, [propId, vId, vb.num, vb.cat, vb.amt, vb.notes])
    ]);
  }

  const jEntries = [
    { desc: 'Monthly Rental Revenue Collection - Tower A & B Apartments', amt: 1450000, type: 'revenue' },
    { desc: 'Monthly Security Guarding Services Disbursement - Southern Shield', amt: 185000, type: 'expense' },
    { desc: 'Monthly Common Area Electricity & Water Utility Payments', amt: 245000, type: 'expense' },
    { desc: 'Elevator AMC Monthly Payment - Azalea Elevators', amt: 45000, type: 'expense' },
    { desc: 'Housekeeping Supplies & Consumables Replenishment', amt: 62000, type: 'expense' },
    { desc: 'Security Deposit Received - Unit 304 New Lease Inception', amt: 360000, type: 'asset' }
  ];

  for (const je of jEntries) {
    await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO journal_entries (property_id, entry_date, reference_type, description, created_by, posted_at, is_posted, journal_type)
        VALUES ($1, now() - interval '5 days', $2, $3, $4, now(), true, 'general')
      `, [propId, je.type, je.desc, users[0]?.id || null])
    ]);
  }
  console.log(`  Inserted ${vBills.length} vendor bills and ${jEntries.length} journal entries.`);

  // 9. SEED EMPLOYEES & ATTENDANCE
  console.log("\n9. Seeding Employees & Attendance...");
  const empData = [
    { code: 'EMP-RES-01', name: 'Suresh Kumar Nair', desig: 'Resident Estate Manager', deptCode: 'MT', salary: 95000, uIdx: 0 },
    { code: 'EMP-RES-02', name: 'Meenakshi Sundaram', desig: 'Operations Supervisor', deptCode: 'FD', salary: 65000, uIdx: 1 },
    { code: 'EMP-RES-03', name: 'Vikramaditya Rao', desig: 'Senior MEP Engineer', deptCode: 'MT', salary: 75000, uIdx: 2 },
    { code: 'EMP-RES-04', name: 'Prakash Sharma', desig: 'Maintenance Technician', deptCode: 'MT', salary: 42000, uIdx: 3 },
    { code: 'EMP-RES-05', name: 'Lakshmi Devi', desig: 'Housekeeping Supervisor', deptCode: 'HK', salary: 45000, uIdx: 4 },
    { code: 'EMP-RES-06', name: 'Raju Valmiki', desig: 'Housekeeping Attendant', deptCode: 'HK', salary: 28000, uIdx: 5 },
    { code: 'EMP-RES-07', name: 'Sunita Bai', desig: 'Housekeeping Attendant', deptCode: 'HK', salary: 28000, uIdx: 6 },
    { code: 'EMP-RES-08', name: 'Ananya Mukherjee', desig: 'Resident Concierge', deptCode: 'FD', salary: 48000, uIdx: 7 },
    { code: 'EMP-RES-09', name: 'Major (Retd.) K. V. Singh', desig: 'Chief Security Officer', deptCode: 'SC', salary: 82000, uIdx: 8 },
    { code: 'EMP-RES-10', name: 'Ramanathan Iyer', desig: 'Accounts Executive', deptCode: 'FN', salary: 55000, uIdx: 9 }
  ];

  const insertedEmps = [];
  for (const emp of empData) {
    const dId = getDeptId(emp.deptCode);
    const uId = users[emp.uIdx % users.length]?.id || null;
    const res = await sql.transaction([
      sql.query(setPathSQL),
      sql.query(`
        INSERT INTO employees (user_id, employee_code, department_id, designation, employment_type, doj, base_salary, bank_account, bank_ifsc, pan_number, is_active, property_id)
        VALUES ($1, $2, $3, $4, 'full_time', '2024-06-01', $5, 'HDFC00012345678', 'HDFC0001234', 'ABCDE1234F', true, $6)
        RETURNING id, employee_code, designation
      `, [uId, emp.code, dId, emp.desig, emp.salary, propId])
    ]);
    const empId = res[1][0].id;
    insertedEmps.push(empId);

    // Add 5 days of attendance records
    for (let d = 1; d <= 5; d++) {
      await sql.transaction([
        sql.query(setPathSQL),
        sql.query(`
          INSERT INTO attendance_records (employee_id, property_id, clock_in, clock_out, status)
          VALUES ($1, $2, now() - (interval '1 day' * $3) + interval '9 hours', now() - (interval '1 day' * $3) + interval '18 hours', 'present')
        `, [empId, propId, d])
      ]);
    }
  }
  console.log(`  Inserted ${insertedEmps.length} employees and 50 attendance records.`);

  console.log("\n=== SEEDING COMPLETE FOR VISWA RESIDENCY ===");
}

seedResidency().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
