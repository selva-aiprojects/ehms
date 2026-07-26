# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 13-complete-workflow-certification.spec.ts >> COMPLETE WORKFLOW CERTIFICATION >> PHASE 0: Seed Data Verification & Platform Readiness >> CERT-009: 8+ employees seeded in HR
- Location: tests\e2e\13-complete-workflow-certification.spec.ts:138:9

# Error details

```
TimeoutError: page.waitForSelector: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]') to be visible
    11 × waiting for "http://localhost:3000/login?tenant=VISWA" navigation to finish...
       - navigated to "http://localhost:3000/login?tenant=VISWA"
    - waiting for navigation to finish...
    7 × navigated to "http://localhost:3000/login?tenant=VISWA"
      - waiting for "http://localhost:3000/login?tenant=VISWA" navigation to finish...
    - navigated to "http://localhost:3000/login?tenant=VISWA"

```

# Page snapshot

```yaml
- paragraph [ref=f75e5]: Loading organization...
```

# Test source

```ts
  1   | import { type Page, type BrowserContext, expect } from "@playwright/test";
  2   | 
  3   | export const DEMO_USERS = {
  4   |   superAdmin: { email: "raghu.superadmin@ehms.demo", password: "Demo@1234", role: "super_admin" },
  5   |   vishwaAdmin: { email: "vishwa.superadmin@ehms.demo", password: "Demo@1234", role: "super_admin" },
  6   |   executive: { email: "executive@ehms.demo", password: "Demo@1234", role: "executive" },
  7   |   propertyManager: { email: "admin@ehms.demo", password: "Demo@1234", role: "property_manager" },
  8   |   frontDesk: { email: "frontdesk@ehms.demo", password: "Demo@1234", role: "front_desk" },
  9   |   housekeeping: { email: "housekeeping@ehms.demo", password: "Demo@1234", role: "housekeeping_staff" },
  10  |   maintenance: { email: "maintenance@ehms.demo", password: "Demo@1234", role: "maintenance_staff" },
  11  |   hr: { email: "hr@ehms.demo", password: "Demo@1234", role: "hr_manager" },
  12  |   finance: { email: "finance@ehms.demo", password: "Demo@1234", role: "finance_manager" },
  13  | } as const;
  14  | 
  15  | export const PLATFORM_ADMIN = {
  16  |   email: "provider@ehms.demo",
  17  |   password: "Demo@1234",
  18  | } as const;
  19  | 
  20  | export const TENANT_CODE = "VISWA";
  21  | 
  22  | /**
  23  |  * Login as a tenant user via /login?tenant=CODE
  24  |  * Uses domcontentloaded (not networkidle) to avoid HMR websocket hangs.
  25  |  */
  26  | export async function loginAsTenantUser(
  27  |   page: Page,
  28  |   userEmail: string,
  29  |   password: string,
  30  |   tenantCode: string = TENANT_CODE,
  31  |   journey: string = "all"
  32  | ): Promise<void> {
  33  |   await page.goto(`/login?tenant=${tenantCode}`, { waitUntil: "domcontentloaded" });
  34  | 
  35  |   // Wait for the email input to appear (page renders after tenant resolution)
> 36  |   await page.waitForSelector('input[type="email"]', { timeout: 30000 });
      |              ^ TimeoutError: page.waitForSelector: Timeout 30000ms exceeded.
  37  |   await page.waitForTimeout(500);
  38  | 
  39  |   const emailInput = page.locator('input[type="email"]').first();
  40  |   await emailInput.fill(userEmail);
  41  | 
  42  |   const passwordInput = page.locator('input[type="password"]').first();
  43  |   await passwordInput.fill(password);
  44  | 
  45  |   if (journey !== "all") {
  46  |     // After login, navigate to the specific vertical dashboard
  47  |     // The select dropdown has workspace names, not vertical keys
  48  |   }
  49  | 
  50  |   // Use force:true to bypass HMR-induced stability checks
  51  |   await page.locator('form button[type="submit"]').first().click({ force: true });
  52  | 
  53  |   await page.waitForURL(
  54  |     (url) => url.pathname.startsWith("/dashboard"),
  55  |     { timeout: 30000 }
  56  |   );
  57  |   await page.waitForLoadState("domcontentloaded");
  58  | 
  59  |   // If a specific journey was requested, navigate to its dashboard
  60  |   if (journey !== "all") {
  61  |     await page.goto(`/dashboard/${journey}`, { waitUntil: "domcontentloaded" });
  62  |     await page.waitForTimeout(1000);
  63  |   }
  64  | }
  65  | 
  66  | /**
  67  |  * Login as platform admin via the modal on /login page.
  68  |  * Uses domcontentloaded and force:true to handle dev server HMR.
  69  |  */
  70  | export async function loginAsPlatformAdmin(
  71  |   page: Page,
  72  |   email: string = PLATFORM_ADMIN.email,
  73  |   password: string = PLATFORM_ADMIN.password
  74  | ): Promise<void> {
  75  |   await page.goto("/login", { waitUntil: "domcontentloaded" });
  76  | 
  77  |   // Wait for the Platform Admin button (appears once tenantLoading is false)
  78  |   await page.waitForSelector("button:has-text('Platform Admin Sign In')", { timeout: 30000 });
  79  |   await page.waitForTimeout(500);
  80  | 
  81  |   const platformBtn = page.locator("button", { hasText: "Platform Admin Sign In" });
  82  |   await platformBtn.click({ force: true });
  83  | 
  84  |   // Wait for the modal's email input to appear
  85  |   await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  86  | 
  87  |   const plEmail = page.locator('input[type="email"]');
  88  |   await plEmail.fill(email);
  89  | 
  90  |   const plPassword = page.locator('input[type="password"]');
  91  |   await plPassword.fill(password);
  92  | 
  93  |   await page.locator('form button[type="submit"]').last().click({ force: true });
  94  | 
  95  |   await page.waitForURL("**/dashboard/admin/tenants", { timeout: 30000 });
  96  |   await page.waitForLoadState("domcontentloaded");
  97  | }
  98  | 
  99  | /**
  100 |  * Login via demo autofill dropdown on tenant login form.
  101 |  */
  102 | export async function loginWithDemoAutofill(
  103 |   page: Page,
  104 |   demoOptionText: string,
  105 |   tenantCode: string = TENANT_CODE
  106 | ): Promise<void> {
  107 |   await page.goto(`/login?tenant=${tenantCode}`, { waitUntil: "domcontentloaded" });
  108 |   await page.waitForSelector('select', { timeout: 30000 });
  109 |   await page.waitForTimeout(500);
  110 | 
  111 |   const demoSelect = page.locator("select").last();
  112 |   await demoSelect.selectOption({ label: demoOptionText });
  113 | 
  114 |   await page.locator('form button[type="submit"]').first().click({ force: true });
  115 | 
  116 |   await page.waitForURL(
  117 |     (url) => url.pathname.startsWith("/dashboard"),
  118 |     { timeout: 30000 }
  119 |   );
  120 |   await page.waitForLoadState("domcontentloaded");
  121 | }
  122 | 
  123 | export async function logoutUser(page: Page): Promise<void> {
  124 |   await page.evaluate(() => {
  125 |     localStorage.removeItem("ehms_demo_session");
  126 |     localStorage.removeItem("ehms_tenant_verticals");
  127 |     localStorage.removeItem("ehms_tenant_name");
  128 |     localStorage.removeItem("ehms_active_journey");
  129 |     localStorage.removeItem("ehms_active_property_id");
  130 |   });
  131 |   await page.context().clearCookies();
  132 |   await page.goto("/login", { waitUntil: "domcontentloaded" });
  133 | }
  134 | 
  135 | export async function expectDashboardLoaded(page: Page): Promise<void> {
  136 |   await expect(page).toHaveURL(/\/dashboard/);
```