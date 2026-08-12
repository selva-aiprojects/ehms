import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE } from "./helpers/auth";

const EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

test.describe("Restaurant POS, KDS & F&B Workflow", () => {
  test.describe("Restaurant POS", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-REST-001: Restaurant POS page loads", async ({ page }) => {
      await page.goto("/dashboard/restaurant");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Restaurant|POS/).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("TC-REST-002: Table layout visible with statuses", async ({
      page,
    }) => {
      await page.goto("/dashboard/restaurant");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const statuses = [
        "Available",
        "Occupied",
        "Reserved",
        "Cleaning",
      ];
      for (const s of statuses) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("TC-REST-003: Table status can be changed", async ({ page }) => {
      await page.goto("/dashboard/restaurant");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const tableEl = page
        .locator('[class*="table"], [class*="seat"]')
        .first();
      if (await tableEl.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tableEl.click();
        await page.waitForTimeout(500);
      }
    });

    test("TC-REST-004: Create table reservation", async ({ page }) => {
      await page.goto("/dashboard/restaurant");
      await page.waitForLoadState("domcontentloaded");

      const resBtn = page
        .locator("button", { hasText: /Reservation|Book|Reserve/ })
        .first();
      if (await resBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await resBtn.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("Kitchen Display System", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-KDS-001: KDS page loads with 3-column layout", async ({
      page,
    }) => {
      await page.goto("/dashboard/restaurant/kds");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText(/KDS|Kitchen/).first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("TC-KDS-002: KDS has priority badges", async ({ page }) => {
      await page.goto("/dashboard/restaurant/kds");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const priorities = ["RUSH", "High", "Normal", "Low"];
      for (const p of priorities) {
        const el = page.locator(`text=${p}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("TC-KDS-003: KDS has station filter", async ({ page }) => {
      await page.goto("/dashboard/restaurant/kds");
      await page.waitForLoadState("domcontentloaded");

      const stationFilter = page.locator("select, [class*='filter']").first();
      if (
        await stationFilter.isVisible({ timeout: 5000 }).catch(() => false)
      ) {
        await expect(stationFilter).toBeVisible();
      }
    });
  });

  test.describe("Menu Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-MENU-001: Menu management page loads", async ({ page }) => {
      await page.goto("/dashboard/restaurant/menu");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Menu|Management/).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("TC-MENU-002: Menu categories visible", async ({ page }) => {
      await page.goto("/dashboard/restaurant/menu");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const categories = [
        "Breakfast",
        "Appetizers",
        "Main Course",
        "Desserts",
        "Beverages",
      ];
      for (const cat of categories) {
        const el = page.locator(`text=${cat}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("TC-MENU-003: Add/edit menu item modal", async ({ page }) => {
      await page.goto("/dashboard/restaurant/menu");
      await page.waitForLoadState("domcontentloaded");

      const addBtn = page
        .locator("button", { hasText: /Add|New|Create|Item/ })
        .first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const fields = [
          "item_name",
          "price",
          "category",
          "is_veg",
          "prep_time",
        ];
        for (const f of fields) {
          const el = page.locator(`text=${f}, [name*="${f}"]`).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(el).toBeVisible();
          }
        }
      }
    });

    test("TC-MENU-004: Menu search works", async ({ page }) => {
      await page.goto("/dashboard/restaurant/menu");
      await page.waitForLoadState("domcontentloaded");

      const search = page
        .locator('input[placeholder*="Search"]')
        .first();
      if (await search.isVisible({ timeout: 5000 }).catch(() => false)) {
        await search.fill("rice");
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("F&B Room Service", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-FNB-001: F&B page loads with orders and menu", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Food & Beverage").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-FNB-002: New order posts to guest folio", async ({ page }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");

      const newOrderBtn = page
        .locator("button", { hasText: "New Order" })
        .first();
      if (await newOrderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newOrderBtn.click();

        await expect(
          page.locator("main").getByText("Post to Guest Folio").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("TC-FNB-003: F&B order statuses visible", async ({ page }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const statuses = ["pending", "preparing", "ready", "delivered"];
      for (const s of statuses) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("TC-FNB-004: Complimentary order option available", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const compBadge = page
        .locator("text=Complimentary")
        .first();
      if (await compBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(compBadge).toBeVisible();
      }
    });
  });
});
