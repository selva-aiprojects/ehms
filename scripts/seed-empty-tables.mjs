import pg from "pg";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, "../.env.local");
const envContent = readFileSync(ENV_PATH, "utf-8");
const url = envContent.split("\n").find((l) => l.startsWith("DATABASE_URL=")).slice("DATABASE_URL=".length).trim();

const pool = new pg.Pool({ connectionString: url, max: 1 });
const c = await pool.connect();

const TARGETS = [
  "admin_notifications","appraisal_goals","appraisal_reviews","audit_logs","beta_feature_access",
  "beta_testers","booking_engine_config","booking_engine_sessions","central_rate_plans","competitor_rates",
  "cross_property_guests","employee_promotions","feature_changelog","feature_flag_cache","feature_flag_dependencies",
  "feature_flag_metrics","feature_flag_overrides","feature_rollout_plans","hardware_devices","identity_verifications",
  "increments","inventory_calendar","kds_tickets","kiosk_config","lease_amendments","login_attempts",
  "loyalty_redemptions","loyalty_rewards","notification_queue","ota_availability_queue","ota_booking_queue",
  "ota_commission_rates","ota_rate_queue","payment_gateway_config","payment_gateway_transactions","pricing_audit_log",
  "promotions_offers","property_daily_snapshots","push_subscriptions","refund_transactions","revenue_ai_audit",
  "revenue_ai_rules","split_bill_items","system_backups","user_sessions","whatsapp_campaigns","whatsapp_config",
  "whatsapp_conversations","whatsapp_messages","whatsapp_templates",
];

async function ins(tbl, rows) {
  if (!rows.length) return 0;
  const cols = Object.keys(rows[0]);
  const params = [];
  const values = [];
  for (const r of rows) {
    const rowParams = [];
    for (const k of cols) {
      const v = r[k] ?? null;
      rowParams.push(v !== null && typeof v === "object" && !(v instanceof Date) && !Buffer.isBuffer(v) ? JSON.stringify(v) : v);
    }
    const placeholders = cols.map((_, i) => `$${params.length + i + 1}`).join(",");
    values.push(`(${placeholders})`);
    params.push(...rowParams);
  }
  const sql = `INSERT INTO ${tbl} (${cols.join(",")}) VALUES ${values.join(",")}`;
  try {
    await c.query(sql, params);
  } catch (e) {
    throw new Error(`[${tbl}] ${e.message}`);
  }
  return rows.length;
}

const T = (d) => d.toISOString();

async function runSchema(schema) {
  console.log(`===== ${schema} =====`);
  await c.query(`SET search_path TO ${schema}, public`);

  const q = async (sql) => {
    try {
      return (await c.query(sql)).rows;
    } catch (e) {
      throw new Error(`[QUERY] ${sql.split(" ").slice(1, 3).join(" ")} -> ${e.message}`);
    }
  };
  const [properties, users, employees, guests, bookings, units, floors, buildings, checkins, checkouts,
    splitBills, orderItems, leases, channels, rateMappings, templates, cycles, bands, flags, groups,
    enterprises, departments, payments, ratePlans, orders] = [
    await q("SELECT id,name,vertical_type FROM properties"),
    await q("SELECT id,first_name,last_name,email FROM users"),
    await q("SELECT id,user_id,designation,department_id,band_id,property_id,base_salary FROM employees"),
    await q("SELECT id,first_name,last_name,email FROM guest_profiles"),
    await q("SELECT id,property_id,guest_id,status,check_in,check_out,total_amount FROM bookings"),
    await q("SELECT id,floor_id,unit_type,unit_label,base_rate,status FROM units"),
    await q("SELECT id,building_id,name FROM floors"),
    await q("SELECT id,property_id FROM buildings"),
    await q("SELECT id,property_id,booking_id,guest_id,status FROM checkin_sessions"),
    await q("SELECT id,booking_id,status FROM checkout_sessions"),
    await q("SELECT id,property_id,order_id,total_amount,guest_count,status FROM split_bills"),
    await q("SELECT id,order_id,item_name,line_total FROM f_and_b_order_items"),
    await q("SELECT id,property_id,agreement_ref,status FROM lease_agreements"),
    await q("SELECT id,name FROM channel_partners"),
    await q("SELECT id,property_id,unit_type,channel_room_type_code FROM ota_rate_mappings"),
    await q("SELECT id,channel FROM notification_templates"),
    await q("SELECT id,property_id,name FROM appraisal_cycles"),
    await q("SELECT id,name FROM employee_bands"),
    await q("SELECT id,flag_key,name,status FROM feature_flags"),
    await q("SELECT id,name FROM property_groups"),
    await q("SELECT id,name FROM enterprises"),
    await q("SELECT id,name FROM departments"),
    await q("SELECT id,booking_id,amount,status FROM payments"),
    await q("SELECT id,property_id,name FROM rate_plans"),
    await q("SELECT id,property_id,order_type,status,total_amount FROM f_and_b_orders"),
  ];

  const p = properties;

  const DELETE_ORDER = [
    "loyalty_redemptions","beta_feature_access","whatsapp_messages","whatsapp_campaigns","increments",
    "admin_notifications","appraisal_goals","appraisal_reviews","audit_logs","beta_testers",
    "booking_engine_config","booking_engine_sessions","central_rate_plans","competitor_rates",
    "cross_property_guests","employee_promotions","feature_changelog","feature_flag_cache",
    "feature_flag_dependencies","feature_flag_metrics","feature_flag_overrides","feature_rollout_plans",
    "hardware_devices","identity_verifications","inventory_calendar","kds_tickets","kiosk_config",
    "lease_amendments","login_attempts","loyalty_rewards","notification_queue","ota_availability_queue",
    "ota_booking_queue","ota_commission_rates","ota_rate_queue","payment_gateway_config",
    "payment_gateway_transactions","pricing_audit_log","promotions_offers","property_daily_snapshots",
    "push_subscriptions","refund_transactions","revenue_ai_audit","revenue_ai_rules","split_bill_items",
    "system_backups","user_sessions","whatsapp_config","whatsapp_conversations","whatsapp_templates",
  ];
  for (const t of DELETE_ORDER) await c.query(`DELETE FROM ${t}`);

  const prop = (i) => p[i % p.length];
  const user = (i) => users[i % users.length];
  const emp = (i) => employees[i % employees.length];
  const guest = (i) => guests[i % guests.length];
  const booking = (i) => bookings[i % bookings.length];
  const unit = (i) => units[i % units.length];
  const band = (i) => bands[i % bands.length];
  const flag = (i) => flags[i % flags.length];

  const today = new Date("2026-08-15T12:00:00Z");
  const day = (n) => new Date(today.getTime() + n * 86400000);

  const unitPropId = (u) => {
    const fl = floors.find((f) => f.id === u.floor_id);
    if (!fl) return p[0].id;
    const bd = buildings.find((b) => b.id === fl.building_id);
    return bd ? bd.property_id : p[0].id;
  };

  let n = 0;
  n += await ins("admin_notifications", [
    { title: "Guest check-in pending", message: "David Chen is waiting at the front desk.", notification_type: "warning", link: "/frontdesk/checkin", is_read: false, target_user_id: user(0).id, expires_at: day(1) },
    { title: "Housekeeping task overdue", message: "Room 202 cleaning overdue by 30 min.", notification_type: "alert", link: "/housekeeping", is_read: false, target_user_id: user(1).id, expires_at: day(1) },
    { title: "New vendor request", message: "AC vendor submitted a repair quote.", notification_type: "info", link: "/maintenance", is_read: true, target_user_id: user(2).id },
  ]);

  n += await ins("appraisal_goals", [
    { cycle_id: cycles[0].id, employee_id: emp(0).id, goal: "Improve guest satisfaction score to 4.5+", weightage: 40, target_date: "2026-10-01", status: "in_progress" },
    { cycle_id: cycles[0].id, employee_id: emp(1).id, goal: "Reduce average repair turnaround to under 4 hrs", weightage: 30, target_date: "2026-09-30", status: "in_progress" },
    { cycle_id: cycles[0].id, employee_id: emp(2).id, goal: "Complete front desk SOP certification", weightage: 20, target_date: "2026-08-30", status: "pending" },
  ]);

  n += await ins("appraisal_reviews", [
    { cycle_id: cycles[0].id, employee_id: emp(0).id, reviewer_id: user(3).id, self_rating: 4.2, reviewer_rating: 4.5, final_rating: 4.4, self_comment: "Consistently met targets", reviewer_comment: "Strong performer, lead potential", overall_score: 88, status: "completed", submitted_at: day(-2), reviewed_at: day(-1) },
    { cycle_id: cycles[0].id, employee_id: emp(1).id, reviewer_id: user(4).id, self_rating: 3.8, reviewer_rating: 4.0, final_rating: 3.9, self_comment: "Met most targets", reviewer_comment: "Good, needs better documentation", overall_score: 78, status: "completed", submitted_at: day(-3), reviewed_at: day(-1) },
    { cycle_id: cycles[0].id, employee_id: emp(2).id, reviewer_id: user(3).id, self_rating: 4.0, reviewer_rating: 4.2, status: "in_progress" },
  ]);

  n += await ins("audit_logs", [
    { user_id: user(0).id, action: "CREATE", entity_type: "booking", entity_id: booking(0).id, old_state: null, new_state: { status: "confirmed" }, ip_address: "192.168.1.10", user_agent: "Mozilla/5.0" },
    { user_id: user(1).id, action: "UPDATE", entity_type: "housekeeping_task", entity_id: unit(0).id, old_state: { status: "dirty" }, new_state: { status: "cleaning" }, ip_address: "192.168.1.21", user_agent: "Mozilla/5.0" },
    { user_id: user(2).id, action: "DELETE", entity_type: "vendor", entity_id: bookings.length > 5 ? booking(5).id : booking(0).id, old_state: { is_active: true }, new_state: { is_active: false }, ip_address: "10.0.0.5", user_agent: "Mozilla/5.0" },
  ]);

  const betaTesters = [
    { id: randomUUID(), user_id: user(0).id, enterprise_id: enterprises[0].id, is_active: true, beta_tier: "alpha", enrolled_by: user(2).id },
    { id: randomUUID(), user_id: user(1).id, enterprise_id: enterprises[0].id, is_active: true, beta_tier: "beta", enrolled_by: user(2).id },
  ];
  n += await ins("beta_testers", betaTesters);
  const btFlag = flags.find((f) => f.status === "beta") || flags[flags.length - 1];
  n += await ins("beta_feature_access", [
    { beta_tester_id: betaTesters[0].id, feature_flag_id: btFlag.id, granted_by: user(2).id, feedback: "Works well on mobile", feedback_submitted_at: day(-1) },
    { beta_tester_id: betaTesters[1].id, feature_flag_id: btFlag.id, granted_by: user(2).id },
  ]);

  n += await ins("booking_engine_config", p.map((pr, i) => ({
    property_id: pr.id,
    hero_image: `https://images.example.com/hero/${pr.id}.jpg`,
    tagline: `${pr.name} — Book Direct`,
    description: `Official booking portal for ${pr.name}.`,
    theme_color: i % 2 ? "#1E3A8A" : "#065F46",
    cancellation_policy: "Free cancellation up to 24 hours before check-in.",
    payment_methods: ["razorpay", "cash"],
    require_advance_payment: i === 0,
    advance_percentage: 30,
    min_advance_amount: 1000,
    check_in_time: "14:00:00",
    check_out_time: "11:00:00",
    terms_html: "<p>Valid ID required at check-in.</p>",
    is_active: true,
  })));

  n += await ins("booking_engine_sessions", bookings.slice(0, 4).map((b, i) => ({
    property_id: b.property_id,
    session_token: `SESS-${schema}-${i}-${b.id.slice(0, 8)}`.toUpperCase(),
    guest_name: `${guests.find((g) => g.id === b.guest_id)?.first_name ?? "Guest"} ${guests.find((g) => g.id === b.guest_id)?.last_name ?? ""}`.trim(),
    guest_email: guests.find((g) => g.id === b.guest_id)?.email ?? null,
    guest_phone: `+9198${String(10000000 + i * 1111111)}`,
    check_in: b.check_in ?? day(i + 1),
    check_out: b.check_out ?? day(i + 3),
    adults: 2,
    children: 0,
    unit_type: "room",
    expires_at: day(1),
  })));

  n += await ins("central_rate_plans", [
    { group_id: groups[0].id, name: "Group BAR Plan", description: "Base rate plan across all properties in group", is_active: true, base_rates: { room: 5500, suite: 8500 }, seasonal_mult: { peak: 1.2, off_peak: 0.85 }, weekday_rules: { mon_thu: 1.0 }, weekend_rules: { fri_sun: 1.1 }, effective_from: "2026-04-01", effective_to: "2027-03-31" },
    { group_id: groups[0].id, name: "Group Corporate Plan", description: "Corporate negotiated rates", is_active: true, base_rates: { room: 4950, suite: 7650 }, weekday_rules: {}, weekend_rules: {}, effective_from: "2026-04-01", effective_to: "2027-03-31" },
  ]);

  n += await ins("competitor_rates", [
    { property_id: p[0].id, competitor_name: "Taj Coromandel", competitor_rating: 4.8, distance_km: 2.3, room_type: "Deluxe", rate: 6200, source: "manual", scraped_at: day(-1) },
    { property_id: p[0].id, competitor_name: "ITC Grand Chola", competitor_rating: 4.9, distance_km: 3.1, room_type: "Executive", rate: 7100, source: "manual", scraped_at: day(-1) },
    { property_id: p[1].id, competitor_name: "Zostel", competitor_rating: 4.2, distance_km: 1.1, room_type: "Studio", rate: 5200, source: "ota", scraped_at: day(0) },
  ]);

  const activeGuestIds = guests.slice(0, 4).map((g) => g.id);
  n += await ins("cross_property_guests", activeGuestIds.map((gid, i) => ({
    group_id: groups[0].id,
    master_guest_id: gid,
    total_stays: 2 + i,
    total_spend: 15000 + i * 12000,
    total_nights: 4 + i * 2,
    avg_rating: 4.3 + i * 0.1,
    favorite_property_id: p[0].id,
    last_stay_property_id: p[i % 2].id,
    last_stay_at: day(-5),
    loyalty_points: 500 + i * 300,
    loyalty_tier: i === 0 ? "silver" : "gold",
    tags: ["business", "returning"],
    notes: "Prefers high floor rooms",
  })));

  n += await ins("employee_promotions", [
    { employee_id: emp(0).id, from_designation: "Front Desk Agent", to_designation: "Guest Relations Executive", from_band_id: band(0).id, to_band_id: band(1).id, from_ctc: 28000, to_ctc: 32000, effective_date: "2026-06-01", reason: "Consistent performance", approved_by: user(3).id, approved_at: day(-10), status: "approved" },
    { employee_id: emp(1).id, from_designation: "Maintenance Technician", to_designation: "Senior Maintenance Technician", from_band_id: band(0).id, to_band_id: band(1).id, from_ctc: 18000, to_ctc: 20000, effective_date: "2026-07-01", reason: "Certification achieved", approved_by: user(4).id, approved_at: day(-8), status: "approved" },
  ]);

  const hospFlags = flags.filter((f) => f.status === "active");
  n += await ins("feature_changelog", hospFlags.slice(0, 3).map((f, i) => ({
    feature_flag_id: f.id,
    version: `1.${i}.0`,
    release_date: day(-14 + i),
    what_changed: `Initial GA release of ${f.name}`,
    why_changed: "Feature complete and stable",
    migration_guide: "No action required",
    documented_by: user(2).id,
  })));

  n += await ins("feature_flag_cache", hospFlags.slice(0, 4).map((f, i) => ({
    feature_flag_id: f.id,
    scope: "global",
    scope_id: null,
    is_enabled: true,
  })));
  n += await ins("feature_flag_cache", [
    { feature_flag_id: hospFlags[0].id, scope: "property", scope_id: p[0].id, is_enabled: true },
    { feature_flag_id: hospFlags[0].id, scope: "property", scope_id: p[1].id, is_enabled: false },
  ]);

  n += await ins("feature_flag_dependencies", [
    { dependent_flag_id: hospFlags[0].id, required_flag_id: hospFlags[1].id, dependency_type: "requires", description: "Front desk operations require base hospitality module" },
    { dependent_flag_id: hospFlags[2].id, required_flag_id: hospFlags[1].id, dependency_type: "requires", description: "Housekeeping requires base module" },
  ]);

  n += await ins("feature_flag_metrics", hospFlags.slice(0, 3).map((f, i) => ({
    feature_flag_id: f.id,
    metric_date: day(-1),
    users_with_access: 4,
    properties_with_access: 2,
    api_calls_made: 340 + i * 120,
    feature_actions_performed: 58 + i * 22,
    avg_response_time_ms: 84 + i * 12,
    error_rate_pct: 0.4,
    adoption_rate_pct: 72 + i * 4,
  })));

  n += await ins("feature_flag_overrides", [
    { feature_flag_id: hospFlags[0].id, scope: "property", property_id: p[0].id, is_enabled: true, reason: "GA rollout", rollout_percentage: 100, requested_by: user(2).id, approved_by: user(2).id, approval_status: "approved", approved_at: day(-3) },
    { feature_flag_id: hospFlags[0].id, scope: "user", user_id: user(0).id, is_enabled: true, reason: "Early access", rollout_percentage: 100, requested_by: user(0).id, approved_by: user(2).id, approval_status: "approved", approved_at: day(-2) },
  ]);

  n += await ins("feature_rollout_plans", [
    { feature_flag_id: hospFlags[0].id, plan_name: "Staged GA rollout", description: "Roll out to 25% then 100%", rollout_start_date: day(-7), rollout_end_date: day(14), target_percentage: 100, target_segment: { verticals: ["hotel", "service_apartment"] }, success_metrics: { adoption: 0.7, error_rate: 0.01 }, rollback_criteria: { error_rate: 0.05 }, status: "active", created_by: user(2).id, approved_by: user(2).id },
    { feature_flag_id: hospFlags[1].id, plan_name: "Beta pilot", description: "Pilot with internal staff", rollout_start_date: day(-14), rollout_end_date: day(30), target_percentage: 10, target_segment: { roles: ["admin"] }, status: "planned", created_by: user(2).id },
  ]);

  n += await ins("hardware_devices", [
    { property_id: p[0].id, device_type: "kiosk", device_name: "Lobby Kiosk 1", serial_number: `KIO-${schema}-001`.toUpperCase(), api_endpoint: "https://kiosk.example.com/api", api_key_enc: "enc:kiosk_key", location: "Lobby", is_active: true, last_heartbeat: day(0) },
    { property_id: p[0].id, device_type: "qr_scanner", device_name: "Front Desk Scanner", serial_number: `QR-${schema}-001`.toUpperCase(), location: "Front Desk", is_active: true, last_heartbeat: day(0) },
    { property_id: p[1].id, device_type: "printer", device_name: "Billing Printer", serial_number: `PRT-${schema}-001`.toUpperCase(), location: "Reception", is_active: true, last_heartbeat: day(-2) },
  ]);

  n += await ins("identity_verifications", checkins.slice(0, 3).map((ci, i) => ({
    checkin_session_id: ci.id,
    method: i === 0 ? "ocr" : "manual",
    id_type: "AADHAAR",
    id_number: `XXXX-XXXX-${String(1000 + i * 111)}4`,
    id_image_url: `https://storage.example.com/id/${ci.id}.jpg`,
    selfie_url: `https://storage.example.com/selfie/${ci.id}.jpg`,
    face_matched: i === 0,
    confidence_score: 92.5 - i * 3,
    verified_by: user(0).id,
    notes: i === 0 ? "Verified via Aadhaar OTP" : "Manual verification",
  })));

  n += await ins("increments", [
    { employee_id: emp(0).id, current_ctc: 32000, new_ctc: 36000, increment_pct: 12.5, effective_date: "2026-10-01", reason: "Annual appraisal", status: "approved", approved_by: user(3).id, approved_at: day(-1) },
    { employee_id: emp(1).id, current_ctc: 20000, new_ctc: 22000, increment_pct: 10, effective_date: "2026-10-01", reason: "Annual appraisal", status: "draft" },
  ]);

  const invRows = [];
  for (const u of units.slice(0, 10)) {
    const bid = bookings.find((b) => b.property_id === unitPropId(u) && (b.status === "checked_in" || b.status === "confirmed"));
    invRows.push({
      unit_id: u.id,
      date: day(0),
      status: bid ? "occupied" : "vacant",
      rate: u.base_rate,
      is_blocked: false,
      booking_id: bid ? bid.id : null,
    });
    invRows.push({
      unit_id: u.id,
      date: day(1),
      status: "vacant",
      rate: u.base_rate,
      is_blocked: u.unit_type === "cabin",
      booking_id: null,
    });
  }
  n += await ins("inventory_calendar", invRows);

  const kdsTargets = orders.filter((o) => o.status === "preparing" || o.status === "new");
  n += await ins("kds_tickets", kdsTargets.slice(0, 4).map((o, i) => ({
    property_id: o.property_id,
    order_id: o.id,
    table_number: o.order_type === "restaurant_dine_in" ? `T${i + 1}` : "Room",
    priority: i === 0 ? "high" : "normal",
    status: i === 0 ? "in_progress" : "new",
    station: i % 2 ? "grill" : "kitchen",
    fired_at: day(0),
    notes: "Extra spicy requested",
  })));

  n += await ins("kiosk_config", p.map((pr, i) => ({
    property_id: pr.id,
    enabled: i === 0,
    welcome_message: `Welcome to ${pr.name}! Please check in using this kiosk.`,
    required_id_types: ["passport", "aadhaar"],
    require_selfie: true,
    require_payment: true,
    require_form_c: false,
    digital_key_enabled: true,
    branding_logo_url: `https://images.example.com/logo/${pr.id}.png`,
    branding_color: "#062A54",
    auto_checkin_enabled: false,
    auto_checkout_enabled: false,
  })));

  n += await ins("lease_amendments", leases.map((l, i) => ({
    lease_id: l.id,
    amendment_type: "rent_revision",
    prev_value: { rent: 24000 },
    new_value: { rent: 25000 },
    effective_date: day(30 + i),
    approved_by: user(2).id,
  })));

  n += await ins("login_attempts", [
    { email: "frontdesk@ehms.demo", ip_address: "192.168.1.10", user_agent: "Mozilla/5.0", success: true, attempted_at: day(-1) },
    { email: "hr@ehms.demo", ip_address: "192.168.1.22", user_agent: "Mozilla/5.0", success: false, failure_reason: "INVALID_PASSWORD", attempted_at: day(0) },
    { email: "finance@ehms.demo", ip_address: "10.0.0.8", user_agent: "Mozilla/5.0", success: true, attempted_at: day(0) },
  ]);

  const rewards = [
    { id: randomUUID(), property_id: p[0].id, name: "Free Breakfast", description: "Complimentary breakfast for two", reward_type: "free_breakfast", points_required: 800, value: 700, is_active: true },
    { id: randomUUID(), property_id: p[0].id, name: "Room Upgrade", description: "One category upgrade", reward_type: "room_upgrade", points_required: 1500, value: 1500, is_active: true },
    { id: randomUUID(), property_id: p[0].id, name: "Late Checkout", description: "Checkout by 4 PM", reward_type: "late_checkout", points_required: 400, value: 500, is_active: true },
    { id: randomUUID(), property_id: p[1].id, name: "Spa Voucher", description: "INR 1000 spa credit", reward_type: "spa_credit", points_required: 1200, value: 1000, is_active: true },
  ];
  n += await ins("loyalty_rewards", rewards);

  n += await ins("loyalty_redemptions", [
    { guest_id: guests[0].id, reward_id: rewards[0].id, booking_id: bookings.find((b) => b.guest_id === guests[0].id)?.id ?? null, points_used: 800, redeemed_at: day(-3), status: "fulfilled" },
    { guest_id: guests[1].id, reward_id: rewards[2].id, booking_id: bookings.find((b) => b.guest_id === guests[1].id)?.id ?? null, points_used: 400, redeemed_at: day(-1), status: "pending" },
  ]);

  n += await ins("notification_queue", [
    { template_id: templates.find((t) => t.channel === "email")?.id ?? null, recipient: guests[0].email, channel: "email", payload: { type: "booking_confirmation" }, status: "sent", sent_at: day(-2) },
    { template_id: templates.find((t) => t.channel === "whatsapp")?.id ?? null, recipient: `+91${String(9800000000 + 111111)}`, channel: "whatsapp", payload: { type: "pre_arrival" }, status: "pending", retry_count: 0 },
    { template_id: null, recipient: guests[2].email, channel: "email", payload: { type: "feedback_request" }, status: "failed", error_message: "bounced", retry_count: 2, created_at: day(-4) },
  ]);

  const availRows = [];
  for (const u of units.slice(0, 8)) {
    availRows.push({ property_id: unitPropId(u), unit_id: u.id, date: day(1), available: true, rate: u.base_rate, min_stay: 1, status: "synced", synced_at: day(0) });
  }
  n += await ins("ota_availability_queue", availRows);

  n += await ins("ota_booking_queue", [
    { property_id: p[0].id, channel_id: channels[0].id, channel_booking_ref: `BK-${schema}-${Date.now() % 100000}`.toUpperCase(), guest_name: "Sneha Patel", guest_email: "sneha.patel@gmail.com", guest_phone: "+919876543210", unit_type: "room", check_in: day(3), check_out: day(5), adults: 2, children: 1, total_amount: 11000, commission: 1650, net_amount: 9350, status: "pending", raw_payload: { channel: "booking.com" } },
    { property_id: p[0].id, channel_id: channels[1].id, channel_booking_ref: `MMT-${schema}-${Date.now() % 100000}`.toUpperCase(), guest_name: "Rahul Gupta", guest_email: "rahul.gupta@yahoo.com", guest_phone: "+919812345678", unit_type: "suite", check_in: day(2), check_out: day(4), adults: 2, children: 0,     total_amount: 17000, commission: 3060, net_amount: 13940, status: "created", internal_booking_id: booking(0).id, processed_at: day(0), raw_payload: { channel: "mmt" } },
  ]);

  n += await ins("ota_commission_rates", channels.map((ch, i) => ({
    channel_id: ch.id,
    property_id: p[i % 2].id,
    unit_type: "room",
    commission_pct: ch.name.includes("MakeMyTrip") ? 18 : 15,
    effective_from: day(-30),
    effective_to: day(335),
    is_active: true,
  })));

  n += await ins("ota_rate_queue", [
    { property_id: rateMappings[0].property_id, mapping_id: rateMappings[0].id, date: day(1), rate: 5775, currency: "INR", status: "synced", synced_at: day(0) },
    { property_id: rateMappings[0].property_id, mapping_id: rateMappings[0].id, date: day(2), rate: 5775, currency: "INR", status: "pending" },
  ]);

  n += await ins("payment_gateway_config", p.map((pr, i) => ({
    property_id: pr.id,
    gateway_name: i % 2 ? "razorpay" : "cashfree",
    api_key_enc: `enc:key_${schema}_${i}`,
    webhook_secret: `whsec_${schema}_${i}`,
    is_active: true,
    config: { currency: "INR", mode: "live" },
  })));

  const pgTx = payments.slice(0, 4).map((pm, i) => ({
    payment_id: pm.id,
    booking_id: pm.booking_id,
    property_id: bookings.find((b) => b.id === pm.booking_id)?.property_id ?? p[0].id,
    gateway_name: i % 2 ? "razorpay" : "cashfree",
    gateway_txn_id: `pay_${schema}_${i}${Date.now()}`.slice(0, 30),
    gateway_order_id: `order_${schema}_${i}`,
    amount: Number(pm.amount),
    currency: "INR",
    status: pm.status === "completed" ? "captured" : "pending",
    payment_method: "card",
    gateway_response: { success: true },
    customer_email: guests[i % guests.length].email,
    customer_phone: `+9198${String(7654321 + i * 111111)}`,
    description: `Payment for booking ${pm.booking_id?.slice(0, 8)}`,
  }));
  n += await ins("payment_gateway_transactions", pgTx);

  n += await ins("pricing_audit_log", units.slice(0, 5).map((u, i) => ({
    property_id: unitPropId(u),
    room_type: u.unit_type,
    unit_id: u.id,
    date: day(0),
    old_rate: Number(u.base_rate) - 500,
    new_rate: Number(u.base_rate),
    rule_applied: "demand_based",
    triggered_by: "ai_engine",
  })));

  n += await ins("promotions_offers", [
    { property_id: p[0].id, offer_code: "FLAT15", discount_type: "percentage", discount_value: 15, title: "Flat 15% Off Direct Bookings", description: "Book on official site for 15% off", valid_from: day(-10), valid_until: day(50), is_active: true },
    { property_id: p[0].id, offer_code: "EXTRA10", discount_type: "percentage", discount_value: 10, title: "Early Bird 10% Off", description: "Book 7+ days in advance", valid_from: day(-10), valid_until: day(80), is_active: true },
    { property_id: p[1].id, offer_code: "WEEKEND", discount_type: "fixed_amount", discount_value: 1000, title: "Weekend Getaway", description: "INR 1000 off weekend stays", valid_from: day(-5), valid_until: day(30), is_active: true },
  ]);

  n += await ins("property_daily_snapshots", p.map((pr, i) => ({
    property_id: pr.id,
    snapshot_date: day(-1),
    total_rooms: 40,
    occupied_rooms: 12 + i,
    occupancy_pct: 30 + i * 4,
    adr: 6500,
    revpar: 1950 + i * 100,
    total_revenue: 156000 + i * 8000,
    room_revenue: 130000 + i * 7000,
    fb_revenue: 21000 + i * 1000,
    other_revenue: 5000,
    checkins: 6,
    checkouts: 4,
    no_shows: 1,
    cancellations: 2,
    avg_guest_rating: 4.4,
    complaints: 0,
  })));

  n += await ins("push_subscriptions", [
    { user_id: user(0).id, endpoint: `https://fcm.googleapis.com/endpoint/${schema}1`, p256dh: `p256dh_${schema}_1`, auth: `auth_${schema}_1`, user_agent: "Chrome/126", last_active_at: day(0) },
    { user_id: user(1).id, endpoint: `https://fcm.googleapis.com/endpoint/${schema}2`, p256dh: `p256dh_${schema}_2`, auth: `auth_${schema}_2`, user_agent: "Chrome/126", last_active_at: day(-1) },
  ]);

  n += await ins("refund_transactions", [
    { payment_id: payments[0].id, gateway_txn_id: `pay_${schema}_ref1`, amount: 5000, reason: "Partial refund for cancelled stay", status: "processed", processed_by: user(2).id, processed_at: day(-2) },
  ]);

  n += await ins("revenue_ai_rules", p.map((pr, i) => ({
    property_id: pr.id,
    rule_type: i % 2 ? "day_of_week" : "occupancy_threshold",
    name: i % 2 ? "Weekend uplift rule" : "Demand-based pricing",
    config: { max_change_pct: 15, min_occupancy: 0.6 },
    is_active: true,
    priority: i + 1,
  })));

  const raiTargets = ratePlans.length ? ratePlans : [];
  n += await ins("revenue_ai_audit", [
    { property_id: p[0].id, rate_plan_id: raiTargets[0]?.id ?? null, original_rate: 5000, recommended_rate: 5500, applied_rate: 5500, factors: ["occupancy", "weekend"], confidence_score: 86, applied_by: "ai_engine", applied_at: day(-1), notes: "Applied weekend uplift" },
    { property_id: p[1].id, rate_plan_id: raiTargets[1]?.id ?? null, original_rate: 6000, recommended_rate: 5800, applied_rate: 6000, factors: ["low_demand"], confidence_score: 61, applied_by: "revenue_manager", applied_at: day(-2), notes: "Kept existing rate" },
  ]);

  const splitRows = [];
  for (const sb of splitBills) {
    const items = orderItems.filter((oi) => oi.order_id === sb.order_id);
    const per = Number(sb.guest_count || 1);
    for (let i = 0; i < per && i < (items.length || 1); i++) {
      splitRows.push({
        split_bill_id: sb.id,
        order_item_id: items[i]?.id ?? items[0]?.id ?? null,
        label: `Guest ${i + 1}`,
        amount: Number((Number(sb.total_amount) / per).toFixed(2)),
        percentage: Math.round(100 / per),
        is_paid: sb.status === "paid",
        paid_at: sb.status === "paid" ? day(-1) : null,
        payment_method: "card",
      });
    }
  }
  n += await ins("split_bill_items", splitRows);

  n += await ins("system_backups", [
    { backup_type: "full", status: "completed", file_path: `s3://ehms-backups/${schema}/full-2026-08-14.gz`, file_size_bytes: 482713, started_at: day(-1), completed_at: day(-1), triggered_by: user(2).id },
    { backup_type: "incremental", status: "in_progress", file_path: `s3://ehms-backups/${schema}/incr-2026-08-15.gz`, started_at: day(0), triggered_by: user(2).id },
    { backup_type: "full", status: "failed", file_path: null, error_message: "S3 write timeout", started_at: day(-3), triggered_by: user(2).id },
  ]);

  n += await ins("user_sessions", users.slice(0, 4).map((u, i) => ({
    user_id: u.id,
    token_hash: `tok_${schema}_${i}_${u.id.slice(0, 8)}`,
    ip_address: `192.168.1.${10 + i}`,
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    device_info: "Chrome on Windows",
    is_active: i < 2,
    logged_in_at: day(-1),
    last_active_at: day(0),
    logged_out_at: i < 2 ? null : day(-1),
  })));

  const waTemplates = [
    { property_id: p[0].id, name: "booking_confirmation", category: "utility", language: "en", status: "approved", header_type: "text", header_text: "Booking Confirmed", body_text: "Hi {{1}}, your booking #{{2}} at {{3}} is confirmed.", footer_text: "Powered by Nivesh eHMS", variables: [{ name: "guest_name" }, { name: "booking_ref" }, { name: "property_name" }], buttons: [{ type: "url", text: "View Booking", url: "https://book.example.com/{{1}}" }], meta_template_id: `wa_${schema}_1` },
    { property_id: p[0].id, name: "pre_arrival", category: "utility", language: "en", status: "approved", body_text: "Hi {{1}}, check-in is tomorrow at 2 PM. Location: {{2}}", footer_text: "Reply HELP for assistance", variables: [{ name: "guest_name" }, { name: "property_name" }], meta_template_id: `wa_${schema}_2` },
    { property_id: p[1].id, name: "feedback_request", category: "marketing", language: "en", status: "pending", body_text: "How was your stay at {{1}}? Share feedback.", variables: [{ name: "property_name" }] },
  ];
  n += await ins("whatsapp_templates", waTemplates);

  n += await ins("whatsapp_config", p.map((pr, i) => ({
    property_id: pr.id,
    enabled: i === 0,
    provider: "meta",
    phone_number_id: `PNID_${schema}_${i}`,
    whatsapp_business_id: `WABA_${schema}_${i}`,
    access_token: `enc:wa_token_${schema}_${i}`,
    webhook_verify_token: `verify_${schema}_${i}`,
    template_namespace: `ns_${schema}_${i}`,
    template_language: "en",
    display_name: pr.name,
    about_text: "Official WhatsApp for guest communications",
    auto_welcome: true,
    auto_checkin_reminder: true,
    auto_checkout_reminder: true,
    auto_feedback_request: true,
    auto_promo_enabled: false,
  })));

  const convs = bookings.slice(0, 3).map((b, i) => ({
    id: randomUUID(),
    property_id: b.property_id,
    guest_id: b.guest_id,
    booking_id: b.id,
    phone_number: `+9198${String(7000000 + i * 1111111)}`,
    contact_name: `${guests.find((g) => g.id === b.guest_id)?.first_name ?? "Guest"} ${guests.find((g) => g.id === b.guest_id)?.last_name ?? ""}`.trim(),
    status: i === 0 ? "active" : "closed",
    last_message_at: day(0),
    last_message_preview: "Thanks, see you soon!",
    unread_count: i === 0 ? 1 : 0,
    assigned_to: user(0).id,
    tags: ["guest", "checkin"],
  }));
  n += await ins("whatsapp_conversations", convs);

  n += await ins("whatsapp_messages", convs.map((cv, i) => ({
    conversation_id: cv.id,
    property_id: cv.property_id,
    direction: "outbound",
    message_type: "text",
    text_body: "Your booking is confirmed. Check-in time is 2 PM.",
    status: "delivered",
    provider_msg_id: `wamid_${schema}_${i}`,
    wa_message_id: `wamid_${schema}_${i}`,
    wa_timestamp: day(0),
    wa_status: "delivered",
    sent_by: user(0).id,
  })));
  n += await ins("whatsapp_messages", convs.map((cv, i) => ({
    conversation_id: cv.id,
    property_id: cv.property_id,
    direction: "inbound",
    message_type: "text",
    text_body: i === 0 ? "Can we get a late checkout?" : "Thanks!",
    status: "delivered",
    wa_message_id: `wamid_in_${schema}_${i}`,
    wa_timestamp: day(0),
    wa_status: "read",
  })));

  n += await ins("whatsapp_campaigns", [
    { property_id: p[0].id, name: "Diwali Offer Blast", template_id: waTemplates[0].id, status: "completed", target_filter: { segments: ["previous_guests"] }, recipient_count: 240, scheduled_at: day(-10), started_at: day(-10), completed_at: day(-9), sent_count: 240, delivered_count: 228, read_count: 150, failed_count: 12, click_count: 45, custom_variables: {}, created_by: user(2).id },
    { property_id: p[0].id, name: "Feedback follow-up", template_id: waTemplates[2].id, status: "scheduled", target_filter: { checkout_days: 2 }, recipient_count: 0, scheduled_at: day(2), created_by: user(2).id },
  ]);

  console.log(`${schema}: inserted ${n} rows across ${TARGETS.length} tables`);
  return n;
}

let total = 0;
try {
  await c.query(`SET search_path TO public`);
  await c.query(`CREATE TABLE IF NOT EXISTS public._seed_log (table_name text primary key, inserted_at timestamptz default now())`);
  for (const schema of ["viswa", "nivesh"]) {
    total += await runSchema(schema);
  }
  console.log(`\nTOTAL inserted: ${total} rows`);
} catch (e) {
  console.error("SEED ERROR:", e.message);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
