// Smoke test of NIVESH shard API modules.
// Requires dev server on localhost:3000 and the seed to have been run.
const BASE = "http://localhost:3000";

async function tenantLogin(email, password, tenantCode) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenant_code: tenantCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`tenant login failed: ${data.error || data.message}`);
  const cookie = res.headers.get("set-cookie")?.split(";")[0] || "";
  console.log(`✓ tenant login OK (${email} / ${tenantCode})`);
  return cookie;
}

async function api(path, cookie, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), cookie, "Content-Type": "application/json" },
  });
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

const passes = [], warns = [], fails = [];
function record(label, r, okMsg = "ok") {
  const line = `[${r.status}] ${label} -> ${okMsg}`;
  if (r.status === 200) { passes.push(line); console.log(`  ✅ ${line}`); }
  else if (r.status === 500) { fails.push(line); console.log(`  ❌ ${line} :: ${JSON.stringify(r.data)?.slice(0, 200)}`); }
  else { warns.push(line); console.log(`  ⚠️  ${line} :: ${JSON.stringify(r.data)?.slice(0, 160)}`); }
}

async function main() {
  const TC = (process.argv[2] || "NIVESH").toUpperCase();
  const cookie = await tenantLogin("superadmin@ehms.demo", "Demo@1234", TC);

  // Identity
  let r = await api("/api/auth/me", cookie);
  record("auth/me", r, `${r.data?.user?.email} / ${r.data?.user?.tenant_code}`);
  const user = r.data?.user;

  // Feature flags
  r = await api("/api/features", cookie, { method: "POST", body: JSON.stringify({ action: "get-all" }) });
  const flags = r.data?.flags || r.data?.features || [];
  record("features get-all", r, `${Array.isArray(flags) ? flags.filter((f) => f.enabled || f.granted).length : "?"} enabled`);

  // Properties
  r = await api("/api/properties", cookie);
  const props = Array.isArray(r.data) ? r.data : r.data?.properties || [];
  record("properties", r, `${props.length} props`);
  const pid = props[0]?.id;

  const get = (path, label) => api(path, cookie).then((res) => record(label, res));
  const getP = (path, label) => pid ? api(`${path}?property_id=${pid}`, cookie).then((res) => record(label, res)) : Promise.resolve(console.log(`  - skip ${label} (no property)`));

  const dash = [
    ["/api/dashboard/stats", "dashboard/stats"],
    ["/api/dashboard/hotels", "dashboard/hotels"],
    ["/api/dashboard/multi-property", "dashboard/multi-property"],
    ["/api/dashboard/front-desk/dashboard", "front-desk/dashboard"],
    ["/api/dashboard/front-desk/room-status", "front-desk/room-status"],
    ["/api/dashboard/front-desk/active-bookings", "front-desk/active-bookings"],
    ["/api/dashboard/front-desk/matrix", "front-desk/matrix"],
    ["/api/dashboard/front-desk/revenue-ai", "front-desk/revenue-ai"],
    ["/api/dashboard/f-and-b/orders", "f-and-b/orders"],
    ["/api/dashboard/masters/hotels", "masters(hotels)"],
  ];
  console.log("\n== Dashboards ==");
  for (const [p, l] of dash) await get(p, l);

  console.log("\n== Hotels / Front Desk / Bookings ==");
  await get("/api/reservations", "reservations");
  await get("/api/reservations/calendar", "reservations/calendar");
  await get("/api/guests", "guests");
  await get("/api/invoices/folio", "invoices/folio");
  await get("/api/checkin", "checkin");
  await get("/api/checkout", "checkout");
  await get("/api/deposits", "deposits");
  await get("/api/booking-engine/availability", "booking-engine/availability");
  await get("/api/dashboard/front-desk/channels", "front-desk/channels");
  await get("/api/dashboard/front-desk/offers", "front-desk/offers");
  await get("/api/dashboard/front-desk/requests", "front-desk/requests");
  await get("/api/dashboard/front-desk/feedbacks", "front-desk/feedbacks");
  await get("/api/dashboard/front-desk/billing", "front-desk/billing");

  console.log("\n== Housekeeping / Laundry / Maintenance ==");
  await get("/api/housekeeping", "housekeeping");
  await get("/api/housekeeping/stats", "housekeeping/stats");
  await get("/api/housekeeping/inspections", "housekeeping/inspections");
  await get("/api/housekeeping/linen/batches", "linen/batches");
  await get("/api/laundry", "laundry");
  await get("/api/laundry/price-list", "laundry/price-list");
  await get("/api/maintenance", "maintenance");
  await get("/api/maintenance/stats", "maintenance/stats");
  await get("/api/maintenance/assets", "maintenance/assets");
  await get("/api/maintenance/amc", "maintenance/amc");
  await get("/api/maintenance/preventive", "maintenance/preventive");
  await get("/api/maintenance/inventory", "maintenance/inventory");

  console.log("\n== Vendors / Procurement / Inventory ==");
  await get("/api/vendors", "vendors");
  await get("/api/vendors/services", "vendors/services");
  await get("/api/procurement/purchase-orders", "purchase-orders");
  await get("/api/procurement/grn", "procurement/grn");
  await get("/api/procurement/stats", "procurement/stats");
  await get("/api/inventory/items", "inventory/items");
  await get("/api/inventory/warehouses", "inventory/warehouses");
  await get("/api/inventory/stats", "inventory/stats");
  await get("/api/inventory/categories", "inventory/categories");

  console.log("\n== HR ==");
  await get("/api/hr/employees", "hr/employees");
  await get("/api/hr/departments", "hr/departments");
  await get("/api/hr/designations", "hr/designations");
  await get("/api/hr/leaves", "hr/leaves");
  await get("/api/hr/leaves/balances", "hr/leaves/balances");
  await get("/api/hr/payroll", "hr/payroll");
  await get("/api/hr/timesheets", "hr/timesheets");
  await get("/api/hr/shifts", "hr/shifts");
  await get("/api/hr/bands", "hr/bands");
  await get("/api/hr/holidays", "hr/holidays");
  await get("/api/hr/compliance", "hr/compliance");
  await get("/api/hr/roster", "hr/roster");

  console.log("\n== Finance ==");
  await get("/api/finance", "finance overview");
  await get("/api/finance/accounts", "finance/accounts");
  await get("/api/finance/journal-entries", "journal-entries");
  await get("/api/finance/ledger", "finance/ledger");
  await get("/api/finance/vendor-bills", "vendor-bills");
  await get("/api/finance/budget", "finance/budget");
  await get("/api/finance/fixed-assets", "fixed-assets");
  await get("/api/finance/tax-filings", "tax-filings");
  await get("/api/finance/cost-centers", "cost-centers");
  await get("/api/finance/fiscal-years", "fiscal-years");
  await get("/api/finance/reconciliation", "reconciliation");
  await get("/api/finance/reports/trial-balance", "trial-balance");
  await get("/api/finance/reports/profit-loss", "profit-loss");
  await get("/api/finance/reports/balance-sheet", "balance-sheet");

  console.log("\n== F&B / Restaurant ==");
  await get("/api/dashboard/f-and-b/menu", "f-and-b/menu");
  await get("/api/restaurant/tables", "restaurant/tables");
  await get("/api/restaurant/tables/layout", "restaurant/tables/layout");
  await get("/api/restaurant/kds", "restaurant/kds");
  await get("/api/restaurant/reservations", "restaurant/reservations");
  await get("/api/restaurant/split-bills", "restaurant/split-bills");

  console.log("\n== Workplace / Rental / Loyalty / OTA / Misc ==");
  await get("/api/workplace/bookings", "workplace/bookings");
  await get("/api/workplace/memberships", "workplace/memberships");
  await get("/api/leases", "leases");
  await get("/api/rent-invoices", "rent-invoices");
  await get("/api/loyalty/tiers", "loyalty/tiers");
  await get("/api/loyalty/transactions", "loyalty/transactions");
  await get("/api/ota/bookings", "ota/bookings");
  await get("/api/ota/settlements", "ota/settlements");
  await get("/api/ota/mappings", "ota/mappings");
  await get("/api/visitors", "visitors");
  await get("/api/pricing/rules", "pricing/rules");
  await get("/api/pricing/seasons", "pricing/seasons");
  await get("/api/masters/rate-plans", "masters/rate-plans");
  await get("/api/tickets", "tickets");
  await get("/api/broadcasts/active", "broadcasts/active");

  console.log(`\n==============================`);
  console.log(`PASS: ${passes.length}   WARN(need-params/4xx): ${warns.length}   FAIL: ${fails.length}`);
  for (const f of fails) console.log("FAIL:", f);
  if (fails.length === 0) console.log(`✅ ${TC} API smoke test PASSED`);
  else process.exitCode = 1;
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
