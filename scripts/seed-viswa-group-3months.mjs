/**
 * seed-viswa-group-3months.mjs
 * 
 * Fast, batched 3-month (May, June, July 2026) demo seeding for:
 * "Viswa Group of Estates" tenant with exactly 4 workspaces:
 * 1. Viswa Apartments (Rental Apartment Management)
 * 2. Viswa Hotels (Hotels & Resorts)
 * 3. Shanthi Service Apartments (Serviced Apartments)
 * 4. Viswa Service Apartments (Serviced Apartments)
 */
import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
if (!dbUrlMatch) {
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}
const sql = neon(dbUrlMatch[1]);

function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const JULY_12 = new Date("2026-07-12T14:00:00Z");

async function runBatches(items, batchSize, fn) {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await Promise.all(chunk.map(fn));
  }
}

async function seed() {
  const startTime = Date.now();
  console.log("=== Starting Fast 3-Month Demo Seeding for Viswa Group of Estates ===");

  // 1. Update public.tenants configuration with exact 4 workspaces
  console.log("\n1. Configuring Tenant & Workspaces in public.tenants...");
  const workspacesConfig = [
    { name: "Viswa Apartments", type: "rental", is_primary: true },
    { name: "Viswa Hotels", type: "hotels", is_primary: false },
    { name: "Shanthi Service Apartments", type: "apartments", is_primary: false },
    { name: "Viswa Service Apartments", type: "apartments", is_primary: false }
  ];

  await sql`
    UPDATE public.tenants SET
      name = 'Viswa Group of Estates',
      code = 'VISWA',
      config = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              config,
              '{workspaces}',
              ${JSON.stringify(workspacesConfig)}::jsonb
            ),
            '{verticals}',
            '["rental", "hotels", "apartments"]'::jsonb
          ),
          '{vertical_types}',
          '["rental_apartment", "hotel", "service_apartment"]'::jsonb
        ),
        '{display_name}',
        '"Viswa Group of Estates"'::jsonb
      )
    WHERE code = 'VISWA'
  `;
  console.log("✓ Updated public.tenants config with the 4 workspaces.");

  // 2. Clean operational tables inside viswa schema using TRUNCATE CASCADE in ONE query
  console.log("\n2. Cleaning operational tables inside viswa schema via TRUNCATE CASCADE...");
  const tablesRow = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema='viswa' AND table_type='BASE TABLE' 
      AND table_name NOT IN ('users', 'roles', 'user_roles', 'enterprises', 'regions', 'leave_types', 'system_settings')
  `;
  if (tablesRow.length > 0) {
    const truncateSql = 'TRUNCATE TABLE ' + tablesRow.map(r => `viswa."${r.table_name}"`).join(', ') + ' CASCADE;';
    await sql.query(truncateSql);
  }
  console.log(`✓ Cleared all ${tablesRow.length} operational tables inside viswa schema in a single pass.`);

  // Lookup or create enterprise_id
  const entRow = await sql`SELECT id FROM viswa.enterprises LIMIT 1`;
  let enterpriseId = entRow.length > 0 ? entRow[0].id : randomUUID();
  if (entRow.length === 0) {
    await sql`INSERT INTO viswa.enterprises (id, name, code) VALUES (${enterpriseId}, 'Viswa Enterprise Group', 'VEG')`;
  }

  // Lookup or create region_id for properties
  const regRow = await sql`SELECT id FROM viswa.regions LIMIT 1`;
  let regionId = regRow.length > 0 ? regRow[0].id : randomUUID();
  if (regRow.length === 0) {
    await sql`INSERT INTO viswa.regions (id, enterprise_id, name, code) VALUES (${regionId}, ${enterpriseId}, 'South India Region', 'SIR')`;
  }

  // 3. Create the 4 Properties in viswa.properties
  console.log("\n3. Creating the 4 Properties...");
  const propVA_id = randomUUID();
  const propVH_id = randomUUID();
  const propSSA_id = randomUUID();
  const propVSA_id = randomUUID();

  const vaConfig = {
    features: {
      rooms_map: { enabled: true, label: "Rooms Map" },
      rate_card: { enabled: true, label: "Rate Card" },
      maintenance: { enabled: true, label: "Maintenance" },
      gym: { enabled: true, label: "Gym" },
      swimming_pool: { enabled: true, label: "Swimming Pool" }
    },
    settings: { timezone: "Asia/Kolkata", currency: "INR" }
  };

  const vhConfig = {
    features: {
      rooms_map: { enabled: true, label: "Rooms Map" },
      rate_card: { enabled: true, label: "Rate Card" },
      restaurant: { enabled: true, label: "Restaurant" },
      laundry: { enabled: true, label: "Laundry" },
      maintenance: { enabled: true, label: "Maintenance" },
      gym: { enabled: true, label: "Gym" },
      swimming_pool: { enabled: true, label: "Swimming Pool" },
      spa: { enabled: true, label: "Luxury Spa" }
    },
    settings: { timezone: "Asia/Kolkata", currency: "INR" }
  };

  const ssaConfig = {
    features: {
      rooms_map: { enabled: true, label: "Rooms Map" },
      rate_card: { enabled: true, label: "Rate Card" },
      laundry: { enabled: true, label: "Laundry Service" },
      maintenance: { enabled: true, label: "Maintenance" },
      gym: { enabled: true, label: "Fitness Center" }
    },
    settings: { timezone: "Asia/Kolkata", currency: "INR" }
  };

  const vsaConfig = {
    features: {
      rooms_map: { enabled: true, label: "Rooms Map" },
      rate_card: { enabled: true, label: "Rate Card" },
      laundry: { enabled: true, label: "Laundry" },
      maintenance: { enabled: true, label: "Maintenance" },
      swimming_pool: { enabled: true, label: "Rooftop Pool" }
    },
    settings: { timezone: "Asia/Kolkata", currency: "INR" }
  };

  await sql`
    INSERT INTO viswa.properties (id, region_id, name, code, vertical_type, booking_model, check_in_time, check_out_time, address, phone, email, star_rating, is_active, config)
    VALUES 
    (${propVA_id}, ${regionId}, 'Viswa Apartments', 'VA', 'rental_apartment', 'lease', '14:00', '11:00', '101 Residency Road, Shanthanagar, Bengaluru', '+91-80-22334455', 'apartments@viswagroup.demo', 4, true, ${JSON.stringify(vaConfig)}::jsonb),
    (${propVH_id}, ${regionId}, 'Viswa Hotels', 'VH', 'hotel', 'nightly', '14:00', '11:00', '45 Grand Central Avenue, MG Road, Bengaluru', '+91-80-44556677', 'hotels@viswagroup.demo', 5, true, ${JSON.stringify(vhConfig)}::jsonb),
    (${propSSA_id}, ${regionId}, 'Shanthi Service Apartments', 'SSA', 'service_apartment', 'nightly', '12:00', '11:00', '12 Shanthi Colony, Anna Nagar, Chennai', '+91-44-22334455', 'shanthi@viswagroup.demo', 4, true, ${JSON.stringify(ssaConfig)}::jsonb),
    (${propVSA_id}, ${regionId}, 'Viswa Service Apartments', 'VSA', 'service_apartment', 'nightly', '14:00', '11:00', '88 Cyber Gateway, HITEC City, Hyderabad', '+91-40-66778899', 'serviceapts@viswagroup.demo', 4, true, ${JSON.stringify(vsaConfig)}::jsonb)
  `;
  console.log("✓ Created 4 Properties.");

  // 4. Create Buildings, Floors & Units for each Property
  console.log("\n4. Creating Buildings, Floors & Units...");
  const allUnits = [];

  // Property 1: Viswa Apartments (VA)
  const bldVA = randomUUID();
  await sql`INSERT INTO viswa.buildings (id, property_id, name, code, floors) VALUES (${bldVA}, ${propVA_id}, 'Apartment Tower A', 'ATA', 3)`;
  const flVA1 = randomUUID(), flVA2 = randomUUID(), flVA3 = randomUUID();
  await sql`
    INSERT INTO viswa.floors (id, building_id, name, floor_number) VALUES
    (${flVA1}, ${bldVA}, 'First Floor', 1),
    (${flVA2}, ${bldVA}, 'Second Floor', 2),
    (${flVA3}, ${bldVA}, 'Third Floor', 3)
  `;
  for (let i = 1; i <= 5; i++) {
    allUnits.push({ id: randomUUID(), floor: flVA1, label: `A-10${i}`, type: 'room', layout: 'studio', rate: 25000, status: 'occupied', sqft: 800, occ: 4, attr: '{"ac":true,"wifi":true,"balcony":true,"modular_kitchen":true,"parking":true}' });
    allUnits.push({ id: randomUUID(), floor: flVA2, label: `A-20${i}`, type: 'room', layout: '2bhk', rate: 45000, status: i <= 4 ? 'occupied' : 'vacant', sqft: 1200, occ: 6, attr: '{"ac":true,"wifi":true,"balcony":true,"modular_kitchen":true,"parking":true}' });
    allUnits.push({ id: randomUUID(), floor: flVA3, label: `A-30${i}`, type: 'room', layout: '3bhk', rate: 65000, status: i <= 3 ? 'occupied' : 'vacant', sqft: 1600, occ: 8, attr: '{"ac":true,"wifi":true,"balcony":true,"modular_kitchen":true,"parking":true}' });
  }

  // Property 2: Viswa Hotels (VH)
  const bldVH = randomUUID();
  await sql`INSERT INTO viswa.buildings (id, property_id, name, code, floors) VALUES (${bldVH}, ${propVH_id}, 'Grand Hotel Tower', 'GHT', 4)`;
  const flVH1 = randomUUID(), flVH2 = randomUUID(), flVH3 = randomUUID(), flVH4 = randomUUID();
  await sql`
    INSERT INTO viswa.floors (id, building_id, name, floor_number) VALUES
    (${flVH1}, ${bldVH}, 'Level 1 - Deluxe Rooms', 1),
    (${flVH2}, ${bldVH}, 'Level 2 - Super Deluxe', 2),
    (${flVH3}, ${bldVH}, 'Level 3 - Executive Suites', 3),
    (${flVH4}, ${bldVH}, 'Level 4 - Presidential Suites', 4)
  `;
  for (let i = 1; i <= 8; i++) {
    allUnits.push({ id: randomUUID(), floor: flVH1, label: `10${i}`, type: 'room', layout: 'deluxe', rate: 4500, status: i <= 5 ? 'occupied' : (i === 6 ? 'dirty' : 'vacant'), sqft: 450, occ: 2, attr: '{"ac":true,"wifi":true,"smart_tv":true,"minibar":true,"safe_locker":true}' });
    allUnits.push({ id: randomUUID(), floor: flVH2, label: `20${i}`, type: 'room', layout: 'super_deluxe', rate: 6500, status: i <= 6 ? 'occupied' : 'vacant', sqft: 500, occ: 2, attr: '{"ac":true,"wifi":true,"smart_tv":true,"minibar":true,"safe_locker":true}' });
    allUnits.push({ id: randomUUID(), floor: flVH3, label: `30${i}`, type: 'room', layout: 'suite', rate: 9500, status: i <= 4 ? 'occupied' : (i === 5 ? 'cleaning' : 'vacant'), sqft: 650, occ: 3, attr: '{"ac":true,"wifi":true,"smart_tv":true,"minibar":true,"safe_locker":true}' });
  }
  for (let i = 1; i <= 4; i++) {
    allUnits.push({ id: randomUUID(), floor: flVH4, label: `40${i}`, type: 'suite', layout: 'presidential_suite', rate: 18000, status: i <= 2 ? 'occupied' : 'vacant', sqft: 900, occ: 4, attr: '{"ac":true,"wifi":true,"smart_tv":true,"minibar":true,"safe_locker":true,"jacuzzi":true}' });
  }

  // Property 3: Shanthi Service Apartments (SSA)
  const bldSSA = randomUUID();
  await sql`INSERT INTO viswa.buildings (id, property_id, name, code, floors) VALUES (${bldSSA}, ${propSSA_id}, 'Shanthi Residency Block', 'SRB', 3)`;
  const flSSA1 = randomUUID(), flSSA2 = randomUUID(), flSSA3 = randomUUID();
  await sql`
    INSERT INTO viswa.floors (id, building_id, name, floor_number) VALUES
    (${flSSA1}, ${bldSSA}, 'Floor 1', 1),
    (${flSSA2}, ${bldSSA}, 'Floor 2', 2),
    (${flSSA3}, ${bldSSA}, 'Floor 3', 3)
  `;
  for (let i = 1; i <= 6; i++) {
    allUnits.push({ id: randomUUID(), floor: flSSA1, label: `S-10${i}`, type: 'room', layout: 'studio', rate: 2800, status: i <= 4 ? 'occupied' : 'vacant', sqft: 500, occ: 2, attr: '{"ac":true,"wifi":true,"kitchenette":true,"microwave":true,"washing_machine":true}' });
    allUnits.push({ id: randomUUID(), floor: flSSA2, label: `S-20${i}`, type: 'room', layout: '1bhk', rate: 4200, status: i <= 4 ? 'occupied' : (i === 5 ? 'dirty' : 'vacant'), sqft: 650, occ: 3, attr: '{"ac":true,"wifi":true,"kitchenette":true,"microwave":true,"washing_machine":true}' });
    allUnits.push({ id: randomUUID(), floor: flSSA3, label: `S-30${i}`, type: 'room', layout: '2bhk', rate: 6000, status: i <= 3 ? 'occupied' : 'vacant', sqft: 850, occ: 4, attr: '{"ac":true,"wifi":true,"kitchenette":true,"microwave":true,"washing_machine":true}' });
  }

  // Property 4: Viswa Service Apartments (VSA)
  const bldVSA = randomUUID();
  await sql`INSERT INTO viswa.buildings (id, property_id, name, code, floors) VALUES (${bldVSA}, ${propVSA_id}, 'Viswa Cyber Tower', 'VCT', 3)`;
  const flVSA1 = randomUUID(), flVSA2 = randomUUID(), flVSA3 = randomUUID();
  await sql`
    INSERT INTO viswa.floors (id, building_id, name, floor_number) VALUES
    (${flVSA1}, ${bldVSA}, 'Level 1', 1),
    (${flVSA2}, ${bldVSA}, 'Level 2', 2),
    (${flVSA3}, ${bldVSA}, 'Level 3', 3)
  `;
  for (let i = 1; i <= 7; i++) {
    allUnits.push({ id: randomUUID(), floor: flVSA1, label: `V-10${i}`, type: 'room', layout: 'studio', rate: 3200, status: i <= 5 ? 'occupied' : 'vacant', sqft: 550, occ: 2, attr: '{"ac":true,"wifi":true,"kitchenette":true,"work_desk":true,"coffee_maker":true}' });
    if (i <= 6) allUnits.push({ id: randomUUID(), floor: flVSA2, label: `V-20${i}`, type: 'room', layout: '1bhk', rate: 4800, status: i <= 4 ? 'occupied' : 'vacant', sqft: 700, occ: 3, attr: '{"ac":true,"wifi":true,"kitchenette":true,"work_desk":true,"coffee_maker":true}' });
    if (i <= 7) allUnits.push({ id: randomUUID(), floor: flVSA3, label: `V-30${i}`, type: 'room', layout: '2bhk', rate: 7200, status: i <= 4 ? 'occupied' : (i === 5 ? 'dirty' : 'vacant'), sqft: 900, occ: 4, attr: '{"ac":true,"wifi":true,"kitchenette":true,"work_desk":true,"coffee_maker":true}' });
  }

  await runBatches(allUnits, 15, u => sql`
    INSERT INTO viswa.units (id, floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes)
    VALUES (${u.id}, ${u.floor}, ${u.type}, ${u.label}, ${u.layout}, ${u.sqft}, ${u.occ}, ${u.rate}, ${u.status}, ${u.attr}::jsonb)
  `);
  console.log(`✓ Created ${allUnits.length} Units across all 4 Properties.`);

  // 5. Seed Guest Profiles
  console.log("\n5. Seeding Guest Profiles...");
  const guestProfiles = [
    { id: randomUUID(), fn: 'Arun', ln: 'Krishnamurthy', email: 'arun.k@gmail.com', phone: '+91-9876543201', nat: 'Indian', id_type: 'aadhaar', id_num: '9876-1234-5678', tags: '{"VIP","Corporate"}' },
    { id: randomUUID(), fn: 'Meera', ln: 'Sundaram', email: 'meera.s@outlook.com', phone: '+91-9876543202', nat: 'Indian', id_type: 'passport', id_num: 'J87654321', tags: '{"frequent"}' },
    { id: randomUUID(), fn: 'David', ln: 'Chen', email: 'david.chen@techcorp.sg', phone: '+65-91234567', nat: 'Singaporean', id_type: 'passport', id_num: 'E12345678', tags: '{"VIP","Corporate"}' },
    { id: randomUUID(), fn: 'Lakshmi', ln: 'Venkatesh', email: 'lakshmi.v@gmail.com', phone: '+91-9876543204', nat: 'Indian', id_type: 'driving_license', id_num: 'TN-0120190012345', tags: '{"Family"}' },
    { id: randomUUID(), fn: 'Rahul', ln: 'Dravid', email: 'rahul.d@sports.in', phone: '+91-9876543205', nat: 'Indian', id_type: 'passport', id_num: 'Z99887766', tags: '{"VIP"}' },
    { id: randomUUID(), fn: 'Preethi', ln: 'Nair', email: 'preethi.n@startup.io', phone: '+91-9876543206', nat: 'Indian', id_type: 'aadhaar', id_num: '5544-3322-1100', tags: '{"Corporate"}' },
    { id: randomUUID(), fn: 'James', ln: 'Wilson', email: 'james.w@corp.us', phone: '+1-202-5550101', nat: 'American', id_type: 'passport', id_num: 'US987654', tags: '{"Corporate"}' },
    { id: randomUUID(), fn: 'Karthik', ln: 'Subramanian', email: 'karthik.s@infosys.com', phone: '+91-9876543208', nat: 'Indian', id_type: 'aadhaar', id_num: '6543-4567-8901', tags: '{"Corporate"}' },
    { id: randomUUID(), fn: 'Fatima', ln: 'Al-Rashid', email: 'fatima@gulf.ae', phone: '+971-50-1234567', nat: 'UAE', id_type: 'passport', id_num: 'AE123456', tags: '{"VIP"}' },
    { id: randomUUID(), fn: 'Suresh', ln: 'Babu', email: 'suresh.b@gmail.com', phone: '+91-9876543210', nat: 'Indian', id_type: 'aadhaar', id_num: '1122-3344-5566', tags: '{"Walk-in"}' },
    { id: randomUUID(), fn: 'Ananya', ln: 'Iyer', email: 'ananya.i@gmail.com', phone: '+91-9876543211', nat: 'Indian', id_type: 'aadhaar', id_num: '9900-8877-6655', tags: '{"frequent"}' },
    { id: randomUUID(), fn: 'Raj', ln: 'Malhotra', email: 'raj.m@business.in', phone: '+91-9876543212', nat: 'Indian', id_type: 'passport', id_num: 'N11223344', tags: '{"Corporate"}' },
    { id: randomUUID(), fn: 'Deepa', ln: 'Sharma', email: 'deepa.s@hotmail.com', phone: '+91-9876543213', nat: 'Indian', id_type: 'driving_license', id_num: 'DL-0120170054321', tags: '{"Family"}' },
    { id: randomUUID(), fn: 'Sanjay', ln: 'Gupta', email: 'sanjay.g@pharma.in', phone: '+91-9876543214', nat: 'Indian', id_type: 'aadhaar', id_num: '3322-1144-5566', tags: '{"VIP","Corporate"}' },
    { id: randomUUID(), fn: 'Lisa', ln: 'Zhang', email: 'lisa.z@tech.cn', phone: '+86-13812345678', nat: 'Chinese', id_type: 'passport', id_num: 'CN887766', tags: '{"Corporate"}' }
  ];
  await runBatches(guestProfiles, 15, g => sql`
    INSERT INTO viswa.guest_profiles (id, first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays)
    VALUES (${g.id}, ${g.fn}, ${g.ln}, ${g.email}, ${g.phone}, ${g.nat}, ${g.id_type}, ${g.id_num}, true, ${g.tags}, 1500, 8)
  `);
  console.log("✓ Created 15 Guest Profiles.");

  // 6. Seed Rate Plans
  console.log("\n6. Seeding Rate Plans...");
  const ratePlans = [
    { id: randomUUID(), prop: propVH_id, name: 'Standard Nightly Rate', code: 'BAR', rate: 4500, rules: '{"cancel_policy": "24h", "breakfast": true}' },
    { id: randomUUID(), prop: propVH_id, name: 'Corporate Premier Rate', code: 'CORP', rate: 3800, rules: '{"cancel_policy": "flexible", "breakfast": true}' },
    { id: randomUUID(), prop: propVH_id, name: 'Hourly 6-Hour Transit Pass', code: 'HOURLY6', rate: 1800, rules: '{"hourly": true, "max_hours": 6}' },
    { id: randomUUID(), prop: propSSA_id, name: 'Long Stay Serviced Weekly', code: 'WEEKLY', rate: 2500, rules: '{"min_nights": 7}' },
    { id: randomUUID(), prop: propVSA_id, name: 'HITEC Corporate Stay Plan', code: 'CYBER', rate: 3200, rules: '{"wifi_speed": "100Mbps"}' }
  ];
  await runBatches(ratePlans, 5, rp => sql`
    INSERT INTO viswa.rate_plans (id, property_id, unit_type, name, base_rate, currency, is_dynamic, rules, is_active)
    VALUES (${rp.id}, ${rp.prop}, 'room', ${rp.name}, ${rp.rate}, 'INR', false, ${rp.rules}::jsonb, true)
  `);
  console.log("✓ Created Rate Plans.");

  // 7. Seed 3 Months of Bookings (May, June, July 2026) for VH, SSA, VSA
  console.log("\n7. Seeding 3 Months of Bookings (May, June, July 2026)...");
  const bookingsData = [];
  const vhUnitsList = allUnits.filter(u => u.floor !== flVA1 && u.floor !== flVA2 && u.floor !== flVA3 && u.sqft <= 900 && u.rate <= 18000 && u.rate >= 4500);
  const ssaUnitsList = allUnits.filter(u => u.rate >= 2800 && u.rate <= 6000 && u.sqft <= 850 && u.sqft >= 500);
  const vsaUnitsList = allUnits.filter(u => u.rate >= 3200 && u.rate <= 7200 && u.sqft >= 550);

  // May 2026 Past Checked-Out Bookings (~25 bookings)
  for (let i = 0; i < 25; i++) {
    const prop = i < 12 ? propVH_id : (i < 18 ? propSSA_id : propVSA_id);
    const uList = i < 12 ? vhUnitsList : (i < 18 ? ssaUnitsList : vsaUnitsList);
    const unit = uList[i % uList.length];
    const guest = guestProfiles[i % guestProfiles.length];
    const checkIn = new Date("2026-05-" + String((i % 20) + 1).padStart(2, '0') + "T14:00:00Z");
    const checkOut = new Date(checkIn.getTime() + (2 + (i % 4)) * 86400000);
    const amount = unit.rate * (2 + (i % 4));
    bookingsData.push({
      id: randomUUID(), prop, unit: unit.id, guest: guest.id, model: 'nightly', status: 'checked_out',
      source: i % 3 === 0 ? 'booking.com' : (i % 3 === 1 ? 'direct' : 'goibibo'),
      ci: checkIn, co: checkOut, total: amount, paid: amount,
      checkedInAt: checkIn, checkedOutAt: checkOut
    });
  }

  // June 2026 Past Checked-Out Bookings (~30 bookings)
  for (let i = 0; i < 30; i++) {
    const prop = i < 14 ? propVH_id : (i < 22 ? propSSA_id : propVSA_id);
    const uList = i < 14 ? vhUnitsList : (i < 22 ? ssaUnitsList : vsaUnitsList);
    const unit = uList[i % uList.length];
    const guest = guestProfiles[i % guestProfiles.length];
    const checkIn = new Date("2026-06-" + String((i % 25) + 1).padStart(2, '0') + "T14:00:00Z");
    const checkOut = new Date(checkIn.getTime() + (2 + (i % 4)) * 86400000);
    const amount = unit.rate * (2 + (i % 4));
    bookingsData.push({
      id: randomUUID(), prop, unit: unit.id, guest: guest.id, model: 'nightly', status: 'checked_out',
      source: i % 2 === 0 ? 'direct' : 'expedia',
      ci: checkIn, co: checkOut, total: amount, paid: amount,
      checkedInAt: checkIn, checkedOutAt: checkOut
    });
  }

  // July 2026 Active Checked-In Bookings
  const activeUnits = allUnits.filter(u => u.status === 'occupied' && u.floor !== flVA1 && u.floor !== flVA2 && u.floor !== flVA3);
  for (let i = 0; i < activeUnits.length; i++) {
    const u = activeUnits[i];
    const prop = u.rate >= 4500 ? propVH_id : (u.rate <= 3200 ? propSSA_id : propVSA_id);
    const guest = guestProfiles[i % guestProfiles.length];
    const checkIn = new Date("2026-07-10T14:00:00Z");
    const checkOut = new Date("2026-07-15T11:00:00Z");
    const amount = u.rate * 5;
    bookingsData.push({
      id: randomUUID(), prop, unit: u.id, guest: guest.id, model: 'nightly', status: 'checked_in',
      source: 'direct', ci: checkIn, co: checkOut, total: amount, paid: amount,
      checkedInAt: checkIn, checkedOutAt: null
    });
  }

  // July 2026 Confirmed & Pending Bookings
  for (let i = 0; i < 15; i++) {
    const prop = i < 7 ? propVH_id : (i < 11 ? propSSA_id : propVSA_id);
    const uList = i < 7 ? vhUnitsList : (i < 11 ? ssaUnitsList : vsaUnitsList);
    const unit = uList[(i + 5) % uList.length];
    const guest = guestProfiles[(i + 3) % guestProfiles.length];
    const checkIn = new Date("2026-07-" + String(16 + (i % 12)).padStart(2, '0') + "T14:00:00Z");
    const checkOut = new Date(checkIn.getTime() + 3 * 86400000);
    const amount = unit.rate * 3;
    bookingsData.push({
      id: randomUUID(), prop, unit: unit.id, guest: guest.id, model: 'nightly', status: i % 3 === 0 ? 'pending' : 'confirmed',
      source: 'goibibo', ci: checkIn, co: checkOut, total: amount, paid: i % 3 === 0 ? 0 : amount / 2,
      checkedInAt: null, checkedOutAt: null
    });
  }

  await runBatches(bookingsData, 15, async b => {
    await sql`
      INSERT INTO viswa.bookings (id, property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at, checked_out_at)
      VALUES (${b.id}, ${b.prop}, ${b.unit}, ${b.guest}, ${b.model}, ${b.status}, ${b.source}, ${b.ci}, ${b.co}, 2, 0, ${b.total}, ${b.paid}, ${b.checkedInAt}, ${b.checkedOutAt})
    `;
    if (b.status === 'checked_out') {
      const fbId = randomUUID();
      const rating = 4 + (Math.random() > 0.3 ? 1 : 0);
      const comments = rating === 5 ? "Wonderful experience! Clean rooms and great smart lock access." : "Very good stay, will definitely visit again.";
      await sql`
        INSERT INTO viswa.guest_feedbacks (id, property_id, booking_id, guest_id, department, rating, comments, status)
        VALUES (${fbId}, ${b.prop}, ${b.id}, ${b.guest}, 'frontdesk', ${rating}, ${comments}, 'resolved')
      `;
    }
  });
  console.log(`✓ Seeded ${bookingsData.length} Bookings + Guest Feedbacks.`);

  // 8. Seed Long-Term Rental Leases for Viswa Apartments (VA)
  console.log("\n8. Seeding Lease Agreements & Rent Invoices for Viswa Apartments (VA)...");
  const occupiedVA = allUnits.filter(u => u.status === 'occupied' && (u.floor === flVA1 || u.floor === flVA2 || u.floor === flVA3));
  for (let i = 0; i < occupiedVA.length; i++) {
    const u = occupiedVA[i];
    const guest = guestProfiles[i % guestProfiles.length];
    const leaseId = randomUUID();
    const startDate = "2026-01-01";
    const endDate = "2026-11-30";
    const deposit = u.rate * 3;

    await sql`
      INSERT INTO viswa.lease_agreements (id, property_id, unit_id, tenant_id, agreement_ref, status, start_date, end_date, rent_amount, security_deposit, lock_in_period_months, notice_period_days)
      VALUES (${leaseId}, ${propVA_id}, ${u.id}, ${guest.id}, ${'LEASE-VA-' + (i+101)}, 'active', ${startDate}, ${endDate}, ${u.rate}, ${deposit}, 6, 30)
    `;

    await sql`
      INSERT INTO viswa.deposit_ledger (id, lease_id, transaction_type, amount, description, transaction_date)
      VALUES (${randomUUID()}, ${leaseId}, 'received', ${deposit}, 'Security Deposit Received via NEFT', '2026-01-01T10:00:00Z')
    `;

    const months = [
      { num: '05', name: 'May 2026', status: 'paid', date: '2026-05-01' },
      { num: '06', name: 'June 2026', status: 'paid', date: '2026-06-01' },
      { num: '07', name: 'July 2026', status: 'paid', date: '2026-07-01' }
    ];
    for (const m of months) {
      await sql`
        INSERT INTO viswa.rent_invoices (id, lease_id, invoice_number, period_start, period_end, rent_amount, paid_amount, due_date, status)
        VALUES (${randomUUID()}, ${leaseId}, ${'INV-VA-2026' + m.num + '-' + (i+101)}, ${m.date}, ${m.date}, ${u.rate}, ${u.rate}, ${m.date}, ${m.status})
      `;
    }
  }
  console.log(`✓ Seeded ${occupiedVA.length} Active Leases + May, June, July Rent Invoices & Deposits.`);

  // 9. Seed Housekeeping & Laundry Workflows
  console.log("\n9. Seeding Housekeeping Tasks & Linen Stock...");
  const hkTasks = [];
  const types = ['daily_clean', 'deep_clean', 'turndown', 'checkout_clean'];
  for (let i = 0; i < 60; i++) {
    const prop = i < 25 ? propVH_id : (i < 42 ? propSSA_id : propVSA_id);
    const uList = i < 25 ? vhUnitsList : (i < 42 ? ssaUnitsList : vsaUnitsList);
    const unit = uList[i % uList.length];
    const taskDate = new Date("2026-05-" + String((i % 30) + 1).padStart(2, '0') + "T10:00:00Z");
    hkTasks.push({ prop, unit: unit.id, type: types[i % 4], status: 'resolved', priority: 'medium', date: taskDate });
  }
  for (let i = 0; i < 50; i++) {
    const prop = i < 20 ? propVH_id : (i < 35 ? propSSA_id : propVSA_id);
    const uList = i < 20 ? vhUnitsList : (i < 35 ? ssaUnitsList : vsaUnitsList);
    const unit = uList[i % uList.length];
    const taskDate = new Date("2026-06-" + String((i % 28) + 1).padStart(2, '0') + "T10:00:00Z");
    hkTasks.push({ prop, unit: unit.id, type: types[i % 4], status: 'closed', priority: 'high', date: taskDate });
  }
  for (let i = 0; i < 20; i++) {
    const prop = i < 10 ? propVH_id : (i < 15 ? propSSA_id : propVSA_id);
    const uList = i < 10 ? vhUnitsList : (i < 15 ? ssaUnitsList : vsaUnitsList);
    const unit = uList[i % uList.length];
    const status = i < 8 ? 'in_progress' : (i < 16 ? 'assigned' : 'open');
    hkTasks.push({ prop, unit: unit.id, type: types[i % 4], status, priority: i % 2 === 0 ? 'high' : 'medium', date: JULY_12 });
  }

  await runBatches(hkTasks, 15, t => sql`
    INSERT INTO viswa.housekeeping_tasks (id, property_id, unit_id, task_type, status, priority, scheduled_at)
    VALUES (${randomUUID()}, ${t.prop}, ${t.unit}, ${t.type}, ${t.status}, ${t.priority}, ${t.date})
  `);

  const linenNames = ['King Bed Sheet 300TC', 'Queen Bed Sheet 300TC', 'Bath Towel 600GSM', 'Hand Towel', 'Bath Mat', 'Duvet Cover King'];
  await runBatches(linenNames, 6, name => sql`
    INSERT INTO viswa.linen_items (id, property_id, rfid_tag, item_type, status)
    VALUES (${randomUUID()}, ${propVH_id}, ${'RFID-' + Math.floor(100000 + Math.random() * 900000)}, ${name}, 'clean'),
           (${randomUUID()}, ${propSSA_id}, ${'RFID-' + Math.floor(100000 + Math.random() * 900000)}, ${name}, 'clean'),
           (${randomUUID()}, ${propVSA_id}, ${'RFID-' + Math.floor(100000 + Math.random() * 900000)}, ${name}, 'clean')
  `);
  console.log(`✓ Seeded ${hkTasks.length} Housekeeping Tasks + Laundry Linen Stock.`);

  // 10. Seed Maintenance Tickets & Asset Register
  console.log("\n10. Seeding Assets & Maintenance Tickets...");
  const assets = [
    { name: 'Daikin Inverter AC 1.5T', type: 'HVAC', brand: 'Daikin', cost: 42000, prop: propVH_id },
    { name: 'Salto Smart Lock V4', type: 'Smart Lock', brand: 'Salto', cost: 18000, prop: propVH_id },
    { name: 'AO Smith Geyser 25L', type: 'Plumbing', brand: 'AO Smith', cost: 14000, prop: propSSA_id },
    { name: 'Elevator Bank Tower A', type: 'Lifts', brand: 'Johnson', cost: 850000, prop: propVA_id },
    { name: 'Backup Diesel Generator 125KVA', type: 'Power', brand: 'Cummins', cost: 650000, prop: propVSA_id }
  ];
  await runBatches(assets, 5, a => sql`
    INSERT INTO viswa.asset_register (id, property_id, asset_type, brand, model, serial_number, purchase_date, current_value, status)
    VALUES (${randomUUID()}, ${a.prop}, ${a.type}, ${a.brand}, ${a.name}, ${'SN-2026-' + Math.floor(1000 + Math.random() * 9000)}, '2025-06-15', ${a.cost}, 'active')
  `);

  const maintTickets = [
    { prop: propVH_id, num: 'TKT-MAY-01', title: 'AC Cooling low in Room 102', cat: 'HVAC', prio: 'high', status: 'closed', date: '2026-05-04T11:00:00Z' },
    { prop: propSSA_id, num: 'TKT-MAY-02', title: 'Bathroom tap drip S-104', cat: 'Plumbing', prio: 'medium', status: 'closed', date: '2026-05-12T14:00:00Z' },
    { prop: propVA_id, num: 'TKT-MAY-03', title: 'Elevator sensor alignment', cat: 'Lifts', prio: 'critical', status: 'closed', date: '2026-05-20T09:00:00Z' },
    { prop: propVH_id, num: 'TKT-JUN-01', title: 'Smart lock battery low Room 205', cat: 'Smart Lock', prio: 'high', status: 'closed', date: '2026-06-08T15:00:00Z' },
    { prop: propVSA_id, num: 'TKT-JUN-02', title: 'Kitchenette exhaust fan replacement', cat: 'Electrical', prio: 'medium', status: 'closed', date: '2026-06-18T12:00:00Z' },
    { prop: propSSA_id, num: 'TKT-JUN-03', title: 'Water heater thermostat calibration', cat: 'Plumbing', prio: 'high', status: 'closed', date: '2026-06-25T16:00:00Z' },
    { prop: propVH_id, num: 'TKT-JUL-01', title: 'AC compressor check Level 3 Suite 301', cat: 'HVAC', prio: 'critical', status: 'in_progress', date: '2026-07-10T10:00:00Z' },
    { prop: propVSA_id, num: 'TKT-JUL-02', title: 'Rooftop pool filtration pump service', cat: 'Pool', prio: 'high', status: 'open', date: '2026-07-11T11:00:00Z' },
    { prop: propVA_id, num: 'TKT-JUL-03', title: 'Corridor emergency lighting test Block A', cat: 'Electrical', prio: 'medium', status: 'open', date: '2026-07-12T10:00:00Z' }
  ];
  await runBatches(maintTickets, 5, mt => sql`
    INSERT INTO viswa.maintenance_tickets (id, property_id, ticket_number, ticket_type, title, category, priority, status, created_at)
    VALUES (${randomUUID()}, ${mt.prop}, ${mt.num}, 'corrective', ${mt.title}, ${mt.cat}, ${mt.prio}, ${mt.status}, ${mt.date})
  `);
  console.log("✓ Seeded Assets & Maintenance Tickets across May, June, July.");

  // 11. Seed Departments, Employees & Payroll Runs across May, June, July
  console.log("\n11. Seeding Departments, Employees & Payroll across 3 Months...");
  const depts = [
    { id: randomUUID(), name: 'Front Desk & Operations', code: 'FD' },
    { id: randomUUID(), name: 'Housekeeping & Laundry', code: 'HK' },
    { id: randomUUID(), name: 'Engineering & Maintenance', code: 'MT' },
    { id: randomUUID(), name: 'Finance & Accounts', code: 'FN' },
    { id: randomUUID(), name: 'Human Resources & Admin', code: 'HR' }
  ];
  await runBatches(depts, 5, d => sql`INSERT INTO viswa.departments (id, property_id, name, code) VALUES (${d.id}, ${propVH_id}, ${d.name}, ${d.code})`);

  const staff = [
    { fn: 'Rakesh', ln: 'Nair', code: 'EMP001', role: 'Front Desk Executive', salary: 35000, dept: depts[0].id, prop: propVH_id },
    { fn: 'Sunita', ln: 'Patel', code: 'EMP002', role: 'Housekeeping Supervisor', salary: 32000, dept: depts[1].id, prop: propVH_id },
    { fn: 'Senthil', ln: 'Kumar', code: 'EMP003', role: 'Chief Electrician', salary: 38000, dept: depts[2].id, prop: propSSA_id },
    { fn: 'Priyanka', ln: 'Menon', code: 'EMP004', role: 'Finance Analyst', salary: 48000, dept: depts[3].id, prop: propVA_id },
    { fn: 'Vikram', ln: 'Singh', code: 'EMP005', role: 'Property Manager', salary: 65000, dept: depts[0].id, prop: propVSA_id }
  ];
  const empIds = [];
  for (const s of staff) {
    const eid = randomUUID();
    empIds.push({ id: eid, salary: s.salary, name: `${s.fn} ${s.ln}` });
    await sql`
      INSERT INTO viswa.employees (id, property_id, department_id, employee_code, designation, base_salary, doj, is_active)
      VALUES (${eid}, ${s.prop}, ${s.dept}, ${s.code}, ${s.role}, ${s.salary}, '2025-01-15', true)
    `;
  }

  const payrollMonths = [
    { start: '2026-05-01', end: '2026-05-31', date: '2026-05-31', status: 'completed' },
    { start: '2026-06-01', end: '2026-06-30', date: '2026-06-30', status: 'completed' },
    { start: '2026-07-01', end: '2026-07-31', date: '2026-07-31', status: 'processing' }
  ];
  for (const pm of payrollMonths) {
    const runId = randomUUID();
    let totalGross = 0, totalDed = 0, totalNet = 0;
    for (const e of empIds) {
      const gross = e.salary;
      const pf = gross * 0.12;
      const tds = gross * 0.05;
      const ded = pf + tds;
      const net = gross - ded;
      totalGross += gross;
      totalDed += ded;
      totalNet += net;
    }
    await sql`
      INSERT INTO viswa.payroll_runs (id, property_id, period_start, period_end, run_date, status, total_gross, total_deductions, total_net)
      VALUES (${runId}, ${propVH_id}, ${pm.start}, ${pm.end}, ${pm.date}, ${pm.status}, ${totalGross}, ${totalDed}, ${totalNet})
    `;
    for (const e of empIds) {
      const gross = e.salary;
      const pf = gross * 0.12;
      const tds = gross * 0.05;
      await sql`
        INSERT INTO viswa.payroll_lines (id, payroll_id, employee_id, gross_pay, pf_deduction, tds_deduction)
        VALUES (${randomUUID()}, ${runId}, ${e.id}, ${gross}, ${pf}, ${tds})
      `;
    }
  }
  console.log("✓ Seeded Departments, Staff + May, June, July Payroll Runs & Lines.");

  // 12. Seed Chart of Accounts, Journal Entries & Vendor Bills across May, June, July
  console.log("\n12. Seeding Chart of Accounts, Journal Entries & Vendor Bills...");
  const accounts = [
    { code: '1000', name: 'Cash on Hand', type: 'asset' },
    { code: '1010', name: 'HDFC Bank Operating Account', type: 'asset' },
    { code: '1200', name: 'Accounts Receivable - Guests & Corporate', type: 'asset' },
    { code: '2000', name: 'Accounts Payable - Vendors', type: 'liability' },
    { code: '2100', name: 'GST Output Payable (18%/12%)', type: 'liability' },
    { code: '4000', name: 'Room Revenue - Nightly Stays', type: 'revenue' },
    { code: '4010', name: 'Long-Term Rental Income', type: 'revenue' },
    { code: '4020', name: 'F&B and Restaurant Revenue', type: 'revenue' },
    { code: '5000', name: 'Housekeeping & Guest Supplies', type: 'expense' },
    { code: '5010', name: 'Engineering & Maintenance Repairs', type: 'expense' },
    { code: '5020', name: 'Staff Salaries & Payroll', type: 'expense' },
    { code: '5030', name: 'Electricity & Municipal Utilities', type: 'expense' }
  ];
  const accMap = {};
  for (const a of accounts) {
    const aid = randomUUID();
    accMap[a.code] = aid;
    await sql`
      INSERT INTO viswa.chart_of_accounts (id, property_id, account_code, account_name, account_type, is_system, is_active, opening_balance)
      VALUES (${aid}, ${propVH_id}, ${a.code}, ${a.name}, ${a.type}, true, true, 500000)
    `;
  }

  const journals = [
    { date: '2026-05-31', desc: 'May 2026 Consolidated Revenue & Payroll Summary', rev: 1850000, exp: 620000 },
    { date: '2026-06-30', desc: 'June 2026 Consolidated Revenue & Payroll Summary', rev: 2240000, exp: 680000 },
    { date: '2026-07-10', desc: 'July 2026 Mid-Month Revenue Accrual', rev: 1450000, exp: 410000 }
  ];
  for (const j of journals) {
    const jid = randomUUID();
    await sql`
      INSERT INTO viswa.journal_entries (id, property_id, entry_date, description, is_posted)
      VALUES (${jid}, ${propVH_id}, ${j.date}, ${j.desc}, true)
    `;
    await sql`
      INSERT INTO viswa.journal_lines (id, journal_id, account_id, debit, credit, description)
      VALUES 
        (${randomUUID()}, ${jid}, ${accMap['1010']}, ${j.rev}, 0, 'Bank Receipt'),
        (${randomUUID()}, ${jid}, ${accMap['4000']}, 0, ${j.rev * 0.6}, 'Room Revenue Credit'),
        (${randomUUID()}, ${jid}, ${accMap['4010']}, 0, ${j.rev * 0.3}, 'Rental Income Credit'),
        (${randomUUID()}, ${jid}, ${accMap['4020']}, 0, ${j.rev * 0.1}, 'F&B Credit'),
        (${randomUUID()}, ${jid}, ${accMap['5020']}, ${j.exp * 0.6}, 0, 'Payroll Expense'),
        (${randomUUID()}, ${jid}, ${accMap['5000']}, ${j.exp * 0.25}, 0, 'Supplies Expense'),
        (${randomUUID()}, ${jid}, ${accMap['5030']}, ${j.exp * 0.15}, 0, 'Utilities Expense'),
        (${randomUUID()}, ${jid}, ${accMap['1010']}, 0, ${j.exp}, 'Bank Payment')
    `;
  }

  const vendorsList = [
    { name: 'Johnson Lifts & Escalators', cat: 'elevator_maintenance', contact: 'service@johnsonlifts.in' },
    { name: 'Voltas Air Conditioning Pvt Ltd', cat: 'hvac_repairs', contact: 'support@voltas.com' },
    { name: 'Fabindia Hospitality Linen Supply', cat: 'linen_supplies', contact: 'orders@fabindia.com' },
    { name: 'Apex Commercial Plumbing & Hardware', cat: 'plumbing_parts', contact: 'sales@apexhardware.in' }
  ];
  const vIds = [];
  for (const v of vendorsList) {
    const vid = randomUUID();
    vIds.push(vid);
    await sql`
      INSERT INTO viswa.vendors (id, property_id, company_name, contact_person, email, status)
      VALUES (${vid}, ${propVH_id}, ${v.name}, 'Support Desk', ${v.contact}, 'active')
    `;
  }

  const bills = [
    { vid: vIds[0], num: 'BILL-JL-MAY26', date: '2026-05-10', due: '2026-05-25', amount: 45000, status: 'paid' },
    { vid: vIds[1], num: 'BILL-VOL-MAY26', date: '2026-05-18', due: '2026-06-02', amount: 82000, status: 'paid' },
    { vid: vIds[2], num: 'BILL-FAB-JUN26', date: '2026-06-05', due: '2026-06-20', amount: 115000, status: 'paid' },
    { vid: vIds[3], num: 'BILL-APX-JUN26', date: '2026-06-20', due: '2026-07-05', amount: 34000, status: 'paid' },
    { vid: vIds[1], num: 'BILL-VOL-JUL26', date: '2026-07-05', due: '2026-07-20', amount: 65000, status: 'sent' }
  ];
  for (const b of bills) {
    const bid = randomUUID();
    await sql`
      INSERT INTO viswa.vendor_bills (id, property_id, vendor_id, bill_number, bill_date, due_date, subtotal, grand_total, paid_total, status)
      VALUES (${bid}, ${propVH_id}, ${b.vid}, ${b.num}, ${b.date}, ${b.due}, ${b.amount}, ${b.amount}, ${b.status === 'paid' ? b.amount : 0}, ${b.status})
    `;
    if (b.status === 'paid') {
      await sql`
        INSERT INTO viswa.bill_payments (id, property_id, bill_id, payment_method, reference_number, amount, payment_date, status)
        VALUES (${randomUUID()}, ${propVH_id}, ${bid}, 'neft', ${'UTRIBK2026' + Math.floor(100000 + Math.random() * 900000)}, ${b.amount}, ${b.date + 'T14:00:00Z'}, 'completed')
      `;
    }
  }
  console.log("✓ Seeded Chart of Accounts, Journal Entries & Vendor Bills across May, June, July.");

  // 13. Seed & Assign Demo Users across all 4 Properties
  console.log("\n13. Seeding Demo Users & Role Assignments across all 4 Workspaces...");
  await sql`DELETE FROM viswa.user_roles`;
  await sql`DELETE FROM viswa.users`;

  const demoUsers = [
    { email: 'superadmin@ehms.demo', fn: 'Joan', ln: 'Smith', role: 'super_admin' },
    { email: 'admin@ehms.demo', fn: 'Admin', ln: 'User', role: 'property_manager' },
    { email: 'frontdesk@ehms.demo', fn: 'Ravi', ln: 'Kumar', role: 'front_desk' },
    { email: 'housekeeping@ehms.demo', fn: 'Meena', ln: 'Pillai', role: 'housekeeping_supervisor' },
    { email: 'maintenance@ehms.demo', fn: 'Arjun', ln: 'Sharma', role: 'maintenance_staff' },
    { email: 'hr@ehms.demo', fn: 'Priya', ln: 'Nair', role: 'hr_manager' },
    { email: 'finance@ehms.demo', fn: 'Vikram', ln: 'Iyer', role: 'finance_manager' },
    { email: 'executive@ehms.demo', fn: 'Anita', ln: 'Desai', role: 'executive' }
  ];

  for (const du of demoUsers) {
    const uid = randomUUID();
    await sql`
      INSERT INTO viswa.users (id, email, phone, password_hash, first_name, last_name, is_active)
      VALUES (${uid}, ${du.email}, '+91-9000000000', crypt('Demo@1234', gen_salt('bf')), ${du.fn}, ${du.ln}, true)
    `;

    // Assign role across all 4 properties plus global NULL assignment
    const propsToAssign = du.role === 'super_admin' ? [null] : [propVA_id, propVH_id, propSSA_id, propVSA_id];
    for (const pid of propsToAssign) {
      await sql`
        INSERT INTO viswa.user_roles (id, user_id, role_id, property_id)
        SELECT ${randomUUID()}, ${uid}, r.id, ${pid}
        FROM viswa.roles r WHERE r.name = ${du.role}
      `;
    }
  }
  console.log("✓ Seeded all 8 Demo Users & assigned roles cleanly across all 4 Workspaces.");

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n==========================================================================");
  console.log(`✨ SUCCESS: Viswa Group of Estates (VISWA) 3-Month Demo Seeding Complete in ${elapsed}s!`);
  console.log("==========================================================================");
}

seed().catch(err => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
