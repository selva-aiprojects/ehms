import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 03: Apartment Long-Term Rental Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.propertyManager.email,
      DEMO_USERS.propertyManager.password,
      "VISWA",
      "rental"
    );
  });

  test("03.1 Rental Properties Dashboard", async ({ page }) => {
    await page.goto("/dashboard/rental", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Rental|Leased|Tenants/i);
  });

  test("03.2 Lease Agreements Management", async ({ page }) => {
    await page.goto("/dashboard/rental/leases", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Lease|Agreements|Tenant/i);
  });

  test("03.3 Monthly Rent Invoices", async ({ page }) => {
    await page.goto("/dashboard/rental/invoices", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Invoices|Rent|Billing/i);
  });

  test("03.4 Security Deposits Tracking", async ({ page }) => {
    await page.goto("/dashboard/rental/deposits", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Deposits|Refund|Balance/i);
  });
});
