/**
 * seed-nivesh.mjs — Seed a complete demo dataset for the NIVESH tenant shard.
 * Usage: node scripts/seed-nivesh.mjs
 * Runs against the nivesh schema (search_path = nivesh, public).
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const url = envContent.split("\n").find(l => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();

const pool = new pg.Pool({ connectionString: url, max: 1 });
const c = await pool.connect();
await c.query("SET search_path TO nivesh, public");

const uid = () => crypto.randomUUID();
const now = () => new Date();
const iso = (d) => (d instanceof Date ? d.toISOString() : new Date(d).toISOString());
const dateOnly = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d);

// Reference dates (today = 2026-08-14)
const T = new Date("2026-08-14T10:00:00Z");
const days = (n) => new Date(T.getTime() + n * 86400000);
const daysStr = (n) => days(n).toISOString().slice(0, 10);

let inserts = 0;
const generatedCols = new Map();
async function getGenerated(table) {
  if (!generatedCols.has(table)) {
    const r = await c.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 AND is_generated = 'ALWAYS'`,
      [table]
    );
    generatedCols.set(table, new Set(r.rows.map((x) => x.column_name)));
  }
  return generatedCols.get(table);
}
async function ins(table, row) {
  const skip = await getGenerated(table);
  const cols = Object.keys(row).filter((col) => !skip.has(col));
  const vals = cols.map((col) => row[col]);
  const ph = vals.map((_, i) => "$" + (i + 1)).join(", ");
  await c.query(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${ph})`, vals);
  inserts++;
}

let count = 0;
async function cnt(table) {
  const r = await c.query(`SELECT count(*)::int n FROM ${table}`);
  return r.rows[0].n;
}

console.log("🌱 Seeding NIVESH demo dataset...");

await c.query("BEGIN");

try {
  // ─────────────────────────────────────────────────────────────
  // 0. Copy schema-agnostic master catalog from viswa template
  // ─────────────────────────────────────────────────────────────
  const masterTables = [
    "booking_sources", "channel_partners", "cities", "countries", "document_types",
    "id_proof_types", "payment_modes", "property_groups", "states", "tax_slabs",
    "uom", "asset_categories", "notification_templates",
  ];
  for (const t of masterTables) {
    await c.query(`INSERT INTO ${t} SELECT * FROM viswa.${t} ON CONFLICT DO NOTHING`).catch((e) => console.warn(`  skip copy ${t}: ${e.message.slice(0, 80)}`));
  }
  console.log("✔ master catalog copied");

  // ─────────────────────────────────────────────────────────────
  // 1. Enterprise + Region
  // ─────────────────────────────────────────────────────────────
  const enterpriseId = uid();
  await ins("enterprises", { id: enterpriseId, name: "Nivesh Resorts & Hotels Ltd", code: "NIVESH", currency: "INR", timezone: "Asia/Kolkata" });
  const regionId = uid();
  await ins("regions", { id: regionId, enterprise_id: enterpriseId, name: "Chennai East", code: "CHN-E", country: "India", state: "Tamil Nadu", city: "Chennai" });

  // ─────────────────────────────────────────────────────────────
  // 2. Properties (all 4 verticals)
  // ─────────────────────────────────────────────────────────────
  const hot = uid();  // Nivesh Grand Resorts
  const ser = uid();  // Nivesh Service Apartments
  const ren = uid();  // Nivesh Rental Residences
  const wpk = uid();  // Nivesh Business Park

  const properties = [
    { id: hot, name: "Nivesh Grand Resorts", code: "NGR", vertical_type: "hotel", booking_model: "nightly", address: "12 East Coast Road, Chennai 600041", latitude: 13.02, longitude: 80.25, phone: "+91-44-4000-1001", email: "reservations@nivesh.demo", check_in_time: "14:00", check_out_time: "11:00", star_rating: 5, config: { features: { rooms_map: { enabled: true }, rate_card: { enabled: true }, restaurant: { enabled: true }, laundry: { enabled: true } } } },
    { id: ser, name: "Nivesh Service Apartments", code: "NSA", vertical_type: "service_apartment", booking_model: "nightly", address: "45 Anna Salai, Chennai 600002", latitude: 13.06, longitude: 80.26, phone: "+91-44-4000-2001", email: "stay@nivesh.demo", check_in_time: "13:00", check_out_time: "11:00", star_rating: 4, config: { features: { rooms_map: { enabled: true }, rate_card: { enabled: true }, laundry: { enabled: true }, maintenance: { enabled: true } } } },
    { id: ren, name: "Nivesh Rental Residences", code: "NRR", vertical_type: "rental_apartment", booking_model: "lease", address: "78 GST Road, Guindy, Chennai 600032", latitude: 13.01, longitude: 80.21, phone: "+91-44-4000-3001", email: "rental@nivesh.demo", check_in_time: "12:00", check_out_time: "12:00", star_rating: 3, config: { features: { maintenance: { enabled: true } } } },
    { id: wpk, name: "Nivesh Business Park", code: "NBP", vertical_type: "workplace", booking_model: "membership", address: "5 OMR, Thoraipakkam, Chennai 600097", latitude: 12.93, longitude: 80.24, phone: "+91-44-4000-4001", email: "workspace@nivesh.demo", check_in_time: "09:00", check_out_time: "21:00", star_rating: 4, config: { features: { maintenance: { enabled: true } } } },
  ];
  for (const p of properties) await ins("properties", { id: p.id, region_id: regionId, name: p.name, code: p.code, vertical_type: p.vertical_type, booking_model: p.booking_model, address: p.address, latitude: p.latitude, longitude: p.longitude, phone: p.phone, email: p.email, check_in_time: p.check_in_time, check_out_time: p.check_out_time, star_rating: p.star_rating, is_active: true, config: JSON.stringify(p.config) });
  console.log("✔ 4 properties");

  // ─────────────────────────────────────────────────────────────
  // 3. Facilities + Room categories + Rate plans
  // ─────────────────────────────────────────────────────────────
  const facilities = [
    [hot, ["Swimming Pool", "Gym", "Spa", "High-Speed WiFi", "Restaurant", "Valet Parking", "24/7 Room Service"]],
    [ser, ["High-Speed WiFi", "Modular Kitchenette", "Laundry", "Housekeeping", "Parking"]],
    [ren, ["Power Backup", "Water Supply", "Elevator", "Intercom"]],
    [wpk, ["High-Speed WiFi", "Cafeteria", "Conference Room", "Phone Booths", "Parking"]],
  ];
  for (const [pid, list] of facilities) {
    for (const name of list) await ins("facilities", { property_id: pid, name, code: name.slice(0, 10).toUpperCase().replace(/\s/g, "_"), description: name, is_active: true });
  }

  const categories = [
    [hot, "Deluxe King", "DLX-K", 5500, "King bed, 32sqm, city view"],
    [hot, "Executive Suite", "EXEC-S", 8500, "Suite with living area, 48sqm"],
    [hot, "Grand Suite", "GRAND-S", 14500, "Panoramic sea view, 72sqm, lounge access"],
    [ser, "1BHK Executive", "1BHK", 6500, "Studio 1BHK with kitchenette, 38sqm"],
    [ser, "2BHK Family", "2BHK", 9800, "Two-bedroom family apartment, 65sqm"],
    [ren, "2BHK Standard", "R2BHK", 24000, "Monthly rental, 2BHK"],
    [ren, "3BHK Premium", "R3BHK", 36000, "Monthly rental, 3BHK with balcony"],
    [wpk, "Hot Desk", "DESK", 500, "Daily hot desk access"],
    [wpk, "Meeting Room", "MEET", 999, "Hourly meeting room hire"],
  ];
  for (const [pid, name, code, price, desc] of categories) await ins("room_categories", { property_id: pid, name, code, description: desc, base_price: price, is_active: true });

  const ratePlans = [
    [hot, "BAR", 5500, 0.0], [hot, "Corporate", 4950, 0.0], [hot, "Weekend Saver", 5999, 0.0], [hot, "Advance Purchase", 4650, 0.0],
    [ser, "BAR", 6500, 0.0], [ser, "Monthly Stay", 155000, 0.0],
    [ren, "Monthly Lease", 24000, 0.0],
    [wpk, "Hot Desk Day", 500, 0.0], [wpk, "Meeting Room Hour", 999, 0.0],
  ];
  for (const [pid, name, rate, dyn] of ratePlans) await ins("rate_plans", { property_id: pid, name, base_rate: rate, currency: "INR", is_dynamic: false, effective_from: daysStr(-180), effective_to: daysStr(180), is_active: true });

  // ─────────────────────────────────────────────────────────────
  // 4. Buildings / Floors / Units
  // ─────────────────────────────────────────────────────────────
  async function makeBuilding(pid, name, code, floors) {
    const bid = uid();
    await ins("buildings", { id: bid, property_id: pid, name, code, floors, year_built: 2020 });
    const ids = [];
    for (let i = 1; i <= floors; i++) {
      const fid = uid();
      await ins("floors", { id: fid, building_id: bid, name: `Floor ${i}`, floor_number: i });
      ids.push(fid);
    }
    return ids;
  }

  // Hotel — Main Tower, 3 floors x 4 rooms
  const hotelFloors = await makeBuilding(hot, "Main Tower", "MT", 3);
  const hotelUnitIds = [];
  {
    const rms = [
      [101, "Deluxe King", 5500, 2, "room"], [102, "Deluxe King", 5500, 2, "room"], [103, "Executive Suite", 8500, 3, "suite"], [104, "Deluxe King", 5500, 2, "room"],
      [201, "Deluxe King", 5500, 2, "room"], [202, "Executive Suite", 8500, 3, "suite"], [203, "Grand Suite", 14500, 4, "suite"], [204, "Deluxe King", 5500, 2, "room"],
      [301, "Grand Suite", 14500, 4, "suite"], [302, "Executive Suite", 8500, 3, "suite"], [303, "Deluxe King", 5500, 2, "room"], [304, "Deluxe King", 5500, 2, "room"],
    ];
    let i = 0;
    for (const f of hotelFloors) {
      for (let j = 0; j < 4; j++) {
        const [label, cat, rate, pax, type] = rms[i++];
        const id = uid();
        hotelUnitIds.push(id);
        await ins("units", { id, floor_id: f, unit_type: type, unit_label: String(label), layout_type: cat, sq_ft: type === "suite" ? 48 : 32, max_occupancy: pax, base_rate: rate, status: "vacant", is_active: true, attributes: JSON.stringify({ ac: true, category_name: cat, bed_type: "King", features: ["WiFi", "TV", "Minibar"], smoking: false }) });
      }
    }
  }

  // Service Apartments — Residences Tower, 4 floors x 2
  const saFloors = await makeBuilding(ser, "Residences Tower", "RT", 4);
  const saUnitIds = [];
  {
    const rms = [[101, "1BHK Executive", 6500, 2, "apartment"], [102, "2BHK Family", 9800, 4, "apartment"], [201, "1BHK Executive", 6500, 2, "apartment"], [202, "2BHK Family", 9800, 4, "apartment"], [301, "1BHK Executive", 6500, 2, "apartment"], [302, "2BHK Family", 9800, 4, "apartment"], [401, "1BHK Executive", 6500, 2, "apartment"], [402, "2BHK Family", 9800, 4, "apartment"]];
    let i = 0;
    for (const f of saFloors) {
      for (let j = 0; j < 2; j++) {
        const [label, cat, rate, pax, type] = rms[i++];
        const id = uid();
        saUnitIds.push(id);
        await ins("units", { id, floor_id: f, unit_type: type, unit_label: "SA" + label, layout_type: cat, sq_ft: cat.includes("2BHK") ? 65 : 38, max_occupancy: pax, base_rate: rate, status: "vacant", is_active: true, attributes: JSON.stringify({ ac: true, category_name: cat, features: ["Kitchenette", "WiFi"], smoking: false }) });
      }
    }
  }

  // Rental — Green Residences, 3 floors x 2
  const renFloors = await makeBuilding(ren, "Green Residences", "GR", 3);
  const renUnitIds = [];
  {
    const rms = [[101, "2BHK Standard", 24000, 3, "apartment"], [102, "3BHK Premium", 36000, 5, "apartment"], [201, "2BHK Standard", 24000, 3, "apartment"], [202, "3BHK Premium", 36000, 5, "apartment"], [301, "2BHK Standard", 24000, 3, "apartment"], [302, "3BHK Premium", 36000, 5, "apartment"]];
    let i = 0;
    for (const f of renFloors) {
      for (let j = 0; j < 2; j++) {
        const [label, cat, rate, pax, type] = rms[i++];
        const id = uid();
        renUnitIds.push(id);
        await ins("units", { id, floor_id: f, unit_type: type, unit_label: "R" + label, layout_type: cat, sq_ft: cat.includes("3BHK") ? 120 : 90, max_occupancy: pax, base_rate: rate, status: "vacant", is_active: true, attributes: JSON.stringify({ category_name: cat, features: ["Power Backup", "Elevator"], smoking: false }) });
      }
    }
  }

  // Workplace — Corporate Centre, 2 floors
  const wpkFloors = await makeBuilding(wpk, "Corporate Centre", "CC", 2);
  const deskIds = [], meetingIds = [], cabinIds = [];
  {
    let deskNo = 1;
    let floorIdx = 1;
    for (const f of wpkFloors) {
      for (let j = 0; j < 5; j++) {
        const id = uid(); deskIds.push(id);
        await ins("units", { id, floor_id: f, unit_type: "desk", unit_label: `D${floorIdx * 100 + deskNo}`, layout_type: "Hot Desk", sq_ft: 12, max_occupancy: 1, base_rate: 500, status: "vacant", is_active: true, attributes: JSON.stringify({ features: ["Ergonomic chair", "Power"] }) });
        deskNo++;
      }
      const m1 = uid(); meetingIds.push(m1);
      await ins("units", { id: m1, floor_id: f, unit_type: "meeting_room", unit_label: `MR${floorIdx * 100 + 1}`, layout_type: "Meeting Room", sq_ft: 120, max_occupancy: 6, base_rate: 999, status: "vacant", is_active: true, attributes: JSON.stringify({ features: ["Whiteboard", "TV"] }) });
      const cab = uid(); cabinIds.push(cab);
      await ins("units", { id: cab, floor_id: f, unit_type: "cabin", unit_label: `CB${floorIdx * 100 + 1}`, layout_type: "Private Cabin", sq_ft: 90, max_occupancy: 2, base_rate: 19999, status: "vacant", is_active: true, attributes: JSON.stringify({ features: ["Lockable", "Desk"] }) });
      floorIdx++;
    }
  }
  console.log("✔ buildings/floors/units:", hotelUnitIds.length + " hotel,", saUnitIds.length + " SA,", renUnitIds.length + " rental,", (deskIds.length + meetingIds.length + cabinIds.length) + " workplace");

  // ─────────────────────────────────────────────────────────────
  // 5. Guests
  // ─────────────────────────────────────────────────────────────
  const guests = [];
  const guestData = [
    ["Arjun", "Mehta", "arjun.mehta@gmail.com", "+91-98400-10001", "Indian", 7],
    ["Priya", "Sharma", "priya.sharma@outlook.com", "+91-98400-10002", "Indian", 3],
    ["David", "Chen", "david.chen@globex.com", "+1-415-555-0100", "Singaporean", 12],
    ["Ayesha", "Khan", "ayesha.khan@yahoo.com", "+91-98400-10003", "Indian", 2],
    ["Rohan", "Verma", "rohan.verma@gmail.com", "+91-98400-10004", "Indian", 5],
    ["Sarah", "Johnson", "sarah.j@britishairways.com", "+44-20-7946-0958", "British", 9],
    ["Vikram", "Reddy", "vikram.reddy@infotech.co", "+91-98400-10005", "Indian", 4],
    ["Meera", "Nair", "meera.nair@gmail.com", "+91-98400-10006", "Indian", 1],
  ];
  for (const [fn, ln, email, phone, nat, stays] of guestData) {
    const id = uid();
    guests.push(id);
    await ins("guest_profiles", { id, first_name: fn, last_name: ln, email, phone, id_type: "PAN", id_number: "XXXX" + Math.floor(1000 + Math.random() * 9000), id_verified: true, id_verified_at: daysStr(-30), nationality: nat, tags: ["premium"], preferences: JSON.stringify({ room_preference: "high_floor", bed_type: "king" }), total_stays: stays, loyalty_points: stays * 250 });
  }
  console.log("✔ guests:", guests.length);

  // ─────────────────────────────────────────────────────────────
  // 6. Meal plans, then Bookings
  // ─────────────────────────────────────────────────────────────
  const mp1 = uid(), mp2 = uid(), mp3 = uid();
  await ins("meal_plans", { id: mp1, property_id: hot, code: "BB", name: "Bed & Breakfast", includes_breakfast: true, includes_lunch: false, includes_dinner: false });
  await ins("meal_plans", { id: mp2, property_id: hot, code: "HB", name: "Half Board", includes_breakfast: true, includes_lunch: false, includes_dinner: true });
  await ins("meal_plans", { id: mp3, property_id: hot, code: "FB", name: "Full Board", includes_breakfast: true, includes_lunch: true, includes_dinner: true });

  // bookings: [property, unit, guest, model, status, checkInOffset, nights, adults, children, amount, paid, source]
  const bk = [];
  async function makeBooking(propId, unitId, guestId, model, status, cIn, nights, adults, children, amount, paid, source) {
    const id = uid();
    const ci = new Date(days(cIn));
    const co = new Date(ci.getTime() + nights * 86400000);
    const tax = Math.round(amount * 0.18);
    const row = { id, property_id: propId, unit_id: unitId, guest_id: guestId, booking_model: model, status, source, source_booking_ref: source !== "direct" ? source.toUpperCase() + "-" + Math.floor(100000 + Math.random() * 899999) : null, check_in: iso(ci), check_out: iso(co), adults, children, total_amount: amount, tax_amount: tax, paid_amount: paid, balance_amount: amount - paid, currency: "INR" };
    if (status === "checked_in") row.checked_in_at = iso(new Date(ci.getTime() + 3600000));
    if (status === "checked_out") { row.checked_in_at = iso(new Date(ci.getTime() + 3600000)); row.checked_out_at = iso(co); }
    await ins("bookings", row);
    bk.push(id);
    await ins("booking_guests", { booking_id: id, guest_id: guestId, is_primary: true });
    return id;
  }

  // Past — checked out (last week)
  const b1 = await makeBooking(hot, hotelUnitIds[0], guests[0], "nightly", "checked_out", -14, 3, 2, 0, 16500, 16500, "booking.com");
  const b2 = await makeBooking(hot, hotelUnitIds[4], guests[1], "nightly", "checked_out", -10, 2, 2, 1, 11000, 11000, "direct");
  const b3 = await makeBooking(ser, saUnitIds[0], guests[4], "nightly", "checked_out", -7, 5, 2, 0, 32500, 32500, "make_my_trip");
  // Current — checked in (in-house today)
  const b4 = await makeBooking(hot, hotelUnitIds[3], guests[2], "nightly", "checked_in", 0, 4, 2, 0, 22000, 11000, "direct");
  const b5 = await makeBooking(hot, hotelUnitIds[5], guests[3], "nightly", "checked_in", -1, 3, 2, 2, 25500, 25500, "booking.com");
  const b6 = await makeBooking(ser, saUnitIds[1], guests[5], "nightly", "checked_in", 0, 6, 3, 0, 58800, 30000, "direct");
  // Future — confirmed (upcoming)
  const b7 = await makeBooking(hot, hotelUnitIds[8], guests[6], "nightly", "confirmed", 5, 2, 2, 0, 29000, 9000, "agoda");
  const b8 = await makeBooking(hot, hotelUnitIds[1], guests[7], "nightly", "confirmed", 12, 3, 2, 1, 16500, 5000, "direct");
  const b9 = await makeBooking(ser, saUnitIds[2], guests[0], "nightly", "confirmed", 8, 4, 2, 0, 26000, 6500, "make_my_trip");
  // Cancelled + pending
  const b10 = await makeBooking(hot, hotelUnitIds[2], guests[1], "nightly", "cancelled", -2, 2, 2, 0, 17000, 0, "booking.com");
  const b11 = await makeBooking(hot, hotelUnitIds[6], guests[4], "nightly", "pending", 3, 1, 1, 0, 14500, 0, "direct");
  console.log("✔ bookings:", bk.length, "(checked_out 3, checked_in 3, confirmed 3, cancelled/pending 2)");

  // Guest extras
  await ins("guest_preferences", { guest_id: guests[2], preference_key: "room_type", preference_value: "high floor, sea view" });
  await ins("guest_preferences", { guest_id: guests[2], preference_key: "pillow", preference_value: "memory foam" });
  await ins("guest_requests", { property_id: hot, booking_id: b4, request_type: "housekeeping", description: "Extra towels and early turndown", status: "in_progress", assigned_to_dept: "housekeeping" });
  await ins("guest_requests", { property_id: hot, booking_id: b5, request_type: "room_service", description: "Dinner table for 4 at 8pm", status: "resolved", assigned_to_dept: "restaurant", resolved_at: iso(days(0)) });
  await ins("guest_requests", { property_id: hot, booking_id: b7, request_type: "other", description: "Airport pickup on arrival", status: "pending", assigned_to_dept: "front_desk" });

  // Check-in / check-out sessions
    await ins("checkin_sessions", { property_id: hot, booking_id: b4, guest_id: guests[2], session_token: crypto.randomBytes(16).toString("hex"), status: "completed", id_type: "PASSPORT", id_number: "P124578", id_verified: true, payment_method: "card", payment_status: "captured", payment_amount: 11000, digital_key_issued: true, opened_at: iso(days(0)), completed_at: iso(days(0)), expires_at: iso(days(4)) });
  await ins("checkin_sessions", { property_id: ser, booking_id: b6, guest_id: guests[5], session_token: crypto.randomBytes(16).toString("hex"), status: "completed", id_type: "PASSPORT", id_number: "P889900", id_verified: true, payment_method: "upi", payment_status: "captured", payment_amount: 30000, digital_key_issued: true, opened_at: iso(days(0)), completed_at: iso(days(0)), expires_at: iso(days(6)) });
  await ins("checkin_sessions", { property_id: hot, booking_id: b1, guest_id: guests[0], session_token: crypto.randomBytes(16).toString("hex"), status: "completed", id_type: "AADHAAR", id_number: "8899 8877 6655", id_verified: true, payment_method: "card", payment_status: "captured", payment_amount: 16500, opened_at: iso(days(-14)), completed_at: iso(days(-14)), expires_at: iso(days(-11)) });
  await ins("checkout_sessions", { property_id: hot, booking_id: b1, checkin_session_id: null, session_token: crypto.randomBytes(16).toString("hex"), status: "completed", total_charges: 16500, total_payments: 16500, balance_due: 0, payment_method: "card", payment_status: "settled", payment_amount: 0, satisfaction_rating: 5, feedback_text: "Wonderful stay!", opened_at: iso(days(-11)), completed_at: iso(days(-11)), expires_at: iso(days(-11)) });
  await ins("checkout_sessions", { property_id: hot, booking_id: b2, checkin_session_id: null, session_token: crypto.randomBytes(16).toString("hex"), status: "completed", total_charges: 11000, total_payments: 11000, balance_due: 0, payment_method: "card", payment_status: "settled", payment_amount: 0, satisfaction_rating: 4, feedback_text: "Good breakfast", opened_at: iso(days(-8)), completed_at: iso(days(-8)), expires_at: iso(days(-8)) });
  await ins("checkin_checklists", { booking_id: b4, checklist_items: JSON.stringify([{ item: "Photo ID verified", done: true }, { item: "Payment collected", done: true }, { item: "Key issued", done: true }, { item: "Welcome kit", done: true }]), verified_by: null, verified_at: iso(days(0)) });

  // Invoices + payments for checked-out/current bookings
  async function makeInvoice(pid, bookingId, guestId, status, amount, paid, invDate, dueOffset) {
    const id = uid();
    await ins("invoices", { id, property_id: pid, booking_id: bookingId, guest_id: guestId, invoice_number: "INV-" + Math.floor(1000 + Math.random() * 9000), invoice_date: dateOnly(new Date(invDate)), due_date: daysStr(dueOffset), status, subtotal: Math.round(amount / 1.18), tax_total: Math.round(amount - amount / 1.18), grand_total: amount, balance_due: amount - paid, paid_total: paid, currency: "INR" });
    await ins("invoice_lines", { invoice_id: id, description: "Room charges", quantity: 1, unit_price: amount, tax_rate: 18, line_total: amount });
    if (paid > 0) await ins("payments", { invoice_id: id, booking_id: bookingId, property_id: pid, payment_method: "card", amount: paid, currency: "INR", payment_date: iso(new Date(invDate)), status: "completed", reconciliation_status: "unmatched" });
  }
  await makeInvoice(hot, b1, guests[0], "paid", 16500, 16500, days(-14), -11);
  await makeInvoice(hot, b2, guests[1], "paid", 11000, 11000, days(-10), -8);
  await makeInvoice(ser, b3, guests[4], "paid", 32500, 32500, days(-7), -2);
  await makeInvoice(hot, b4, guests[2], "sent", 22000, 11000, days(0), 4);
  await makeInvoice(ser, b6, guests[5], "sent", 58800, 30000, days(0), 6);

  // Digital keys
  await ins("digital_keys", { property_id: hot, unit_id: hotelUnitIds[3], booking_id: b4, guest_id: guests[2], lock_vendor: "dormakaba", pin_code: "4821", valid_from: iso(days(0)), valid_to: iso(days(4)), status: "active" });

  // ─────────────────────────────────────────────────────────────
  // 7. Housekeeping + Laundry + Linen
  // ─────────────────────────────────────────────────────────────
  const hkUsers = await c.query(`SELECT u.id, u.email FROM users u WHERE u.email IN ('housekeeping@ehms.demo','superadmin@ehms.demo')`);
  const hkUserId = hkUsers.rows.find(r => r.email === "housekeeping@ehms.demo")?.id || hkUsers.rows[0]?.id;
  for (let i = 0; i < hotelUnitIds.length; i++) {
    const dirty = i % 3 === 0;
    const status = dirty ? "open" : "in_progress";
    const tid = uid();
    await ins("housekeeping_tasks", { id: tid, unit_id: hotelUnitIds[i], property_id: hot, assigned_to: hkUserId, assigned_by: hkUserId, task_type: "deep_clean", priority: i % 2 === 0 ? "high" : "medium", status, scheduled_at: iso(days(0)), started_at: dirty ? null : iso(days(0)), notes: dirty ? "Vacated - deep clean" : "Routine cleaning", created_at: iso(days(0)) });
    if (!dirty) {
      await ins("housekeeping_checklists", { task_id: tid, item: "Change bed linen", is_checked: true, checked_at: iso(days(0)), checked_by: hkUserId });
      await ins("housekeeping_checklists", { task_id: tid, item: "Restock amenities", is_checked: true, checked_at: iso(days(0)), checked_by: hkUserId });
      await ins("housekeeping_checklists", { task_id: tid, item: "Vacuum floor", is_checked: true, checked_at: iso(days(0)), checked_by: hkUserId });
    }
  }
  await ins("housekeeping_inspections", { unit_id: hotelUnitIds[0], inspector_id: hkUserId, score: 98, status: "passed", notes: "All good", checklist_items: JSON.stringify([{ item: "Linen", ok: true }, { item: "Bathroom", ok: true }]), inspected_at: iso(days(-1)) });

  const laundryPrice = [
    ["Shirt", "garment", "wash_iron", 80], ["Trouser", "garment", "wash_iron", 90], ["Suit (2pc)", "garment", "dry_clean", 300], ["Bed sheet", "linen", "launder", 60], ["Towel", "linen", "launder", 30],
  ];
  for (const [name, cat, wash, price] of laundryPrice) await ins("laundry_price_list", { property_id: hot, item_name: name, item_category: cat, wash_type: wash, price, currency: "INR", is_active: true });
  const lo1 = uid();
  await ins("laundry_orders", { id: lo1, property_id: hot, booking_id: b4, guest_id: guests[2], unit_id: hotelUnitIds[3], order_number: "LN-" + Math.floor(1000 + Math.random() * 9000), status: "in_progress", total_amount: 250, is_complimentary: false, estimated_delivery: iso(days(1)), created_at: iso(days(0)), updated_at: iso(days(0)) });
  await ins("laundry_order_items", { order_id: lo1, item_name: "Shirt", item_type: "garment", quantity: 2, unit_price: 80, line_total: 160, wash_type: "regular", status: "in_progress" });
  await ins("laundry_order_items", { order_id: lo1, item_name: "Trouser", item_type: "garment", quantity: 1, unit_price: 90, line_total: 90, wash_type: "regular", status: "in_progress" });
  const lb1 = uid();
  await ins("linen_batches", { id: lb1, batch_id: "LNB-001", property_id: hot, item_type: "bed_sheet", quantity: 120, lifecycle_stage: "in_house", last_updated: iso(days(0)), created_at: iso(days(0)) });
  await ins("linen_items", { property_id: hot, batch_id: lb1, rfid_tag: "RFID-" + Math.floor(1000 + Math.random() * 9000), item_type: "bed_sheet", status: "in_use", last_cleaned: iso(days(-1)), lifecycle_count: 12 });
  await ins("linen_transactions", { batch_id: lb1, from_stage: "washed", to_stage: "in_house", quantity: 120, logged_by: hkUserId, created_at: iso(days(0)) });
  console.log("✔ housekeeping/laundry/linen");

  // ─────────────────────────────────────────────────────────────
  // 8. Maintenance + Assets + AMC
  // ─────────────────────────────────────────────────────────────
  const maintUserId = (await c.query(`SELECT id FROM users WHERE email='maintenance@ehms.demo'`)).rows[0]?.id;
  const asset1 = uid(), asset2 = uid();
  await ins("asset_register", { id: asset1, property_id: hot, asset_type: "AC Split Unit", brand: "Daikin", model: "FTKF35", serial_number: "AC-1001", purchase_date: daysStr(-400), warranty_months: 24, warranty_expiry: daysStr(-40), depreciation_method: "straight_line", depreciation_rate: 10, current_value: 32000, status: "in_service" });
  await ins("asset_register", { id: asset2, property_id: hot, asset_type: "Elevator", brand: "Otis", model: "Gen2", serial_number: "ELV-01", purchase_date: daysStr(-730), warranty_months: 36, warranty_expiry: daysStr(-10), depreciation_method: "straight_line", depreciation_rate: 8, current_value: 1250000, status: "in_service" });
  await ins("asset_register", { property_id: ser, asset_type: "Water Heater", brand: "AO Smith", model: "HSE-VAS", serial_number: "WH-2001", purchase_date: daysStr(-300), warranty_months: 12, warranty_expiry: daysStr(65), depreciation_method: "straight_line", depreciation_rate: 12, current_value: 8500, status: "in_service" });
  await ins("preventive_schedules", { property_id: hot, asset_type: "AC Split Unit", frequency_days: 90, task_template: "Clean filters, check gas pressure, test cooling", last_run: daysStr(-30), next_due: iso(days(60)), is_active: true });
  await ins("preventive_schedules", { property_id: hot, asset_type: "Elevator", frequency_days: 30, task_template: "Monthly elevator maintenance check", last_run: daysStr(-5), next_due: iso(days(25)), is_active: true });

  const vendors = [];
  const vendorList = [
    ["HVAC Masters Pvt Ltd", "Rajesh Kumar", "sales@hvacmasters.in", "+91-90000-11111", "33AACFH1234M1Z5", "AC repair & maintenance", 800, "per_visit"],
    ["PlumbCare Services", "Suresh", "support@plumbcare.in", "+91-90000-22222", "33ABCPL5678N1Z6", "Plumbing & drainage", 500, "per_visit"],
    ["Elevator Solutions", "Karthik", "service@elevatorsolutions.in", "+91-90000-33333", "33AAEES9012P1Z7", "Elevator AMC & repair", 5000, "per_month"],
    ["FreshMart Suppliers", "Mohan", "orders@freshmart.in", "+91-90000-44444", "33AAFFM3456Q1Z8", "Provisions & housekeeping supplies", 12000, "per_month"],
    ["CleanCo Laundry", "Devi", "b2b@cleancolaundry.in", "+91-90000-55555", "33AACCL7890R1Z9", "Outsourced linen laundry", 15000, "per_month"],
    ["SafeTech Security", "Imran", "ops@safetech.in", "+91-90000-66666", "33AASST2345S1Z0", "Security & CCTV maintenance", 3000, "per_month"],
  ];
  for (const [company, contact, email, phone, gst, svc, rate, unit] of vendorList) {
    const vid = uid();
    vendors.push(vid);
    await ins("vendors", { id: vid, property_id: hot, company_name: company, contact_person: contact, email, phone, tax_id: gst, gst_number: gst, is_compliant: true, status: "active" });
    await ins("vendor_services", { vendor_id: vid, service_type: svc, description: svc, rate, rate_unit: unit, is_active: true });
  }

  const mt1 = uid(), mt2 = uid(), mt3 = uid(), mt4 = uid();
  const mTickets = [
    [mt1, hot, hotelUnitIds[0], asset1, "MNT-1001", "reactive", "HVAC", "AC not cooling in room 101", "medium", "open"],
    [mt2, hot, hotelUnitIds[1], asset1, "MNT-1002", "reactive", "Plumbing", "Basin tap leaking", "high", "assigned"],
    [mt3, hot, null, asset2, "MNT-1003", "preventive", "Elevator", "Elevator annual inspection due", "low", "in_progress"],
    [mt4, ser, saUnitIds[0], null, "MNT-1004", "reactive", "Electrical", "Geyser tripping", "critical", "resolved"],
  ];
  for (const [id, pid, unitId, assetId, num, type, cat, title, prio, status] of mTickets) {
    await ins("maintenance_tickets", { id, property_id: pid, unit_id: unitId, asset_id: assetId, ticket_number: num, ticket_type: type, category: cat, title, description: title, priority: prio, status, reported_by: hkUserId, assigned_to: maintUserId, vendor_id: vendors[status === "resolved" ? 0 : status === "in_progress" ? 2 : 1], cost_parts: status === "resolved" ? 450 : 0, cost_labor: status === "resolved" ? 600 : 0, total_cost: status === "resolved" ? 1050 : 0, resolved_at: status === "resolved" ? iso(days(-3)) : null, resolution_notes: status === "resolved" ? "Replaced heating element" : null, created_at: iso(status === "resolved" ? days(-6) : days(-2)) });
    await ins("maintenance_ticket_parts", { ticket_id: id, part_name: "Heating element", quantity: 1, unit_price: 450, total_price: 450 });
    if (status !== "open") await ins("maintenance_time_entries", { ticket_id: id, technician_id: maintUserId, start_time: iso(days(-3)), end_time: iso(days(-3)), duration_minutes: 90, notes: "On-site work" });
    await ins("maintenance_approvals", { ticket_id: id, action: "quote_approved", performed_by: maintUserId, comment: "Approved within budget" });
  }
  await ins("amc_contracts", { property_id: hot, vendor_id: vendors[2], contract_name: "Elevator AMC", contract_ref: "AMC-ELV-01", start_date: daysStr(-300), end_date: daysStr(65), coverage: JSON.stringify({ scope: ["inspection", "breakdown"] }), value: 60000, status: "active" });
  await ins("parts_inventory", { property_id: hot, part_name: "Compressor 1.5T", part_code: "AC-COMP-15", quantity_in_stock: 4, reorder_level: 2, unit_price: 8500, vendor_id: vendors[0] });
  await ins("parts_inventory", { property_id: hot, part_name: "Heating element", part_code: "GYS-HEAT-01", quantity_in_stock: 12, reorder_level: 6, unit_price: 450, vendor_id: vendors[1] });
  console.log("✔ vendors/maintenance");

  // ─────────────────────────────────────────────────────────────
  // 9. Procurement + Inventory
  // ─────────────────────────────────────────────────────────────
  const po1 = uid();
  await ins("purchase_orders", { id: po1, property_id: hot, vendor_id: vendors[3], po_number: "PO-1001", po_date: daysStr(-5), status: "approved", total_amount: 36000, notes: "Monthly provisions", created_by: hkUserId, approved_by: hkUserId, created_at: iso(days(-5)) });
  const pol1 = uid();
  await ins("purchase_order_lines", { id: pol1, po_id: po1, item_description: "Bathroom amenities kit", quantity: 100, unit_price: 120, line_total: 12000, received_qty: 100 });
  const pol2 = uid();
  await ins("purchase_order_lines", { id: pol2, po_id: po1, item_description: "Laundry detergent 5L", quantity: 40, unit_price: 350, line_total: 14000, received_qty: 40 });
  const grn1 = uid();
  await ins("goods_received_notes", { id: grn1, po_id: po1, grn_number: "GRN-1001", received_date: daysStr(-3), received_by: hkUserId, notes: "All items received in good condition", created_at: iso(days(-3)), property_id: hot });
  await ins("grn_lines", { grn_id: grn1, po_line_id: pol1, received_qty: 100, accepted_qty: 100, rejected_qty: 0 });
  await ins("grn_lines", { grn_id: grn1, po_line_id: pol2, received_qty: 40, accepted_qty: 40, rejected_qty: 0 });

  const wh1 = uid(), wh2 = uid();
  await ins("warehouses", { id: wh1, name: "Main Store", code: "MS", location: "Ground floor", manager_name: "Mohan", phone: "+91-90000-44444", property_id: hot, is_active: true });
  await ins("warehouses", { id: wh2, name: "Linen Store", code: "LS", location: "1st floor", manager_name: "Devi", phone: "+91-90000-55555", property_id: hot, is_active: true });
  const ic1 = uid(), ic2 = uid(), ic3 = uid();
  await ins("inventory_categories", { id: ic1, name: "Bathroom Amenities", property_id: hot, is_active: true });
  await ins("inventory_categories", { id: ic2, name: "Cleaning Supplies", property_id: hot, is_active: true });
  await ins("inventory_categories", { id: ic3, name: "Kitchen Provisions", property_id: hot, is_active: true });
  const items = [
    [ic1, "Shampoo Sachet", "AMN-SHP", "pcs", 500, 2, 8, wh1],
    [ic1, "Soap Bar", "AMN-SOP", "pcs", 800, 3, 6, wh1],
    [ic2, "Floor Cleaner 5L", "CLN-FLR", "bottle", 60, 5, 200, wh1],
    [ic2, "Dusting Cloth", "CLN-DST", "pcs", 200, 10, 25, wh1],
    [ic3, "Mineral Water 1L", "KIT-WTR", "case", 120, 10, 180, wh1],
  ];
  for (const [cat, name, sku, unit, qty, reorder, cost, wh] of items) {
    const iid = uid();
    await ins("inventory_items", { id: iid, category_id: cat, name, sku, unit, quantity_on_hand: qty, quantity_reserved: 0, reorder_level: reorder, reorder_quantity: qty, unit_cost: cost, total_value: qty * cost, warehouse_id: wh, property_id: hot, is_active: true });
    await ins("inventory_transactions", { item_id: iid, transaction_type: "purchase_receipt", quantity: qty, unit_cost: cost, reference_type: "grn", reference_id: grn1, warehouse_id: wh, property_id: hot, created_by: hkUserId, created_at: iso(days(-3)) });
  }
  await ins("material_types", { name: "Cleaning", code: "CLN", description: "Cleaning materials" });
  await ins("materials", { name: "Microfiber cloth", code: "MFB", unit_of_measure: "pcs", reorder_level: 20, is_active: true });
  console.log("✔ procurement/inventory");

  // ─────────────────────────────────────────────────────────────
  // 10. HR — departments, designations, bands, employees, payroll
  // ─────────────────────────────────────────────────────────────
  const deptList = ["Front Office", "Housekeeping", "Engineering & Maintenance", "Food & Beverage", "Human Resources", "Finance & Accounts", "Security"];
  const deptIds = {};
  for (const name of deptList) {
    const id = uid(); deptIds[name] = id;
    await ins("departments", { id, property_id: hot, name, code: name.slice(0, 4).toUpperCase() });
  }
  const desigs = [["Front Office", "Front Desk Agent"], ["Front Office", "Front Desk Supervisor"], ["Front Office", "Guest Relations Executive"], ["Housekeeping", "Housekeeping Staff"], ["Housekeeping", "Housekeeping Supervisor"], ["Engineering & Maintenance", "Maintenance Technician"], ["Engineering & Maintenance", "Chief Engineer"], ["Food & Beverage", "Chef"], ["Food & Beverage", "Restaurant Server"], ["Human Resources", "HR Manager"], ["Finance & Accounts", "Finance Manager"], ["Finance & Accounts", "Accountant"]];
  for (const [dept, name] of desigs) await ins("designations", { name, code: name.replace(/\s/g, "_").toUpperCase(), department_id: deptIds[dept], level: name.includes("Manager") || name.includes("Supervisor") || name.includes("Chief") ? 3 : name.includes("Executive") ? 2 : 1, is_active: true });

  const band1 = uid(), band2 = uid(), band3 = uid();
  await ins("employee_bands", { id: band1, name: "Band A", code: "A", description: "Entry" });
  await ins("employee_bands", { id: band2, name: "Band B", code: "B", description: "Mid" });
  await ins("employee_bands", { id: band3, name: "Band C", code: "C", description: "Senior" });
  await ins("salary_structures", { band_id: band1, name: "Entry Level", base_percentage: 60, hra_percentage: 30, pf_applicable: true, is_active: true });
  await ins("salary_structures", { band_id: band2, name: "Mid Level", base_percentage: 65, hra_percentage: 25, pf_applicable: true, is_active: true });
  await ins("salary_structures", { band_id: band3, name: "Senior Level", base_percentage: 70, hra_percentage: 20, pf_applicable: true, is_active: true });

  const shift1 = uid(), shift2 = uid(), shift3 = uid();
  await ins("shift_rotations", { id: shift1, property_id: hot, name: "Morning", start_time: "07:00", end_time: "15:00" });
  await ins("shift_rotations", { id: shift2, property_id: hot, name: "Afternoon", start_time: "15:00", end_time: "23:00" });
  await ins("shift_rotations", { id: shift3, property_id: hot, name: "Night", start_time: "23:00", end_time: "07:00" });
  await ins("attendance_policies", { property_id: hot, name: "Standard Policy", late_threshold: 15, half_day_threshold: 120, early_exit_threshold: 15, grace_period: 5, requires_geo: true, requires_face_auth: false, is_active: true });
  await ins("overtime_policies", { property_id: hot, name: "Standard OT", multiplier: 1.5, min_hours: 1, max_hours_per_day: 4, applicable_shifts: "night", is_active: true });

  const empMap = {};
  const empList = [
    ["frontdesk@ehms.demo", "FD-001", "Front Office", "Front Desk Agent", 18000, shift1, band1],
    ["housekeeping@ehms.demo", "HK-001", "Housekeeping", "Housekeeping Staff", 15000, shift2, band1],
    ["maintenance@ehms.demo", "MT-001", "Engineering & Maintenance", "Maintenance Technician", 20000, shift1, band2],
    ["hr@ehms.demo", "HR-001", "Human Resources", "HR Manager", 55000, shift1, band3],
    ["finance@ehms.demo", "FN-001", "Finance & Accounts", "Finance Manager", 60000, shift1, band3],
    ["executive@ehms.demo", "EX-001", "Front Office", "Guest Relations Executive", 32000, shift1, band2],
    ["admin@ehms.demo", "PM-001", "Front Office", "Front Desk Supervisor", 35000, shift2, band2],
    ["superadmin@ehms.demo", "GM-001", "Front Office", "Front Desk Agent", 20000, shift1, band2],
  ];
  for (const [email, code, dept, desig, salary, shift, band] of empList) {
    const u = await c.query(`SELECT id FROM users WHERE email=$1`, [email]);
    if (!u.rows[0]) continue;
    const id = uid();
    empMap[email] = id;
    await ins("employees", { id, user_id: u.rows[0].id, employee_code: code, department_id: deptIds[dept], designation: desig, employment_type: "full_time", doj: daysStr(-400), base_salary: salary, bank_account: "1234567890", bank_ifsc: "HDFC0001234", pan_number: "ABCDE1234F", is_active: true, shift_id: shift, band_id: band, property_id: hot });
  }
  // Attendance + leaves + timesheets for a couple employees
  for (const [email, daysBack] of [["frontdesk@ehms.demo", 14], ["housekeeping@ehms.demo", 14], ["maintenance@ehms.demo", 14]]) {
    const empId = empMap[email];
    if (!empId) continue;
    for (let d = daysBack; d >= 1; d--) {
      if (new Date(days(d)).getDay() === 0) continue;
      await ins("attendance_records", { employee_id: empId, property_id: hot, clock_in: iso(new Date(days(d).getTime() + 8.7 * 3600000)), clock_out: iso(new Date(days(d).getTime() + 17.3 * 3600000)), is_geofenced: true, status: "present", created_at: iso(days(d)) });
    }
  }
  const leaveTypeIds = await c.query(`SELECT id, name FROM leave_types`);
  const ltCasual = leaveTypeIds.rows.find(r => r.name.toLowerCase().includes("casual") || r.name.toLowerCase().includes("leave"));
  if (ltCasual) {
    await ins("leave_balances", { employee_id: empMap["frontdesk@ehms.demo"], leave_type_id: ltCasual.id, total_allocated: 12, used: 3, pending: 1, remaining: 8, period_year: 2026 });
    await ins("leave_requests", { employee_id: empMap["frontdesk@ehms.demo"], leave_type_id: ltCasual.id, start_date: daysStr(10), end_date: daysStr(11), total_days: 2, reason: "Family function", status: "pending", created_at: iso(days(-1)) });
  }
  await ins("holiday_calendar", { property_id: hot, name: "Independence Day", date: daysStr(1), type: "public", applicable_to: "all", is_active: true });
  await ins("timesheets", { employee_id: empMap["maintenance@ehms.demo"], date: daysStr(-2), clock_in: iso(days(-2)), clock_out: iso(days(-2)), total_hours: 8, break_hours: 1, net_hours: 7, task: "Preventive maintenance rounds", status: "approved", approved_by: empMap["superadmin@ehms.demo"], approved_at: iso(days(-1)) });

  const pr1 = uid();
  await ins("payroll_runs", { id: pr1, property_id: hot, period_start: daysStr(-30), period_end: daysStr(-1), run_date: daysStr(1), status: "processed", total_gross: 235000, total_deductions: 29400, total_net: 205600, processed_by: empMap["finance@ehms.demo"], approved_by: empMap["superadmin@ehms.demo"], created_at: iso(days(-1)) });
  for (const [email, gross] of [["frontdesk@ehms.demo", 18000], ["housekeeping@ehms.demo", 15000], ["maintenance@ehms.demo", 20000], ["hr@ehms.demo", 55000], ["finance@ehms.demo", 60000], ["executive@ehms.demo", 32000]]) {
    if (!empMap[email]) continue;
    await ins("payroll_lines", { payroll_id: pr1, employee_id: empMap[email], gross_pay: gross, pf_deduction: Math.round(gross * 0.12), esi_deduction: Math.round(gross * 0.0075), pt_deduction: gross > 20000 ? 200 : 0, tds_deduction: gross > 50000 ? Math.round(gross * 0.1) : 0, net_pay: Math.round(gross * 0.85) });
  }
  await ins("policy_documents", { property_id: hot, category: "HR", title: "Employee Handbook", description: "General policies", department: "Human Resources", file_name: "handbook.pdf", file_type: "application/pdf", file_size: 1024, effective_date: daysStr(-200), version: "2.1", uploaded_by: empMap["hr@ehms.demo"], is_active: true });
  await ins("compliance_records", { property_id: hot, certificate_type: "Fire Safety", reference_number: "FS-2026-045", issued_date: daysStr(-60), expiry_date: daysStr(305), status: "valid" });
  await ins("compliance_records", { property_id: hot, certificate_type: "FSSAI License", reference_number: "FSS-114455", issued_date: daysStr(-90), expiry_date: daysStr(275), status: "valid" });
  const ac1 = uid();
  await ins("appraisal_cycles", { id: ac1, property_id: hot, name: "FY 2026 Mid-Year", cycle_type: "mid_year", period_start: daysStr(-120), period_end: daysStr(60), rating_scale: 5, status: "open", created_by: empMap["hr@ehms.demo"] });
  console.log("✔ HR module");

  // ─────────────────────────────────────────────────────────────
  // 11. Finance — accounts, journal, bills, budget, assets, tax
  // ─────────────────────────────────────────────────────────────
  const fy1 = uid(), fy2 = uid();
  await ins("fiscal_years", { id: fy1, property_id: hot, name: "FY 2025-26", start_date: "2025-04-01", end_date: "2026-03-31", is_closed: true, closed_at: iso(days(-140)) });
  await ins("fiscal_years", { id: fy2, property_id: hot, name: "FY 2026-27", start_date: "2026-04-01", end_date: "2027-03-31", is_closed: false });
  const cc1 = uid(), cc2 = uid();
  await ins("cost_centers", { id: cc1, property_id: hot, code: "CC-FO", name: "Front Office" });
  await ins("cost_centers", { id: cc2, property_id: hot, code: "CC-HK", name: "Housekeeping" });

  const accounts = [
    ["1000", "Cash", "asset"], ["1100", "Bank - HDFC", "asset"], ["1200", "Accounts Receivable", "asset"], ["1300", "Prepaid Expenses", "asset"], ["1400", "Inventory - Store", "asset"],
    ["2000", "Accounts Payable", "liability"], ["2100", "GST Payable", "liability"], ["2200", "Salary Payable", "liability"],
    ["3000", "Owner's Equity", "equity"], ["3100", "Retained Earnings", "equity"],
    ["4000", "Room Revenue", "revenue"], ["4100", "F&B Revenue", "revenue"], ["4200", "Other Income", "revenue"],
    ["5000", "Housekeeping Expense", "expense"], ["5100", "Maintenance Expense", "expense"], ["5200", "Salaries & Wages", "expense"], ["5300", "Utilities", "expense"], ["5400", "Depreciation", "expense"],
  ];
  const acctIds = {};
  for (const [code, name, type] of accounts) {
    const id = uid(); acctIds[code] = id;
    await ins("chart_of_accounts", { id, property_id: hot, account_code: code, account_name: name, account_type: type, is_system: false, is_active: true, opening_balance: 0 });
  }

  const je1 = uid();
  await ins("journal_entries", { id: je1, property_id: hot, entry_date: daysStr(-20), reference_type: "opening", description: "Opening entry FY 2026-27", created_by: empMap["finance@ehms.demo"], posted_at: iso(days(-20)), is_posted: true, fiscal_period_id: fy2, journal_type: "opening" });
  await ins("journal_lines", { journal_id: je1, account_id: acctIds["1000"], debit: 250000, credit: 0, description: "Opening cash" });
  await ins("journal_lines", { journal_id: je1, account_id: acctIds["3000"], debit: 0, credit: 250000, description: "Opening equity" });
  const je2 = uid();
  await ins("journal_entries", { id: je2, property_id: hot, entry_date: daysStr(-3), reference_type: "revenue", description: "Room revenue accrual (front desk)", created_by: empMap["finance@ehms.demo"], posted_at: iso(days(-3)), is_posted: true, fiscal_period_id: fy2, journal_type: "revenue" });
  await ins("journal_lines", { journal_id: je2, account_id: acctIds["1200"], debit: 22000, credit: 0, description: "Debtor" });
  await ins("journal_lines", { journal_id: je2, account_id: acctIds["4000"], debit: 0, credit: 22000, description: "Room revenue" });

  const vb1 = uid();
  await ins("vendor_bills", { id: vb1, property_id: hot, vendor_id: vendors[0], bill_number: "VBL-2201", bill_date: daysStr(-4), due_date: daysStr(26), category: "AC Maintenance", subtotal: 4000, tax_total: 720, grand_total: 4720, paid_total: 0, balance_due: 4720, status: "unpaid", created_by: empMap["finance@ehms.demo"] });
  await ins("bill_line_items", { bill_id: vb1, description: "AC service visit", quantity: 1, unit_price: 4000, tax_rate: 18, line_total: 4000, account_id: acctIds["5100"], cost_center_id: cc2 });
  const vb2 = uid();
  await ins("vendor_bills", { id: vb2, property_id: hot, vendor_id: vendors[3], bill_number: "VBL-2198", bill_date: daysStr(-10), due_date: daysStr(20), category: "Provisions", subtotal: 12000, tax_total: 2160, grand_total: 14160, paid_total: 14160, balance_due: 0, status: "paid", created_by: empMap["finance@ehms.demo"] });
  await ins("bill_line_items", { bill_id: vb2, description: "Monthly provisions", quantity: 1, unit_price: 12000, tax_rate: 18, line_total: 12000, account_id: acctIds["5300"], cost_center_id: cc1 });
  await ins("bill_payments", { property_id: hot, bill_id: vb2, payment_method: "bank_transfer", reference_number: "TR-8877", amount: 14160, payment_date: iso(days(-8)), status: "completed", created_by: empMap["finance@ehms.demo"] });

  const bh1 = uid(), bh2 = uid();
  await ins("budget_heads", { id: bh1, property_id: hot, code: "BH-HK", name: "Housekeeping Budget", account_id: acctIds["5000"], is_active: true });
  await ins("budget_heads", { id: bh2, property_id: hot, code: "BH-MT", name: "Maintenance Budget", account_id: acctIds["5100"], is_active: true });
  await ins("budget_entries", { budget_head_id: bh1, fiscal_year_id: fy2, period_month: 4, budget_amount: 50000, actual_amount: 32000 });
  await ins("budget_entries", { budget_head_id: bh1, fiscal_year_id: fy2, period_month: 5, budget_amount: 50000, actual_amount: 41500 });
  await ins("budget_entries", { budget_head_id: bh2, fiscal_year_id: fy2, period_month: 4, budget_amount: 80000, actual_amount: 54000 });

  const fa1 = uid();
  await ins("fixed_assets", { id: fa1, property_id: hot, asset_code: "FA-AC-001", asset_name: "AC Split Unit x20", category: "HVAC", purchase_date: daysStr(-400), purchase_cost: 640000, salvage_value: 32000, useful_life_yrs: 10, depreciation_method: "straight_line", accumulated_dep: 64000, book_value: 576000, status: "in_use", location: "Main Tower", account_id: acctIds["5400"] });
  await ins("depreciation_schedule", { asset_id: fa1, period_date: daysStr(0), amount: 5333, is_posted: true, journal_id: je1 });

  await ins("tax_filings", { property_id: hot, tax_type: "GST", return_type: "GSTR-1", period_start: "2026-06-01", period_end: "2026-06-30", due_date: daysStr(7), total_liability: 118000, total_paid: 0, status: "pending", filed_by: empMap["finance@ehms.demo"] });
  await ins("tax_filings", { property_id: hot, tax_type: "TDS", return_type: "TDS Return Q1", period_start: "2026-04-01", period_end: "2026-06-30", due_date: daysStr(0), total_liability: 24000, total_paid: 24000, filing_date: daysStr(-2), status: "filed", filed_by: empMap["finance@ehms.demo"] });
  await ins("bank_reconciliation", { property_id: hot, bank_ref: "BR-001", transaction_date: daysStr(-2), amount: 16500, description: "Booking.com payout", matched_payment_id: null, status: "unmatched", created_at: iso(days(-2)) });
  await ins("bank_reconciliation", { property_id: hot, bank_ref: "BR-002", transaction_date: daysStr(-1), amount: 30000, description: "UPI payment - SA booking", matched_payment_id: null, status: "unmatched", created_at: iso(days(-1)) });
  console.log("✔ finance module");

  // ─────────────────────────────────────────────────────────────
  // 12. F&B / Restaurant
  // ─────────────────────────────────────────────────────────────
  const rs1 = uid();
  await ins("restaurant_sections", { id: rs1, property_id: hot, name: "Main Dining", sort_order: 1, is_active: true });
  const rs2 = uid();
  await ins("restaurant_sections", { id: rs2, property_id: hot, name: "Terrace", sort_order: 2, is_active: true });
  const rTables = [];
  for (let i = 1; i <= 6; i++) {
    const id = uid(); rTables.push(id);
    await ins("restaurant_tables", { id, property_id: hot, section_id: i <= 4 ? rs1 : rs2, table_number: "T" + i, capacity: i <= 2 ? 2 : 4, status: i === 1 ? "occupied" : "available", pos_x: i * 10, pos_y: 20, shape: "round" });
  }
  await ins("kds_stations", { property_id: hot, name: "Kitchen 1", station_type: "main", is_active: true, display_order: 1 });
  await ins("kds_stations", { property_id: hot, name: "Bar", station_type: "bar", is_active: true, display_order: 2 });
  const menuItems = [];
  const menuSeed = [
    ["Continental Breakfast", "Breakfast", 350, "Eggs, toast, juice", true],
    ["South Indian Platter", "Breakfast", 280, "Idli, dosa, chutney", true],
    ["Veg Spring Rolls (6 pcs)", "Appetizers", 280, "Crispy veg rolls", true],
    ["Paneer Tikka", "Appetizers", 320, "Char-grilled paneer", true],
    ["Grilled Chicken Burger", "Mains", 450, "With fries", true],
    ["Margherita Pizza", "Mains", 420, "Classic cheese pizza", true],
    ["Chocolate Brownie", "Desserts", 220, "Served with ice cream", true],
  ];
  for (const [item_name, category, price, description, is_veg] of menuSeed) {
    const mid = uid();
    menuItems.push(mid);
    await ins("f_and_b_menu", { id: mid, property_id: hot, category, item_name, description, price, currency: "INR", is_available: true, is_veg, prep_time_mins: 15 });
  }
  const fo1 = uid();
  await ins("f_and_b_orders", { id: fo1, property_id: hot, booking_id: b4, unit_id: hotelUnitIds[3], order_type: "room_service", status: "delivered", total_amount: 1450, is_complimentary: false, ordered_at: iso(days(0)), delivered_at: iso(days(0)) });
  if (menuItems.length >= 2) {
    await ins("f_and_b_order_items", { order_id: fo1, menu_item_id: menuItems[0], quantity: 2, unit_price: 350, subtotal: 700, item_name: "Continental Breakfast", line_total: 700 });
    await ins("f_and_b_order_items", { order_id: fo1, menu_item_id: menuItems[1], quantity: 1, unit_price: 750, subtotal: 750, item_name: "South Indian Platter", line_total: 750 });
  }
  const fo2 = uid();
  await ins("f_and_b_orders", { id: fo2, property_id: hot, booking_id: b5, unit_id: hotelUnitIds[5], order_type: "restaurant_dine_in", status: "preparing", total_amount: 2860, is_complimentary: false, ordered_at: iso(days(0)) });
  await ins("table_reservations", { property_id: hot, table_id: rTables[0], booking_id: b4, guest_name: "David Chen", guest_phone: "+1-415-555-0100", party_size: 2, reservation_time: iso(new Date(days(0).getTime() + 12 * 3600000)), duration_mins: 90, status: "confirmed", created_at: iso(days(-1)) });
  await ins("table_reservations", { property_id: hot, table_id: rTables[4], guest_name: "Sarah Johnson", guest_phone: "+44-20-7946-0958", party_size: 3, reservation_time: iso(new Date(days(1).getTime() + 12 * 3600000)), duration_mins: 120, status: "pending", created_at: iso(days(0)) });
  await ins("split_bills", { property_id: hot, order_id: fo1, split_type: "equal", total_amount: 1450, guest_count: 2, status: "paid", created_at: iso(days(0)) });
  console.log("✔ restaurant module");

  // ─────────────────────────────────────────────────────────────
  // 13. Workplace — membership plans, corporates, bookings
  // ─────────────────────────────────────────────────────────────
  const wpPlanIds = [];
  const wpPlans = [["Hot Desk", "flex", "monthly", 4999, 0], ["Dedicated Desk", "dedicated", "monthly", 8999, 0], ["Private Cabin", "cabin", "monthly", 19999, 0], ["Meeting Room", "conference", "hourly", 999, 0]];
  for (const [name, type, cycle, price, pool] of wpPlans) {
    const id = uid(); wpPlanIds.push(id);
    await ins("membership_plans", { id, property_id: wpk, name, plan_type: type, billing_cycle: cycle, price, seat_pool: pool, amenities: ["wifi", "coffee"], is_active: true });
  }
  const corp1 = uid(), corp2 = uid();
  await ins("corporate_accounts", { id: corp1, name: "Globex Technologies", tax_id: "33AAACG1234F1Z5", spending_limit: 500000, billing_cycle: "monthly", payment_terms: 30, is_active: true });
  await ins("corporate_accounts", { id: corp2, name: "InfoTech Solutions", tax_id: "33AAIIS5678G1Z6", spending_limit: 300000, billing_cycle: "monthly", payment_terms: 15, is_active: true });
  await ins("corporate_memberships", { corporate_id: corp1, plan_id: wpPlanIds[0], start_date: daysStr(-60), end_date: daysStr(305), seat_allocated: 8, seat_used: 4, auto_renew: true, status: "active" });
  await ins("corporate_memberships", { corporate_id: corp2, plan_id: wpPlanIds[1], start_date: daysStr(-30), end_date: daysStr(335), seat_allocated: 4, seat_used: 2, auto_renew: true, status: "active" });
  await ins("corporate_members", { corporate_id: corp1, guest_id: guests[2], designation: "Director", employee_id: "GLX-102", is_approved: true });
  await ins("corporate_members", { corporate_id: corp2, guest_id: guests[6], designation: "Analyst", employee_id: "IT-330", is_approved: true });
  await ins("workplace_bookings", { property_id: wpk, unit_id: deskIds[0], corporate_id: corp1, booking_type: "membership", start_time: iso(days(0)), end_time: iso(new Date(days(0).getTime() + 8 * 3600000)), status: "checked_in", total_amount: 4999, checked_in_at: iso(days(0)) });
  await ins("workplace_bookings", { property_id: wpk, unit_id: deskIds[1], corporate_id: corp1, booking_type: "membership", start_time: iso(days(0)), end_time: iso(new Date(days(0).getTime() + 8 * 3600000)), status: "confirmed", total_amount: 4999 });
  await ins("workplace_bookings", { property_id: wpk, unit_id: meetingIds[0], corporate_id: corp2, booking_type: "meeting_room", start_time: iso(days(1)), end_time: iso(new Date(days(1).getTime() + 2 * 3600000)), status: "confirmed", total_amount: 1998 });
  await ins("membership_invoices", { membership_id: (await c.query(`SELECT id FROM corporate_memberships WHERE corporate_id=$1 LIMIT 1`, [corp1])).rows[0].id, invoice_number: "MS-INV-001", period_start: daysStr(-30), period_end: daysStr(0), base_amount: 4999, overage_amount: 0, total_amount: 4999, status: "paid", due_date: daysStr(-5), paid_at: iso(days(-6)) });
  await ins("parking_allocations", { vehicle_number: "TN 07 AB 1234", slot_number: "P-12", status: "active", allocated_at: iso(days(0)) });
  console.log("✔ workplace module");

  // ─────────────────────────────────────────────────────────────
  // 14. Loyalty, OTA, pricing, misc
  // ─────────────────────────────────────────────────────────────
  const loyTiers = [["Silver", 1, 5000, 5, 1, 1], ["Gold", 5, 25000, 10, 1.5, 2], ["Platinum", 10, 60000, 15, 2, 3], ["Diamond", 25, 150000, 20, 3, 4]];
  for (const [name, stays, spend, disc, mult, order] of loyTiers) await ins("loyalty_tiers", { property_id: hot, name, min_stays: stays, min_spend: spend, discount_pct: disc, points_multiplier: mult, benefits: JSON.stringify({ priority_checkin: true, late_checkout: true }), tier_order: order, is_active: true });
  await ins("loyalty_transactions", { guest_id: guests[0], booking_id: b1, points: 1650, type: "earned", description: "Stay earnings" });
  await ins("loyalty_transactions", { guest_id: guests[2], booking_id: b4, points: 2200, type: "earned", description: "Stay earnings" });
  await ins("loyalty_transactions", { guest_id: guests[3], points: -500, type: "redeemed", description: "Redeemed for spa" });

  const ch1 = uid(), ch2 = uid();
  await ins("ota_channel_config", { id: ch1, property_id: hot, channel_name: "booking.com", api_endpoint: "https://supply.booking.com", property_mapping: JSON.stringify({ room: "NGR-DLX" }), is_active: true });
  await ins("ota_channel_config", { id: ch2, property_id: hot, channel_name: "MakeMyTrip", api_endpoint: "https://connect.makemytrip.com", property_mapping: JSON.stringify({ room: "NGR-DLX" }), is_active: true });
  await ins("ota_rate_mappings", { property_id: hot, channel_id: ch1, unit_type: "room", channel_room_type_code: "DLX-K", channel_room_name: "Deluxe King", rate_multiplier: 1.05, is_active: true });
  await ins("ota_settlements", { property_id: hot, channel_id: ch1, settlement_ref: "STL-001", period_start: daysStr(-30), period_end: daysStr(0), gross_amount: 88000, commission: 15840, net_amount: 72160, booking_count: 5, status: "reconciled", paid_at: iso(days(-2)) });
  await ins("channel_sync_log", { property_id: hot, channel: "booking.com", action: "rate_push", response_status: 200, response_body: "ok", synced_at: iso(days(0)), duration_ms: 450 });

  await ins("visitor_logs", { property_id: hot, host_employee_id: empMap["frontdesk@ehms.demo"], visitor_name: "Naveen Raj", visitor_phone: "+91-90000-77777", purpose: "Business meeting", check_in: iso(days(0)), badge_issued: true });
  await ins("visitor_logs", { property_id: wpk, host_employee_id: empMap["executive@ehms.demo"], visitor_name: "Kavitha", visitor_phone: "+91-90000-88888", purpose: "Interview", check_in: iso(days(-1)), check_out: iso(days(-1)), badge_issued: true });

  await ins("guest_feedback", { property_id: hot, booking_id: b1, department: "front_desk", rating: 5, comments: "Fast check-in", submitted_at: iso(days(-11)) });
  await ins("guest_feedback", { property_id: hot, booking_id: b2, department: "f_and_b", rating: 4, comments: "Great breakfast spread", submitted_at: iso(days(-8)) });
  await ins("guest_communications", { guest_id: guests[2], channel: "email", template: "welcome", sent_at: iso(days(0)), status: "delivered" });
  await ins("guest_timeline", { guest_id: guests[2], event_type: "checked_in", event_data: JSON.stringify({ booking: b4 }), event_at: iso(days(0)) });

  await ins("pricing_rules", { property_id: hot, name: "Last minute +15%", rule_type: "last_minute", conditions: JSON.stringify({ lead_days_lt: 1 }), adjustments: JSON.stringify({ pct: 15 }), priority: 1, is_active: true });
  await ins("pricing_rules", { property_id: hot, name: "Stay 7+ nights -10%", rule_type: "length_of_stay", conditions: JSON.stringify({ nights_ge: 7 }), adjustments: JSON.stringify({ pct: -10 }), priority: 2, is_active: true });
  await ins("pricing_seasons", { property_id: hot, name: "Summer", start_date: "2026-04-01", end_date: "2026-06-30", multiplier: 1.05, color: "#F59E0B", is_active: true });
  await ins("promo_codes", { property_id: hot, code: "NIVESH10", description: "10% off direct", discount_type: "percentage", discount_value: 10, min_nights: 2, used_count: 5, valid_from: "2026-01-01", valid_to: "2026-12-31", is_active: true });
  await ins("promotions", { property_id: hot, name: "Summer Escape", code: "SUMMER26", discount_pct: 12, start_date: "2026-04-01", end_date: "2026-06-30", is_active: false });

  await ins("services", { property_id: hot, name: "Airport Transfer", code: "AIRPORT", price: 1500, is_active: true });
  await ins("services", { property_id: hot, name: "Spa Package", code: "SPA", price: 2500, is_active: true });
  console.log("✔ loyalty/ota/pricing/misc");

  // ─────────────────────────────────────────────────────────────
  // 15. Leases (rental vertical)
  // ─────────────────────────────────────────────────────────────
  const la1 = uid();
  await ins("lease_agreements", { id: la1, property_id: ren, unit_id: renUnitIds[0], tenant_id: guests[1], agreement_ref: "LSE-2026-001", status: "active", start_date: daysStr(-120), end_date: daysStr(245), lock_in_period_months: 11, notice_period_days: 60, rent_amount: 24000, security_deposit: 96000, escalation_percent: 5, escalation_frequency_months: 12, furnishing_inventory: JSON.stringify([{ item: "Sofa", condition: "Good" }, { item: "Wardrobe", condition: "Good" }]), signed_at: iso(days(-121)), signed_by_tenant: true, signed_by_owner: true });
  const la2 = uid();
  await ins("lease_agreements", { id: la2, property_id: ren, unit_id: renUnitIds[2], tenant_id: guests[6], agreement_ref: "LSE-2026-002", status: "drafted", start_date: daysStr(10), end_date: daysStr(375), lock_in_period_months: 11, notice_period_days: 60, rent_amount: 24000, security_deposit: 96000, furnishing_inventory: JSON.stringify([]), signed_by_tenant: false, signed_by_owner: false });
  await ins("deposit_ledger", { lease_id: la1, transaction_type: "deposit", amount: 96000, description: "Security deposit received", transaction_date: iso(days(-120)), created_by: empMap["finance@ehms.demo"] });
  const ri1 = uid();
  await ins("rent_invoices", { id: ri1, lease_id: la1, invoice_number: "RI-2026-001", period_start: daysStr(-30), period_end: daysStr(0), rent_amount: 24000, maintenance_charges: 1000, late_fee: 0, total_amount: 25000, paid_amount: 25000, due_date: daysStr(-2), paid_at: iso(days(-3)), status: "paid" });
  await ins("rent_invoices", { lease_id: la1, invoice_number: "RI-2026-002", period_start: daysStr(0), period_end: daysStr(30), rent_amount: 24000, maintenance_charges: 1000, late_fee: 0, total_amount: 25000, paid_amount: 0, due_date: daysStr(28), status: "sent" });
  await ins("move_out_checklist", { lease_id: la1, item: "Painting", condition: "Good", is_verified: false });
  console.log("✔ rental leases");

  await c.query("COMMIT");
  console.log(`\n✅ SEED COMPLETE — ${inserts} rows inserted into nivesh`);
  console.log("Key counts:");
  for (const [label, t] of [["properties", "properties"], ["units", "units"], ["bookings", "bookings"], ["guests", "guest_profiles"], ["employees", "employees"], ["vendors", "vendors"], ["housekeeping_tasks", "housekeeping_tasks"], ["maintenance_tickets", "maintenance_tickets"], ["journal_entries", "journal_entries"], ["accounts", "chart_of_accounts"], ["lease_agreements", "lease_agreements"], ["workplace_bookings", "workplace_bookings"], ["f_and_b_orders", "f_and_b_orders"]]) {
    console.log(`  ${label.padEnd(20)} ${await cnt(t)}`);
  }
} catch (err) {
  await c.query("ROLLBACK").catch(() => {});
  console.error("❌ Seed failed:", err.message);
  console.error(err.stack?.split("\n").slice(0, 4).join("\n"));
  process.exit(1);
} finally {
  c.release();
  await pool.end();
}
