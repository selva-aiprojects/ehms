// Page-by-page content verification: hits the API endpoint backing each dashboard
// page and confirms it returns actual data (non-empty / non-zero), not zeros.
const BASE = "http://localhost:3000";
const TC = (process.argv[2] || "NIVESH").toUpperCase();

async function login(email, password, tenantCode) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenant_code: tenantCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`login failed: ${data.error || data.message}`);
  return res.headers.get("set-cookie")?.split(";")[0] || "";
}

function summarize(path, payload) {
  const d = payload?.data;
  if (path === "/api/dashboard/stats") {
    const c = payload?.current || {};
    return `bookings=${c.bookings} checkedIn=${c.checkedIn} guests=${c.guests} rev=${c.revenue} occupancy=${c.occupancyRate} rating=${c.avgRating}`;
  }
  if (path === "/api/dashboard/admin-overview") {
    return `employees=${payload?.employeesAvailable} issues=${payload?.issues?.map(i => `${i.category}:${i.count}`).join(",") || "-"} rooms=${payload?.rooms?.map(r => `${r.status}:${r.count}`).join(",") || "-"} revToday=${payload?.revenue?.today} spendMonth=${payload?.financial?.monthSpending}`;
  }
  if (Array.isArray(d)) return `rows=${d.length}`;
  if (Array.isArray(payload)) return `rows=${payload.length}`;
  if (d && typeof d === "object") {
    const arr = Object.values(d).find(v => Array.isArray(v));
    if (arr) return `rows=${arr.length}`;
    const cnt = Object.values(d).filter(v => typeof v === "number" && v > 0).length;
    return `obj(nonZero=${cnt})`;
  }
  if (payload && typeof payload === "object") {
    const arr = Object.values(payload).find(v => Array.isArray(v));
    if (arr) return `rows=${arr.length}`;
  }
  return "?";
}

const checks = [
  ["/dashboard", "/api/dashboard/stats"],
  ["/dashboard", "/api/dashboard/admin-overview"],
  ["/dashboard/hotels", "/api/dashboard/hotels"],
  ["/dashboard/apartments", "/api/dashboard/apartments"],
  ["/dashboard/front-desk", "/api/dashboard/front-desk/dashboard"],
  ["/dashboard/front-desk", "/api/dashboard/front-desk/room-status"],
  ["/dashboard/front-desk", "/api/dashboard/front-desk/active-bookings"],
  ["/dashboard/front-desk", "/api/dashboard/front-desk/matrix"],
  ["/dashboard/front-desk", "/api/dashboard/front-desk/requests"],
  ["/dashboard/front-desk", "/api/dashboard/front-desk/feedbacks"],
  ["/dashboard/housekeeping", "/api/housekeeping"],
  ["/dashboard/housekeeping", "/api/housekeeping/stats"],
  ["/dashboard/laundry", "/api/laundry"],
  ["/dashboard/maintenance", "/api/maintenance"],
  ["/dashboard/maintenance", "/api/maintenance/stats"],
  ["/dashboard/vendors", "/api/vendors"],
  ["/dashboard/procurement", "/api/procurement/purchase-orders"],
  ["/dashboard/procurement", "/api/procurement/grn"],
  ["/dashboard/inventory", "/api/inventory/items"],
  ["/dashboard/inventory", "/api/inventory/warehouses"],
  ["/dashboard/restaurant", "/api/restaurant/tables"],
  ["/dashboard/restaurant", "/api/dashboard/f-and-b/orders"],
  ["/dashboard/hr", "/api/hr/employees"],
  ["/dashboard/hr", "/api/hr/payroll"],
  ["/dashboard/hr", "/api/hr/timesheets"],
  ["/dashboard/hr", "/api/hr/attendance"],
  ["/dashboard/finance", "/api/finance"],
  ["/dashboard/finance", "/api/finance/accounts"],
  ["/dashboard/finance", "/api/finance/journal-entries"],
  ["/dashboard/finance", "/api/finance/vendor-bills"],
  ["/dashboard/finance", "/api/finance/reports/trial-balance"],
  ["/dashboard/finance", "/api/finance/reports/profit-loss"],
  ["/dashboard/finance", "/api/finance/reports/balance-sheet"],
  ["/dashboard/workplace", "/api/workplace/bookings"],
  ["/dashboard/workplace", "/api/workplace/memberships"],
  ["/dashboard/rental", "/api/leases"],
  ["/dashboard/rental", "/api/rent-invoices"],
  ["/dashboard/rental", "/api/deposits"],
  ["/dashboard/loyalty", "/api/loyalty/tiers"],
  ["/dashboard/loyalty", "/api/loyalty/transactions"],
  ["/dashboard/ota", "/api/ota/settlements"],
  ["/dashboard/ota", "/api/ota/mappings"],
  ["/dashboard/front-desk/guests", "/api/guests"],
  ["/dashboard/front-desk/calendar", "/api/reservations"],
  ["/dashboard/tickets", "/api/tickets"],
  ["/dashboard/rooms-inventory", "/api/dashboard/front-desk/room-status"],
];

async function main() {
  const cookie = await login("superadmin@ehms.demo", "Demo@1234", TC);
  console.log(`== ${TC} page-by-page data check ==`);
  let empty = 0, total = 0;
  for (const [page, path] of checks) {
    total++;
    const res = await fetch(`${BASE}${path}`, { headers: { cookie } });
    let payload = null;
    try { payload = await res.json(); } catch { /* ignore */ }
    const summary = res.status === 200 ? summarize(path, payload) : `HTTP ${res.status}`;
    const looksEmpty = res.status === 200 && /^(rows=0|bookings=0|obj\(nonZero=0\)|\?)$/.test(summary);
    if (looksEmpty) empty++;
    console.log(`${looksEmpty ? "⚠️" : "✅"} ${page.padEnd(30)} ${path.padEnd(48)} ${summary}`);
  }
  console.log(`\n${TC}: ${total} checks, ${empty} empty/zero`);
  if (empty) process.exitCode = 1;
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
