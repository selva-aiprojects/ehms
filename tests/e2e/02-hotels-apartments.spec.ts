import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 02: Hotels & Serviced Apartments Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.propertyManager.email,
      DEMO_USERS.propertyManager.password,
      "VISWA",
      "hotels"
    );
  });

  test("02.1 Hotels Overview Dashboard", async ({ page }) => {
    await page.goto("/dashboard/hotels", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Hotel|Properties|Capacity/i);
  });

  test("02.2 Serviced Apartments Dashboard", async ({ page }) => {
    await page.goto("/dashboard/apartments", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Apartment|Serviced|Units/i);
  });

  test("02.3 Rooms & Units Inventory Grid", async ({ page }) => {
    await page.goto("/dashboard/rooms-inventory", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Rooms|Units|Status|Category/i);
  });

  test("02.4 Rate Cards & Pricing Rules", async ({ page }) => {
    await page.goto("/dashboard/pricing", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Pricing|Rate Card|Tariff|Rules/i);
  });

  test("02.5 Property Workspace Configuration", async ({ page }) => {
    await page.goto("/dashboard/admin/properties", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Properties|Workspaces|Configuration/i);
  });
});
