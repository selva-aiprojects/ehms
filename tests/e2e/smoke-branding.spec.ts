import {
  test,
  expect,
  type Page,
  type Locator,
  type BrowserContext,
  type ConsoleMessage,
} from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, TENANT_CODE } from "./helpers/auth";

const BRAND_NAVY_RGB = "rgb(37, 82, 48)";      // #255230
const SIDEBAR_DARK_RGB = "rgb(15, 23, 42)";    // #0F172A
const LEGACY_HEXES = [
  "#2bae8e", "#4db88a", "#d4a853", "#f5a623", "#e53e3e",
  "#1a3c5e", "#2c3547", "#0b1a2e", "#0f2438",
];

const CONSOLE_NOISE = [
  /favicon/i,
  /webpack-hmr/i,
  /ERR_INVALID_HTTP_RESPONSE/i,
  /ERR_ABORTED/i,
  /ERR_INSUFFICIENT_RESOURCES/i,
  /React DevTools/i,
  /download the react devtools/i,
  /Failed to load resource: the server responded with a status of 403/i,
];

// Platform-only APIs that tenant users may hit via shared /dashboard/admin/* routes.
// They intentionally 403 for non-platform admins (pre-existing behavior).
const BAD_RESPONSE_ALLOWLIST = [
  "/api/admin/tickets",
  "/api/admin/broadcasts",
];

function isNoise(text: string): boolean {
  return CONSOLE_NOISE.some((r) => r.test(text));
}

async function safeGoto(page: Page, path: string): Promise<void> {
  const TRANSIENT = /ERR_ABORTED|ERR_INVALID_HTTP_RESPONSE|ERR_CONNECTION_RESET|ERR_INSUFFICIENT_RESOURCES/i;
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
      return;
    } catch (err) {
      lastError = err as Error;
      if (!TRANSIENT.test(lastError.message)) throw err;
      await page.waitForTimeout(1500 * attempt);
    }
  }
  throw lastError;
}

async function assertSidebarBrandNavy(page: Page, sidebar: Locator, path: string): Promise<void> {
  const deadline = Date.now() + 10_000;
  let bg = "";
  while (Date.now() < deadline) {
    bg = await sidebar.evaluate((el) => getComputedStyle(el).backgroundColor);
    if ([BRAND_NAVY_RGB, SIDEBAR_DARK_RGB].includes(bg)) return;
    await page.waitForTimeout(250);
  }
  throw new Error(`sidebar background navy on ${path} (got "${bg}")`);
}

async function assertBrandedDashboard(page: Page, path: string): Promise<void> {
  const consoleErrors: string[] = [];
  const pageErrors: Error[] = [];
  const badResponses: string[] = [];

  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === "error" && !isNoise(msg.text())) consoleErrors.push(msg.text());
  };
  const onPageError = (err: Error) => pageErrors.push(err);
  const onResponse = (res: { status: () => number; url: () => string }) => {
    if (res.status() >= 400) {
      const url = res.url();
      if (BAD_RESPONSE_ALLOWLIST.some((p) => url.includes(p))) return;
      if (/favicon/i.test(url)) return;
      badResponses.push(`${res.status()} ${url}`);
    }
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);

  try {
    await safeGoto(page, path);
    await page.waitForSelector("main", { timeout: 30_000 });
    expect(new URL(page.url()).pathname, `final URL for ${path}`).toBe(path);

    const sidebar = page.locator("aside.sidebar:visible").first();
    await expect(sidebar, `sidebar visible on ${path}`).toBeVisible();

    const logo = sidebar.locator("img").first();
    await expect(logo, `sidebar logo visible on ${path}`).toBeVisible();
    const logoSrc = await logo.getAttribute("src");
    expect(logoSrc || "", `sidebar logo src on ${path}`).toContain("hostsphere-logo");

    await assertSidebarBrandNavy(page, sidebar, path);

    const bodyText = await page.locator("body").innerHTML();
    const lower = bodyText.toLowerCase();
    for (const hex of LEGACY_HEXES) {
      expect(lower, `legacy hex ${hex} on ${path}`).not.toContain(hex);
    }
    expect(lower, `legacy CybeHMS brand on ${path}`).not.toContain("cybehms");
    expect(lower, `legacy eHMS_logo on ${path}`).not.toContain("ehms_logo");

    expect(pageErrors, `JS exceptions on ${path}`).toEqual([]);
    expect(
      badResponses,
      `unexpected HTTP errors on ${path}:\n${badResponses.join("\n")}`
    ).toEqual([]);
    expect(
      consoleErrors,
      `console errors on ${path}:\n${consoleErrors.join("\n")}`
    ).toEqual([]);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
  }
}

const ADMIN_ROUTES = [
  "/dashboard/admin",
  "/dashboard/admin/audit",
  "/dashboard/admin/backup",
  "/dashboard/admin/broadcasts",
  "/dashboard/admin/compliance",
  "/dashboard/admin/masters",
  "/dashboard/admin/properties",
  "/dashboard/admin/roles",
  "/dashboard/admin/sessions",
  "/dashboard/admin/settings",
  "/dashboard/admin/tenants",
  "/dashboard/admin/users",
];

const FRONT_DESK_ROUTES = [
  "/dashboard/front-desk",
  "/dashboard/front-desk/billing",
  "/dashboard/front-desk/calendar",
  "/dashboard/front-desk/checkin",
  "/dashboard/front-desk/check-ins",
  "/dashboard/front-desk/checkout",
  "/dashboard/front-desk/f-and-b",
  "/dashboard/front-desk/feedbacks",
  "/dashboard/front-desk/guests",
  "/dashboard/front-desk/requests",
];

const HOUSEKEEPING_ROUTES = [
  "/dashboard/housekeeping",
  "/dashboard/housekeeping/inspections",
  "/dashboard/housekeeping/linen",
  "/dashboard/housekeeping/staff",
  "/dashboard/housekeeping/tasks",
];

const MAINTENANCE_ROUTES = [
  "/dashboard/maintenance",
  "/dashboard/maintenance/assets",
  "/dashboard/maintenance/parts",
  "/dashboard/maintenance/tickets",
];

const HR_ROUTES = [
  "/dashboard/hr",
  "/dashboard/hr/appraisal",
  "/dashboard/hr/compensation",
  "/dashboard/hr/compliance",
  "/dashboard/hr/employees",
  "/dashboard/hr/leave",
  "/dashboard/hr/masters",
  "/dashboard/hr/payroll",
  "/dashboard/hr/policies",
  "/dashboard/hr/settings",
  "/dashboard/hr/shifts",
  "/dashboard/hr/timesheet",
];

const FINANCE_ROUTES = [
  "/dashboard/finance",
  "/dashboard/finance/accounts",
  "/dashboard/finance/assets",
  "/dashboard/finance/budget",
  "/dashboard/finance/journal",
  "/dashboard/finance/ledger",
  "/dashboard/finance/payables",
  "/dashboard/finance/receivables",
  "/dashboard/finance/reconciliation",
  "/dashboard/finance/reports",
  "/dashboard/finance/settings",
  "/dashboard/finance/tax",
];

const INVENTORY_ROUTES = [
  "/dashboard/inventory",
  "/dashboard/inventory/categories",
  "/dashboard/inventory/items",
  "/dashboard/inventory/transactions",
  "/dashboard/inventory/warehouses",
];

const PROCUREMENT_VENDOR_ROUTES = [
  "/dashboard/procurement",
  "/dashboard/procurement/grn",
  "/dashboard/procurement/purchase-orders",
  "/dashboard/vendors",
  "/dashboard/vendors/orders",
  "/dashboard/vendors/services",
];

const RESTAURANT_LAUNDRY_ROUTES = [
  "/dashboard/restaurant",
  "/dashboard/restaurant/kds",
  "/dashboard/restaurant/menu",
  "/dashboard/laundry",
];

const OPS_REVENUE_ROUTES = [
  "/dashboard/ota",
  "/dashboard/pricing",
  "/dashboard/loyalty",
  "/dashboard/revenue",
  "/dashboard/revenue/ai",
  "/dashboard/whatsapp",
  "/dashboard/multi-property",
  "/dashboard/rooms-inventory",
  "/dashboard/settings/branding",
];

const VERTICAL_ROUTES = [
  "/dashboard/hotels",
  "/dashboard/apartments",
  "/dashboard/rental",
  "/dashboard/rental/deposits",
  "/dashboard/rental/invoices",
  "/dashboard/rental/leases",
];

let context: BrowserContext;
let page: Page;

async function robustLogin(target: Page): Promise<void> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await loginAsTenantUser(target, DEMO_USERS.superAdmin.email, DEMO_USERS.superAdmin.password, TENANT_CODE);
      return;
    } catch (err) {
      const msg = (err as Error).message;
      const hasNetworkError = await target
        .locator("text=Network error. Please try again.")
        .isVisible()
        .catch(() => false);
      const transient = /waitForURL|ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_ABORTED|ERR_INVALID_HTTP_RESPONSE/i;
      if (!hasNetworkError && !transient.test(msg)) throw err;
      await target.evaluate(() => localStorage.clear()).catch(() => {});
      await target.waitForTimeout(2000 * attempt);
    }
  }
  throw new Error("login failed after 4 retries");
}

test.describe.configure({ mode: "serial" });

test.describe("Branded dashboard smoke (super admin)", () => {
  test.setTimeout(180_000);

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await robustLogin(page);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("/dashboard home", async () => {
    await assertBrandedDashboard(page, "/dashboard");
  });

  test("Admin module renders branded", async () => {
    for (const route of ADMIN_ROUTES) await assertBrandedDashboard(page, route);
  });

  test("Front Desk module renders branded", async () => {
    for (const route of FRONT_DESK_ROUTES) await assertBrandedDashboard(page, route);
  });

  test("Housekeeping module renders branded", async () => {
    for (const route of HOUSEKEEPING_ROUTES) await assertBrandedDashboard(page, route);
  });

  test("Maintenance module renders branded", async () => {
    for (const route of MAINTENANCE_ROUTES) await assertBrandedDashboard(page, route);
  });

  test("HR module renders branded", async () => {
    for (const route of HR_ROUTES) await assertBrandedDashboard(page, route);
  });

  test("Finance module renders branded", async () => {
    for (const route of FINANCE_ROUTES) await assertBrandedDashboard(page, route);
  });

  test("Inventory module renders branded", async () => {
    for (const route of INVENTORY_ROUTES) await assertBrandedDashboard(page, route);
  });

  test("Procurement & Vendors render branded", async () => {
    for (const route of PROCUREMENT_VENDOR_ROUTES) await assertBrandedDashboard(page, route);
  });

  test("Restaurant & Laundry render branded", async () => {
    for (const route of RESTAURANT_LAUNDRY_ROUTES) await assertBrandedDashboard(page, route);
  });

  test("Operations / Revenue / Rooms render branded", async () => {
    for (const route of OPS_REVENUE_ROUTES) await assertBrandedDashboard(page, route);
  });

  test("Vertical dashboards render branded", async () => {
    for (const route of VERTICAL_ROUTES) await assertBrandedDashboard(page, route);
  });
});

test.describe("Public brand pages", () => {
  for (const route of ["/", "/login", "/tenants"]) {
    test(`${route} renders HostSphere brand`, async ({ page: publicPage }) => {
      const response = await publicPage.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      expect(response?.status(), `HTTP status for ${route}`).toBe(200);

      await expect(publicPage, `title on ${route}`).toHaveTitle(/HostSphere/);

      const logo = publicPage.locator("img").first();
      await expect(logo, `logo visible on ${route}`).toBeVisible();
      const src = await logo.getAttribute("src");
      expect(src || "", `logo src on ${route}`).toContain("hostsphere-logo");

      const bodyText = (await publicPage.locator("body").innerHTML()).toLowerCase();
      expect(bodyText, `legacy CybeHMS brand on ${route}`).not.toContain("cybehms");
      expect(bodyText, `legacy eHMS_logo on ${route}`).not.toContain("ehms_logo");
      for (const hex of LEGACY_HEXES) {
        expect(bodyText, `legacy hex ${hex} on ${route}`).not.toContain(hex);
      }
    });
  }
});
