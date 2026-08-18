import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 12: Restaurant POS & Kitchen Operations", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.frontDesk.email,
      DEMO_USERS.frontDesk.password,
      "VISWA",
      "hotels"
    );
  });

  test("12.1 Restaurant Touchscreen POS & Dining Tables", async ({ page }) => {
    await page.goto("/dashboard/restaurant", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Restaurant|POS|Table|Order/i);
  });

  test("12.2 Kitchen Display System (KDS)", async ({ page }) => {
    await page.goto("/dashboard/restaurant/kds", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/KDS|Kitchen|Display|Orders/i);
  });

  test("12.3 Menu Management & Categories", async ({ page }) => {
    await page.goto("/dashboard/restaurant/menu", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Menu|Dishes|Categories|Price/i);
  });
});
