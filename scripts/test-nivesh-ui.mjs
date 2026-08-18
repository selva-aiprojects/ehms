// UI route smoke test for NIVESH: fetch key dashboard pages with a valid cookie
// and confirm they render (200 + app HTML, not redirect/error).
const BASE = process.env.BASE_URL || "http://localhost:3000";

async function tenantLogin(email, password, tenantCode) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenant_code: tenantCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`login failed: ${data.error || data.message}`);
  return res.headers.get("set-cookie")?.split(";")[0] || "";
}

const routes = [
  "/dashboard",
  "/dashboard/front-desk",
  "/dashboard/front-desk/checkin",
  "/dashboard/front-desk/checkout",
  "/dashboard/front-desk/calendar",
  "/dashboard/hotels",
  "/dashboard/apartments",
  "/dashboard/multi-property",
  "/dashboard/housekeeping",
  "/dashboard/housekeeping/tasks",
  "/dashboard/laundry",
  "/dashboard/maintenance",
  "/dashboard/maintenance/tickets",
  "/dashboard/vendors",
  "/dashboard/procurement",
  "/dashboard/procurement/purchase-orders",
  "/dashboard/inventory",
  "/dashboard/restaurant",
  "/dashboard/hr",
  "/dashboard/hr/employees",
  "/dashboard/hr/payroll",
  "/dashboard/finance",
  "/dashboard/finance/accounts",
  "/dashboard/finance/journal",
  "/dashboard/finance/ledger",
  "/dashboard/finance/reports",
  "/dashboard/workplace",
  "/dashboard/rental",
  "/dashboard/rental/leases",
  "/dashboard/rental/invoices",
  "/dashboard/guests".replace("guests", "front-desk/guests"),
  "/dashboard/reservations".replace("reservations", "front-desk/calendar"),
  "/dashboard/ota",
  "/dashboard/pricing",
  "/dashboard/loyalty",
  "/dashboard/tickets",
  "/dashboard/rooms-inventory",
  "/dashboard/settings/branding",
  "/dashboard/admin/features",
];

async function main() {
  const TC = (process.argv[2] || "NIVESH").toUpperCase();
  const cookie = await tenantLogin("superadmin@ehms.demo", "Demo@1234", TC);
  const results = [];
  for (const route of [...new Set(routes)]) {
    const res = await fetch(`${BASE}${route}`, { headers: { cookie } });
    const finalUrl = res.url || "";
    const redirected = finalUrl && !finalUrl.endsWith(route) && !finalUrl.endsWith(route + "/");
    const text = await res.text();
    // A real 404 is a server-rendered not-found page (non-200 + noindex title).
    // The "This page could not be found" string also appears in the RSC flight
    // payload as the preloaded global-not-found boundary on healthy 200 pages,
    // so it must NOT be used as an error signal.
    const isErrorPage = res.status >= 400 && (text.includes("noindex") || text.includes("<title>404:"));
    const ok = res.status === 200 && !redirected && !isErrorPage;
    results.push({ route, status: res.status, ok, redirected, isErrorPage });
    console.log(`${ok ? "✅" : "❌"} [${res.status}] ${route}${redirected ? " -> redirected" : ""}${isErrorPage ? " (error page)" : ""}`);
  }
  const fails = results.filter((r) => !r.ok);
  console.log(`\nUI routes: ${results.length - fails.length}/${results.length} OK`);
  if (fails.length) { console.log("Failing:"); fails.forEach((f) => console.log("  ", f.route, f.status)); process.exitCode = 1; }
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
