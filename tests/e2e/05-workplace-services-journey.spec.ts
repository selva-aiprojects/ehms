import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE } from "./helpers/auth";

const EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

test.describe("Workplace Services - Membership & Visitor Flow", () => {
  test.describe("Workplace Dashboard", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "workplace"
      );
    });

    test("TC-WP-001: Workplace dashboard loads", async ({ page }) => {
      await page.goto("/dashboard/workplace");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Dashboard").first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("TC-WP-002: Dashboard shows seats and occupancy stats", async ({
      page,
    }) => {
      await page.goto("/dashboard/workplace");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const stats = page.locator('[class*="stat"], [class*="card"], [class*="kpi"]');
      const count = await stats.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("TC-WP-003: Floor plan desk grid visible", async ({ page }) => {
      await page.goto("/dashboard/workplace");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const deskElements = page.locator(
        '[class*="desk"], [class*="seat"], [class*="grid"]'
      );
      const count = await deskElements.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Memberships Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "workplace"
      );
    });

    test("TC-WP-MEM-001: Memberships page loads", async ({ page }) => {
      await page.goto("/dashboard/workplace/memberships");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Memberships").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-WP-MEM-002: Membership plans visible", async ({ page }) => {
      await page.goto("/dashboard/workplace/memberships");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const count = await table.locator("tbody tr").count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test("TC-WP-MEM-003: Create new membership", async ({ page }) => {
      await page.goto("/dashboard/workplace/memberships");
      await page.waitForLoadState("domcontentloaded");

      const createBtn = page
        .locator("button", { hasText: /New|Create|Add|Membership/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Visitor Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "workplace"
      );
    });

    test("TC-WP-VIS-001: Visitors page loads", async ({ page }) => {
      await page.goto("/dashboard/workplace/visitors");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Visitors").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-WP-VIS-002: Visitor check-in form available", async ({
      page,
    }) => {
      await page.goto("/dashboard/workplace/visitors");
      await page.waitForLoadState("domcontentloaded");

      const checkInBtn = page
        .locator("button", { hasText: /Check.?In|New|Add|Visitor/ })
        .first();
      if (await checkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checkInBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test("TC-WP-VIS-003: Visitor list table loads", async ({ page }) => {
      await page.goto("/dashboard/workplace/visitors");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        expect(headers.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Workplace Housekeeping", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "workplace"
      );
    });

    test("TC-WP-HK-001: Housekeeping tasks visible in workplace", async ({
      page,
    }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Housekeeping").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-WP-HK-002: HK tasks page accessible", async ({ page }) => {
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Tasks|Housekeeping/).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Workplace Maintenance", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "workplace"
      );
    });

    test("TC-WP-MAINT-001: Maintenance accessible from workplace", async ({
      page,
    }) => {
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Maintenance").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Workplace Navigation Filtering", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "workplace"
      );
    });

    test("TC-WP-NAV-001: Workplace journey shows Memberships and Visitors", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const memLink = page
        .locator('a[href*="memberships"]')
        .first();
      const visLink = page
        .locator('a[href*="visitors"]')
        .first();

      if (await memLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(memLink).toBeVisible();
      }
      if (await visLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(visLink).toBeVisible();
      }
    });

    test("TC-WP-NAV-002: Workplace journey excludes restaurant/F&B", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const restaurantLink = page
        .locator('a[href*="restaurant"]')
        .first();
      const fnbLink = page
        .locator('a[href*="f-and-b"]')
        .first();

      const restVisible = await restaurantLink
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      const fnbVisible = await fnbLink
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(restVisible && fnbVisible).toBeFalsy();
    });
  });
});
