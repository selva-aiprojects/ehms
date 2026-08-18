import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 11: Revenue Management & AI Pricing", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.superAdmin.email,
      DEMO_USERS.superAdmin.password,
      "VISWA",
      "hotels"
    );
  });

  test("11.1 Dynamic Revenue Dashboard", async ({ page }) => {
    await page.goto("/dashboard/revenue", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Revenue|ADR|RevPAR|Occupancy/i);
  });

  test("11.2 AI Dynamic Pricing Engine", async ({ page }) => {
    await page.goto("/dashboard/revenue/ai", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/AI|Recommendations|Forecast|Rules/i);
  });

  test("11.3 Rate Cards & Multipliers", async ({ page }) => {
    await page.goto("/dashboard/pricing", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Pricing|Rate Card|Rules/i);
  });

  test("11.4 Guest Loyalty Program & Tiers", async ({ page }) => {
    await page.goto("/dashboard/loyalty", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Loyalty|Points|Tiers|Rewards/i);
  });

  test("11.5 OTA Channel Integration", async ({ page }) => {
    await page.goto("/dashboard/ota", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/OTA|Channels|Sync|MakeMyTrip|Booking/i);
  });

  test("11.6 WhatsApp Messaging & Campaigns", async ({ page }) => {
    await page.goto("/dashboard/whatsapp", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/WhatsApp|Messages|Templates|Broadcast/i);
  });

  test("11.7 Multi-Property Group Portfolio", async ({ page }) => {
    await page.goto("/dashboard/multi-property", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Multi-Property|Portfolio|Properties/i);
  });
});
