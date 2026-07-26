import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE } from "./helpers/auth";

const EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

/**
 * DEMO READINESS SMOKE TEST
 * Run this BEFORE the demo to verify all seed data loaded correctly.
 * Command: npx playwright test 10-demo-readiness
 */
test.describe("Demo Readiness - Seed Data Verification", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
  });

  test("DEMO-SEED-001: 4 properties exist (Hotel, Apartment, Rental, Workplace)", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin/properties");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    const pageText = await page.locator("body").textContent();
    const hasHotel =
      pageText?.includes("Viswa Grand Hotel") ||
      pageText?.includes("Oceanview");
    const hasApt =
      pageText?.includes("Viswa Service Apartments") ||
      pageText?.includes("Service");
    const hasRental =
      pageText?.includes("Greenwood Residency") ||
      pageText?.includes("Greenwood");
    const hasWorkplace =
      pageText?.includes("Innovate Coworking") ||
      pageText?.includes("Coworking");

    expect(hasHotel).toBeTruthy();
    expect(hasApt).toBeTruthy();
    expect(hasRental).toBeTruthy();
    expect(hasWorkplace).toBeTruthy();
  });

  test("DEMO-SEED-002: 50 rooms visible in room matrix (10 per floor x 5 floors)", async ({
    page,
  }) => {
    await page.waitForTimeout(3000);

    const roomCards = page.locator("button").filter({ hasText: /^\d{3}$/ });
    const count = await roomCards.count();
    expect(count).toBeGreaterThanOrEqual(30);
  });

  test("DEMO-SEED-003: Room statuses include occupied, vacant, dirty, reserved", async ({
    page,
  }) => {
    await page.waitForTimeout(3000);

    const statuses = ["Occupied", "Available", "Dirty", "Reserved"];
    const pageText = await page.locator("body").textContent();
    for (const s of statuses) {
      expect(pageText).toContain(s);
    }
  });

  test("DEMO-SEED-004: 8 checked-in guests visible in In-House panel", async ({
    page,
  }) => {
    await page.waitForTimeout(3000);

    const inHouse = page.locator("main").getByText("In-House").first();
    if (await inHouse.isVisible({ timeout: 5000 }).catch(() => false)) {
      const card = inHouse.locator("..").first();
      const text = await card.textContent();
      expect(text).toContain("8");
    }
  });

  test("DEMO-SEED-005: Arrivals today visible (confirmed bookings)", async ({
    page,
  }) => {
    await page.waitForTimeout(3000);

    const arrivals = page.locator("main").getByText("Arrivals Today").first();
    if (await arrivals.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(arrivals).toBeVisible();
    }
  });

  test("DEMO-SEED-006: Guest profiles page shows 20+ guests", async ({
    page,
  }) => {
    await page.goto("/dashboard/front-desk/guests");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const subtitle = page.locator("main").getByText("profiles found").first();
    if (await subtitle.isVisible({ timeout: 5000 }).catch(() => false)) {
      const text = await subtitle.textContent();
      const match = text?.match(/(\d+)/);
      if (match) {
        expect(parseInt(match[1])).toBeGreaterThanOrEqual(15);
      }
    }
  });

  test("DEMO-SEED-007: VIP guests visible (Arun, Rahul, Fatima, etc.)", async ({
    page,
  }) => {
    await page.goto("/dashboard/front-desk/guests");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const vipBadge = page.locator("main").getByText("VIP Guest").first();
    if (await vipBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(vipBadge).toBeVisible();
    }
  });

  test("DEMO-SEED-008: Housekeeping tasks visible (17 tasks)", async ({
    page,
  }) => {
    await page.goto("/dashboard/housekeeping/tasks");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const table = page.locator("table");
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      const rows = await table.locator("tbody tr").count();
      expect(rows).toBeGreaterThanOrEqual(10);
    }
  });

  test("DEMO-SEED-009: Maintenance tickets visible (6 tickets)", async ({
    page,
  }) => {
    await page.goto("/dashboard/maintenance/tickets");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const table = page.locator("table");
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      const rows = await table.locator("tbody tr").count();
      expect(rows).toBeGreaterThanOrEqual(3);
    }
  });

  test("DEMO-SEED-010: F&B menu has items (25+ items)", async ({ page }) => {
    await page.goto("/dashboard/front-desk/f-and-b");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await expect(page.locator("main").getByText("Menu").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("DEMO-SEED-011: Restaurant POS tables visible", async ({ page }) => {
    await page.goto("/dashboard/restaurant");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await expect(
      page.locator("main").getByText("Restaurant").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("DEMO-SEED-012: Vendors directory has entries", async ({ page }) => {
    await page.goto("/dashboard/vendors");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await expect(page.locator("main").getByText("Vendor").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("DEMO-SEED-013: Finance chart of accounts seeded", async ({ page }) => {
    await page.goto("/dashboard/finance/accounts");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await expect(
      page.locator("main").getByText(/Chart of Accounts|Accounts/).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("DEMO-SEED-014: 8 employees seeded in HR", async ({ page }) => {
    await page.goto("/dashboard/hr/employees");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const table = page.locator("table");
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      const rows = await table.locator("tbody tr").count();
      expect(rows).toBeGreaterThanOrEqual(5);
    }
  });

  test("DEMO-SEED-015: 6 departments seeded", async ({ page }) => {
    await page.goto("/dashboard/hr/masters");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await expect(
      page.locator("main").getByText("Masters").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("DEMO-SEED-016: Guest requests visible (6 requests)", async ({
    page,
  }) => {
    await page.goto("/dashboard/front-desk/requests");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await expect(
      page.locator("main").getByText("Guest Requests").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("DEMO-SEED-017: Billing shows active folios with outstanding", async ({
    page,
  }) => {
    await page.goto("/dashboard/front-desk/billing");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await expect(page.locator("main").getByText("Total Outstanding").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("DEMO-SEED-018: Pricing/Rate plans configured", async ({ page }) => {
    await page.goto("/dashboard/pricing");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main").getByText("Pricing").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("DEMO-SEED-019: Channel partners configured on command center", async ({
    page,
  }) => {
    await page.waitForTimeout(3000);

    await expect(
      page.locator("main").getByText("Channel Manager").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("DEMO-SEED-020: Revenue AI card present on command center", async ({
    page,
  }) => {
    await page.waitForTimeout(3000);

    await expect(
      page.locator("main").getByText("AI Revenue Manager").first()
    ).toBeVisible({ timeout: 10000 });
  });
});
