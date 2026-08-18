import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 04: Workplace & Facility Services Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.superAdmin.email,
      DEMO_USERS.superAdmin.password,
      "VISWA",
      "workplace"
    );
  });

  test("04.1 Workplace & Co-Working Dashboard", async ({ page }) => {
    await page.goto("/dashboard/workplace", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Workplace|Desks|Facility|Members/i);
  });

  test("04.2 Co-Working Memberships & Subscriptions", async ({ page }) => {
    await page.goto("/dashboard/workplace/memberships", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Memberships|Subscriptions|Plans/i);
  });

  test("04.3 Visitor Pass & Security Log", async ({ page }) => {
    await page.goto("/dashboard/workplace/visitors", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Visitors|Pass|Host|Security/i);
  });
});
