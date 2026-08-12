import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 06: Maintenance & Asset Operations", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.maintenance.email,
      DEMO_USERS.maintenance.password,
      "VISWA",
      "hotels"
    );
  });

  test("06.1 Maintenance Dashboard & Open Work Orders", async ({ page }) => {
    await page.goto("/dashboard/maintenance", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Maintenance|Tickets|Work Orders|SLA/i);
  });

  test("06.2 Maintenance Tickets & Work Order Dispatch", async ({ page }) => {
    await page.goto("/dashboard/maintenance/tickets", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Tickets|Priority|Technician|Category/i);
  });

  test("06.3 Technical Spare Parts Inventory", async ({ page }) => {
    await page.goto("/dashboard/maintenance/parts", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Parts|Spare|Inventory|Stock/i);
  });

  test("06.4 Fixed Assets & Equipment History", async ({ page }) => {
    await page.goto("/dashboard/maintenance/assets", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Assets|Equipment|Registry|Warranty/i);
  });
});
