import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 05: Housekeeping Operations", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.housekeeping.email,
      DEMO_USERS.housekeeping.password,
      "VISWA",
      "hotels"
    );
  });

  test("05.1 Housekeeping Dashboard & Room Status Matrix", async ({ page }) => {
    await page.goto("/dashboard/housekeeping", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Housekeeping|Clean|Dirty|Inspected/i);
  });

  test("05.2 HK Cleaning Tasks Dispatch", async ({ page }) => {
    await page.goto("/dashboard/housekeeping/tasks", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Tasks|Attendant|Priority/i);
  });

  test("05.3 Linen & Supplies Management", async ({ page }) => {
    await page.goto("/dashboard/housekeeping/linen", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Linen|Laundry|Towels|Bedding/i);
  });

  test("05.4 Supervisor Quality Inspections", async ({ page }) => {
    await page.goto("/dashboard/housekeeping/inspections", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Inspections|Quality|Checklist/i);
  });

  test("05.5 HK Staff Roster & Performance", async ({ page }) => {
    await page.goto("/dashboard/housekeeping/staff", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Staff|Performance|Attendants/i);
  });
});
