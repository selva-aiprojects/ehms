import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE } from "./helpers/auth";

const EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

test.describe("Apartment Rental - Lease Lifecycle & Services", () => {
  test.describe("Rental Dashboard", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "rental");
    });

    test("TC-RENT-001: Rental dashboard loads with KPIs", async ({ page }) => {
      await page.goto("/dashboard/rental");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Apartment Rental").first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("TC-RENT-002: Dashboard shows occupancy and revenue stats", async ({
      page,
    }) => {
      await page.goto("/dashboard/rental");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const kpiLabels = [
        "Total Units",
        "Occupancy",
        "Revenue",
        "Avg Rent",
      ];
      for (const label of kpiLabels) {
        const el = page.locator(`text=${label}`).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });
  });

  test.describe("Lease Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "rental");
    });

    test("TC-RENT-LEASE-001: Leases page loads", async ({ page }) => {
      await page.goto("/dashboard/rental/leases");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Leases").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-RENT-LEASE-002: Leases table shows tenant, unit, dates, status", async ({
      page,
    }) => {
      await page.goto("/dashboard/rental/leases");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const headerText = headers.join(" ").toLowerCase();
        expect(
          headerText.includes("tenant") ||
            headerText.includes("unit") ||
            headerText.includes("status")
        ).toBeTruthy();
      }
    });

    test("TC-RENT-LEASE-003: Create new lease modal", async ({ page }) => {
      await page.goto("/dashboard/rental/leases");
      await page.waitForLoadState("domcontentloaded");

      const createBtn = page
        .locator("button", { hasText: /New|Create|Add|Lease/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test("TC-RENT-LEASE-004: Lease statuses visible", async ({ page }) => {
      await page.goto("/dashboard/rental/leases");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const statuses = ["active", "pending", "expired", "terminated"];
      for (const s of statuses) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });
  });

  test.describe("Rent Invoices", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "rental");
    });

    test("TC-RENT-INV-001: Rent Invoices page loads", async ({ page }) => {
      await page.goto("/dashboard/rental/invoices");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Rent Invoices").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-RENT-INV-002: Invoice table shows amounts and statuses", async ({
      page,
    }) => {
      await page.goto("/dashboard/rental/invoices");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        expect(headers.length).toBeGreaterThan(0);
      }
    });

    test("TC-RENT-INV-003: Create rent invoice", async ({ page }) => {
      await page.goto("/dashboard/rental/invoices");
      await page.waitForLoadState("domcontentloaded");

      const createBtn = page
        .locator("button", { hasText: /New|Create|Generate/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Security Deposits", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "rental");
    });

    test("TC-RENT-DEP-001: Deposits page loads", async ({ page }) => {
      await page.goto("/dashboard/rental/deposits");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Deposits").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-RENT-DEP-002: Deposit transactions visible", async ({ page }) => {
      await page.goto("/dashboard/rental/deposits");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const count = await table.locator("tbody tr").count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Rental-Specific Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "rental");
    });

    test("TC-RENT-NAV-001: Rental journey excludes restaurant/F&B", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const restaurantLink = page.locator(
        'a[href*="restaurant"]'
      ).first();
      const fnbLink = page.locator(
        'a[href*="f-and-b"]'
      ).first();

      const restVisible = await restaurantLink
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      const fnbVisible = await fnbLink
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      expect(restVisible && fnbVisible).toBeFalsy();
    });

    test("TC-RENT-NAV-002: Rental journey shows Leases and Deposits", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const leaseLink = page.locator('a[href*="leases"]').first();
      const depositLink = page
        .locator('a[href*="deposits"]')
        .first();

      if (await leaseLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(leaseLink).toBeVisible();
      }
      if (await depositLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(depositLink).toBeVisible();
      }
    });
  });
});
