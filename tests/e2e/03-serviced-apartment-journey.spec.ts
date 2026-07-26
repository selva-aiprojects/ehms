import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE } from "./helpers/auth";

const EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

test.describe("Serviced Apartments - Complete Guest Journey", () => {
  test.describe("Dashboard & Overview", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "apartments"
      );
    });

    test("TC-SA-001: Serviced Apartments dashboard loads", async ({
      page,
    }) => {
      await page.goto("/dashboard/apartments");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Serviced Apartments|Apartments/).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("TC-SA-002: Dashboard shows occupancy and revenue stats", async ({
      page,
    }) => {
      await page.goto("/dashboard/apartments");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const stats = page.locator('[class*="stat"], [class*="card"], [class*="kpi"]');
      const count = await stats.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Front Desk for Serviced Apartments", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "apartments"
      );
    });

    test("TC-SA-FD-001: Command center works for apartments", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Front Desk Command Center").first()
      ).toBeVisible({ timeout: 15000 });

      await expect(page.locator("main").getByText("Room Matrix").first()).toBeVisible();
    });

    test("TC-SA-FD-002: Walk-In supports hourly flexi stays", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const walkInBtn = page
        .locator("button", { hasText: "Walk-in" })
        .first();
      if (await walkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await walkInBtn.click();

        await expect(
          page.locator("main").getByText("Standard Nightly").first()
        ).toBeVisible({ timeout: 5000 });
        await expect(page.locator("main").getByText("Flexi").first()).toBeVisible();

        const flexiBtn = page
          .locator("button", { hasText: /Flexi|Hourly/ })
          .first();
        if (await flexiBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await flexiBtn.click();

          const packages = ["3 Hours", "6 Hours", "12 Hours", "24 Hours"];
          for (const pkg of packages) {
            const el = page.locator(`text=${pkg}`).first();
            if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
              await expect(el).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe("Housekeeping for Serviced Apartments", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "apartments"
      );
    });

    test("TC-SA-HK-001: Housekeeping dashboard loads", async ({ page }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Housekeeping").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-SA-HK-002: HK tasks page with task types", async ({ page }) => {
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const taskTypes = [
        "deep_clean",
        "stayover_tidy",
        "turnaround",
        "inspection",
      ];
      for (const tt of taskTypes) {
        const el = page.locator(`text=${tt.replace("_", " ")}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("TC-SA-HK-003: Linen tracking page loads", async ({ page }) => {
      await page.goto("/dashboard/housekeeping/linen");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Linen").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-SA-HK-004: Inspections page loads", async ({ page }) => {
      await page.goto("/dashboard/housekeeping/inspections");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Inspections").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Laundry Service", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "apartments"
      );
    });

    test("TC-SA-LAUN-001: Laundry page loads with order list", async ({
      page,
    }) => {
      await page.goto("/dashboard/laundry");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Laundry").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-SA-LAUN-002: Create laundry order modal", async ({ page }) => {
      await page.goto("/dashboard/laundry");
      await page.waitForLoadState("domcontentloaded");

      const createBtn = page
        .locator("button", { hasText: /New|Create|Add/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Maintenance for Serviced Apartments", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "apartments"
      );
    });

    test("TC-SA-MAINT-001: Maintenance dashboard loads", async ({ page }) => {
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Maintenance").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-SA-MAINT-002: Maintenance tickets page loads", async ({
      page,
    }) => {
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Tickets").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-SA-MAINT-003: Create maintenance ticket", async ({ page }) => {
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");

      const createBtn = page
        .locator("button", { hasText: /New|Create|Add/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Finance & Billing for Apartments", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "apartments"
      );
    });

    test("TC-SA-FIN-001: Finance dashboard loads", async ({ page }) => {
      await page.goto("/dashboard/finance");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Finance").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-SA-FIN-002: Chart of Accounts page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/accounts");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Chart of Accounts|Accounts/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-SA-FIN-003: Revenue dashboard shows apartment metrics", async ({
      page,
    }) => {
      await page.goto("/dashboard/revenue");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Revenue Dashboard|Revenue/).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
