import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 01: Front Desk & Guest Operations", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.frontDesk.email,
      DEMO_USERS.frontDesk.password,
      "VISWA",
      "hotels"
    );
  });

  test("01.1 Command Center - KPI Cards & LIVE Feed", async ({ page }) => {
    await page.goto("/dashboard/front-desk", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("h1, h2, h3").first()).toContainText(/Command Center|Front Desk|Arrivals/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("02.2 Reservation Calendar View", async ({ page }) => {
    await page.goto("/dashboard/front-desk/calendar", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Calendar|Reservations|Room/i);
  });

  test("01.3 Guest Profiles Directory & Search", async ({ page }) => {
    await page.goto("/dashboard/front-desk/guests", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Guest|Profiles|History/i);
  });

  test("01.4 Check-Ins & Arrival Board", async ({ page }) => {
    await page.goto("/dashboard/front-desk/check-ins", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Check-In|Arrivals|Due/i);
  });

  test("01.5 Billing & Guest Folio Ledger", async ({ page }) => {
    await page.goto("/dashboard/front-desk/billing", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Billing|Folio|Ledger|Invoices/i);
  });

  test("01.6 F&B / Room Pantry Ordering", async ({ page }) => {
    await page.goto("/dashboard/front-desk/f-and-b", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/F&B|Pantry|Menu|Order/i);
  });

  test("01.7 Guest Service Requests", async ({ page }) => {
    await page.goto("/dashboard/front-desk/requests", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Requests|Concierge|Service/i);
  });

  test("01.8 Guest Feedbacks & Ratings", async ({ page }) => {
    await page.goto("/dashboard/front-desk/feedbacks", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Feedback|Rating|Review/i);
  });

  test("01.9 Self Check-In & Check-Out Screens", async ({ page }) => {
    await page.goto("/dashboard/front-desk/checkin", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    await expect(page.locator("body")).toContainText(/Self Check-In|QR|Registration/i);

    await page.goto("/dashboard/front-desk/checkout", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    await expect(page.locator("body")).toContainText(/Self Check-Out|Key Return|Express/i);
  });
});
