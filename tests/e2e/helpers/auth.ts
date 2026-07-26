import { type Page, type BrowserContext, expect } from "@playwright/test";

export const DEMO_USERS = {
  superAdmin: { email: "raghu.superadmin@ehms.demo", password: "Demo@1234", role: "super_admin" },
  vishwaAdmin: { email: "vishwa.superadmin@ehms.demo", password: "Demo@1234", role: "super_admin" },
  executive: { email: "executive@ehms.demo", password: "Demo@1234", role: "executive" },
  propertyManager: { email: "admin@ehms.demo", password: "Demo@1234", role: "property_manager" },
  frontDesk: { email: "frontdesk@ehms.demo", password: "Demo@1234", role: "front_desk" },
  housekeeping: { email: "housekeeping@ehms.demo", password: "Demo@1234", role: "housekeeping_staff" },
  maintenance: { email: "maintenance@ehms.demo", password: "Demo@1234", role: "maintenance_staff" },
  hr: { email: "hr@ehms.demo", password: "Demo@1234", role: "hr_manager" },
  finance: { email: "finance@ehms.demo", password: "Demo@1234", role: "finance_manager" },
} as const;

export const PLATFORM_ADMIN = {
  email: "provider@ehms.demo",
  password: "Demo@1234",
} as const;

export const TENANT_CODE = "VISWA";

/**
 * Login as a tenant user via /login?tenant=CODE
 * Uses domcontentloaded (not networkidle) to avoid HMR websocket hangs.
 */
export async function loginAsTenantUser(
  page: Page,
  userEmail: string,
  password: string,
  tenantCode: string = TENANT_CODE,
  journey: string = "all"
): Promise<void> {
  await page.goto(`/login?tenant=${tenantCode}`, { waitUntil: "domcontentloaded" });

  // Wait for the email input to appear (page renders after tenant resolution)
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await page.waitForTimeout(500);

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill(userEmail);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);

  if (journey !== "all") {
    // After login, navigate to the specific vertical dashboard
    // The select dropdown has workspace names, not vertical keys
  }

  // Use force:true to bypass HMR-induced stability checks
  await page.locator('form button[type="submit"]').first().click({ force: true });

  await page.waitForURL(
    (url) => url.pathname.startsWith("/dashboard"),
    { timeout: 30000 }
  );
  await page.waitForLoadState("domcontentloaded");

  // If a specific journey was requested, navigate to its dashboard
  if (journey !== "all") {
    await page.goto(`/dashboard/${journey}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
  }
}

/**
 * Login as platform admin via the modal on /login page.
 * Uses domcontentloaded and force:true to handle dev server HMR.
 */
export async function loginAsPlatformAdmin(
  page: Page,
  email: string = PLATFORM_ADMIN.email,
  password: string = PLATFORM_ADMIN.password
): Promise<void> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  // Wait for the Platform Admin button (appears once tenantLoading is false)
  await page.waitForSelector("button:has-text('Platform Admin Sign In')", { timeout: 30000 });
  await page.waitForTimeout(500);

  const platformBtn = page.locator("button", { hasText: "Platform Admin Sign In" });
  await platformBtn.click({ force: true });

  // Wait for the modal's email input to appear
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  const plEmail = page.locator('input[type="email"]');
  await plEmail.fill(email);

  const plPassword = page.locator('input[type="password"]');
  await plPassword.fill(password);

  await page.locator('form button[type="submit"]').last().click({ force: true });

  await page.waitForURL("**/dashboard/admin/tenants", { timeout: 30000 });
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Login via demo autofill dropdown on tenant login form.
 */
export async function loginWithDemoAutofill(
  page: Page,
  demoOptionText: string,
  tenantCode: string = TENANT_CODE
): Promise<void> {
  await page.goto(`/login?tenant=${tenantCode}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('select', { timeout: 30000 });
  await page.waitForTimeout(500);

  const demoSelect = page.locator("select").last();
  await demoSelect.selectOption({ label: demoOptionText });

  await page.locator('form button[type="submit"]').first().click({ force: true });

  await page.waitForURL(
    (url) => url.pathname.startsWith("/dashboard"),
    { timeout: 30000 }
  );
  await page.waitForLoadState("domcontentloaded");
}

export async function logoutUser(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem("ehms_demo_session");
    localStorage.removeItem("ehms_tenant_verticals");
    localStorage.removeItem("ehms_tenant_name");
    localStorage.removeItem("ehms_active_journey");
    localStorage.removeItem("ehms_active_property_id");
  });
  await page.context().clearCookies();
  await page.goto("/login", { waitUntil: "domcontentloaded" });
}

export async function expectDashboardLoaded(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator("nav, aside, [class*='sidebar']")).toBeVisible({ timeout: 15000 });
}

export async function navigateSidebar(page: Page, label: string): Promise<void> {
  const link = page.locator(`a`, { hasText: label }).first();
  if (await link.isVisible({ timeout: 5000 })) {
    await link.click();
    await page.waitForLoadState("domcontentloaded");
  } else {
    const groupBtn = page.locator("button", { hasText: /Front Desk|Properties|Housekeeping|Maintenance|Finance|Human Resources|Administration|Procurement|Inventory|Revenue/ });
    for (const btn of await groupBtn.all()) {
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }
    const linkRetry = page.locator(`a`, { hasText: label }).first();
    await linkRetry.click();
    await page.waitForLoadState("domcontentloaded");
  }
}

export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1000);
}

export function generateRandomCode(length: number = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomSchema(): string {
  return "test_" + Math.random().toString(36).substring(2, 10);
}
