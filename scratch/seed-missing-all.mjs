import { neon } from "@neondatabase/serverless";
import fs from "fs";
const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
const sql = neon(dbUrlMatch[1]);

// Fetch properties and vendors
const props = await sql`SELECT id, name, code, vertical_type FROM viswa.properties`;
const vendors = await sql`SELECT id, company_name FROM viswa.vendors`;

const propMap = {};
props.forEach(p => propMap[p.code] = p.id);
const vId = vendors[0]?.id || null;
const vId2 = vendors[1]?.id || vId;

console.log("Seeding warehouses and categories...");
// 1. Warehouses
const wData = [
  { name: "Viswa Hotels Central Store", code: "WH-VH", location: "Basement Level 1, Viswa Hotels", manager_name: "Ramesh Kumar", property_id: propMap["VH"] },
  { name: "Shanthi Apartments Store Room", code: "WH-SSA", location: "Ground Floor Block A, Shanthi Apts", manager_name: "Suresh Babu", property_id: propMap["SSA"] },
  { name: "Viswa Service Apts Store", code: "WH-VSA", location: "Basement Level 2, Viswa Service Apts", manager_name: "Manoj Sharma", property_id: propMap["VSA"] },
  { name: "Viswa Apartments Maintenance Depot", code: "WH-VA", location: "Utility Block, Viswa Apartments", manager_name: "Anil Verma", property_id: propMap["VA"] },
];

const warehouseIds = [];
for (const w of wData) {
  if (!w.property_id) continue;
  const res = await sql`
    INSERT INTO viswa.warehouses (id, name, code, location, manager_name, phone, property_id, is_active, created_at)
    VALUES (gen_random_uuid(), ${w.name}, ${w.code}, ${w.location}, ${w.manager_name}, '+91 9876543210', ${w.property_id}, true, NOW())
    RETURNING id
  `;
  warehouseIds.push({ id: res[0].id, property_id: w.property_id });
}

// 2. Inventory Categories
const cNames = ["Linen & Towels", "Guest Toiletries", "F&B Kitchen Supplies", "Electrical & Lighting", "Plumbing & Hardware", "Cleaning Chemicals"];
const catIds = [];
for (const cn of cNames) {
  const res = await sql`
    INSERT INTO viswa.inventory_categories (id, name, description, property_id, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), ${cn}, ${'Supplies for ' + cn}, ${props[0].id}, true, NOW(), NOW())
    RETURNING id
  `;
  catIds.push(res[0].id);
}

console.log("Seeding inventory items & parts...");
// 3. Inventory Items
const items = [
  { name: "Bath Towel 600 GSM Premium", sku: "LIN-TOW-001", unit: "Pcs", qoh: 240, cost: 450, cat: catIds[0] },
  { name: "King Bed Sheet White Cotton", sku: "LIN-SHT-002", unit: "Pcs", qoh: 180, cost: 850, cat: catIds[0] },
  { name: "Shampoo Bottle 50ml Herbal", sku: "TOI-SHM-001", unit: "Btl", qoh: 1200, cost: 25, cat: catIds[1] },
  { name: "Conditioner Bottle 50ml Herbal", sku: "TOI-CND-002", unit: "Btl", qoh: 1100, cost: 25, cat: catIds[1] },
  { name: "LED Bulb 9W Warm White", sku: "ELE-LED-009", unit: "Pcs", qoh: 150, cost: 120, cat: catIds[3] },
  { name: "Surface Cleaner Liquid 5L", sku: "CLN-SUR-005", unit: "Can", qoh: 45, cost: 650, cat: catIds[5] },
];

for (const w of warehouseIds) {
  for (const it of items) {
    await sql`
      INSERT INTO viswa.inventory_items (
        id, category_id, name, sku, description, unit, quantity_on_hand, quantity_reserved,
        reorder_level, reorder_quantity, unit_cost, warehouse_id, property_id, is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${it.cat}, ${it.name}, ${it.sku + '-' + w.property_id.slice(0,4)}, ${it.name}, ${it.unit},
        ${it.qoh}, 10, 50, 100, ${it.cost}, ${w.id}, ${w.property_id}, true, NOW(), NOW()
      )
    `;
  }
}

// 4. Parts Inventory
const parts = [
  { name: "AC Compressor Relay 24V", code: "PRT-AC-01", stock: 15, reorder: 5, price: 1200 },
  { name: "Water Heater Heating Element 2kW", code: "PRT-HT-02", stock: 8, reorder: 3, price: 850 },
  { name: "Smart Keycard Lock Battery Pack (4xAA)", code: "PRT-LCK-03", stock: 60, reorder: 20, price: 180 },
  { name: "Brass Angle Valve 1/2 Inch Heavy", code: "PRT-PLM-04", stock: 35, reorder: 10, price: 320 },
];

for (const p of props) {
  for (const pt of parts) {
    await sql`
      INSERT INTO viswa.parts_inventory (id, property_id, part_name, part_code, quantity_in_stock, reorder_level, unit_price, vendor_id, created_at)
      VALUES (gen_random_uuid(), ${p.id}, ${pt.name}, ${pt.code + '-' + p.code}, ${pt.stock}, ${pt.reorder}, ${pt.price}, ${vId}, NOW())
    `;
  }
}

console.log("Seeding purchase orders & GRN...");
// 5. Purchase Orders
for (let i = 1; i <= 6; i++) {
  const prop = props[i % props.length];
  const amt = (i * 12500) + 5000;
  const status = i % 3 === 0 ? "received" : (i % 2 === 0 ? "approved" : "pending");
  const poRes = await sql`
    INSERT INTO viswa.purchase_orders (id, property_id, vendor_id, po_number, po_date, status, total_amount, notes, created_at)
    VALUES (gen_random_uuid(), ${prop.id}, ${i % 2 === 0 ? vId2 : vId}, ${'PO-2026-00' + i}, CURRENT_DATE - INTERVAL '${sql.unsafe(i * 7 + ' days')}', ${status}, ${amt}, ${'Regular monthly replenishment order #' + i}, NOW() - INTERVAL '${sql.unsafe(i * 7 + ' days')}')
    RETURNING id, po_number, po_date, property_id
  `;
  
  if (status === "received") {
    const po = poRes[0];
    await sql`
      INSERT INTO viswa.goods_received_notes (id, po_id, grn_number, received_date, notes, created_at, property_id)
      VALUES (gen_random_uuid(), ${po.id}, ${'GRN-' + po.po_number.slice(3)}, ${po.po_date}, 'All items received in good condition.', NOW() - INTERVAL '${sql.unsafe(i * 5 + ' days')}', ${po.property_id})
    `;
  }
}

console.log("Seeding AMC Contracts & Preventive Schedules...");
// 6. AMC Contracts
const amcs = [
  { name: "Annual HVAC & Chiller Maintenance", ref: "AMC-HVAC-2026", val: 185000 },
  { name: "Elevator Annual Safety & Service Contract", ref: "AMC-ELV-2026", val: 240000 },
  { name: "Fire Safety & Hydrant System AMC", ref: "AMC-FIR-2026", val: 95000 },
  { name: "RO Water Purification Plant Maintenance", ref: "AMC-WTR-2026", val: 65000 },
];
for (const p of props) {
  for (let i = 0; i < amcs.length; i++) {
    const a = amcs[i];
    await sql`
      INSERT INTO viswa.amc_contracts (id, property_id, vendor_id, contract_name, contract_ref, start_date, end_date, coverage, value, status, created_at)
      VALUES (
        gen_random_uuid(), ${p.id}, ${i % 2 === 0 ? vId : vId2}, ${a.name}, ${a.ref + '-' + p.code},
        '2026-04-01', '2027-03-31', ${JSON.stringify({parts_covered: true, emergency_calls: "unlimited", routine_visits: "monthly"})}::jsonb,
        ${a.val}, 'active', NOW()
      )
    `;
  }
}

// 7. Preventive Schedules
const prevs = [
  { type: "HVAC Unit", freq: 30, tpl: "Clean air filter, check refrigerant gas pressure, wash outdoor condenser unit." },
  { type: "Elevator Lift", freq: 60, tpl: "Check brake pads, inspect door sensors, lubricate cables and pulley mechanism." },
  { type: "Diesel Generator 100KVA", freq: 15, tpl: "Check coolant level, battery voltage, engine oil level, run test for 15 mins." },
  { type: "Swimming Pool Filtration", freq: 7, tpl: "Backwash sand filters, check water pH (7.2-7.6), add chlorine tablets." },
];
for (const p of props) {
  for (const pv of prevs) {
    const d = Math.floor(Math.random() * pv.freq);
    await sql`
      INSERT INTO viswa.preventive_schedules (id, property_id, asset_type, frequency_days, task_template, last_run, next_due, is_active)
      VALUES (
        gen_random_uuid(), ${p.id}, ${pv.type}, ${pv.freq}, ${pv.tpl},
        NOW() - INTERVAL '${sql.unsafe(d + ' days')}', NOW() + INTERVAL '${sql.unsafe(d + ' days')}', true
      )
    `;
  }
}

console.log("Seeding Fixed Assets...");
// 8. Fixed Assets
const fAssets = [
  { code: "FA-CHND-01", name: "Grand Crystal Lobby Chandelier", cat: "Fixtures & Fittings", cost: 450000, life: 10, loc: "Main Lobby" },
  { code: "FA-GEN-02", name: "100 KVA Silent Diesel Generator", cat: "Plant & Machinery", cost: 850000, life: 15, loc: "Utility Area" },
  { code: "FA-DISH-03", name: "Industrial Conveyor Dishwasher 20kW", cat: "Kitchen Equipment", cost: 320000, life: 8, loc: "Main Kitchen" },
  { code: "FA-GYM-04", name: "Commercial Motorized Treadmill Pro", cat: "Gym & Fitness", cost: 210000, life: 6, loc: "Fitness Center" },
];
for (const p of props) {
  for (const fa of fAssets) {
    await sql`
      INSERT INTO viswa.fixed_assets (
        id, property_id, asset_code, asset_name, category, purchase_date, purchase_cost,
        salvage_value, useful_life_yrs, depreciation_method, accumulated_dep, book_value,
        status, location, notes, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${p.id}, ${fa.code + '-' + p.code}, ${fa.name}, ${fa.cat}, '2025-06-15', ${fa.cost},
        ${fa.cost * 0.1}, ${fa.life}, 'Straight Line', ${fa.cost * 0.15}, ${fa.cost * 0.85},
        'active', ${fa.loc + ' (' + p.name + ')'}, 'Capital expenditure asset.', NOW(), NOW()
      )
    `;
  }
}

console.log("✅ Successfully seeded rich 3-month inventory, procurement, maintenance, and finance data across all properties!");
