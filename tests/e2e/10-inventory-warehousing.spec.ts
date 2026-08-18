import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 10: Inventory & Stock Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.propertyManager.email,
      DEMO_USERS.propertyManager.password,
      "VISWA",
      "hotels"
    );
  });

  test("10.1 Inventory Overview Dashboard", async ({ page }) => {
    await page.goto("/dashboard/inventory", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Inventory|Stock|Valuation|Items/i);
  });

  test("10.2 Master Item Catalog", async ({ page }) => {
    await page.goto("/dashboard/inventory/items", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Items|SKU|Barcode|UOM|Category/i);
  });

  test("10.3 Multi-Warehouse Storage Locations", async ({ page }) => {
    await page.goto("/dashboard/inventory/warehouses", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Warehouses|Storage|Store|Locations/i);
  });

  test("10.4 Stock Transactions (Inward/Outward/Transfer)", async ({ page }) => {
    await page.goto("/dashboard/inventory/transactions", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Transactions|Issue|Transfer|Adjustment/i);
  });

  test("10.5 Inventory Categories Management", async ({ page }) => {
    await page.goto("/dashboard/inventory/categories", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Categories|Taxonomy|Hierarchy/i);
  });
});
