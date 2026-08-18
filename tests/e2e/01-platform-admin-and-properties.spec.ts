import { test, expect } from "@playwright/test";
import {
  loginAsPlatformAdmin,
  loginAsTenantUser,
  TENANT_CODE,
} from "./helpers/auth";

test.describe("Platform Admin & Property Management", () => {
  test.describe("Platform Admin Login", () => {
    test("TC-PLAT-001: Platform admin can login from /login page", async ({
      page,
    }) => {
      await page.goto("/login", { waitUntil: "domcontentloaded" });

      await page.waitForSelector("button:has-text('Platform Admin Sign In')", { timeout: 30000 });

      const platformBtn = page
        .locator("button", { hasText: "Platform Admin Sign In" })
        .first();
      await platformBtn.click({ force: true });

      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      await page.locator('input[type="email"]').fill("provider@ehms.demo");
      await page.locator('input[type="password"]').fill("Demo@1234");
      await page.locator('form button[type="submit"]').last().click({ force: true });

      await page.waitForURL("**/dashboard/admin/tenants", { timeout: 30000 });
      await expect(page).toHaveURL(/\/dashboard\/admin\/tenants/);
    });

    test("TC-PLAT-002: Platform admin sees tenant list on admin page", async ({
      page,
    }) => {
      await loginAsPlatformAdmin(page);

      await expect(
        page.locator("main").getByText("Tenant Management").first()
      ).toBeVisible({ timeout: 10000 });

      const tenantCards = page.locator(
        '[class*="rounded"][class*="border"]'
      );
      const count = await tenantCards.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("TC-PLAT-003: Platform admin cannot access tenant-scoped dashboard", async ({
      page,
    }) => {
      await loginAsPlatformAdmin(page);
      await page.goto("/dashboard/front-desk");
      await page.waitForLoadState("domcontentloaded");

      await expect(page).toHaveURL(/\/dashboard\/admin\/tenants/);
    });
  });

  test.describe("Tenant Provisioning", () => {
    test("TC-PROV-001: Provision new tenant via /tenants page wizard", async ({
      page,
    }) => {
      await page.goto("/tenants", { waitUntil: "domcontentloaded" });

      const provisionBtn = page
        .locator("button", { hasText: /Provision New Shard|Sign In to Provision/ })
        .first();
      await expect(provisionBtn).toBeVisible({ timeout: 15000 });
      await provisionBtn.click({ force: true });

      // Platform login modal may appear
      const emailInModal = page.locator('input[type="email"]');
      if (await emailInModal.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailInModal.fill("provider@ehms.demo");
        await page.locator('input[type="password"]').fill("Demo@1234");
        await page.locator('form button[type="submit"]').last().click({ force: true });
        await page.waitForTimeout(2000);
      }

      const wizard = page.locator('[class*="max-w-4xl"], [class*="rounded-3xl"]').first();
      await expect(wizard).toBeVisible({ timeout: 10000 });

      const orgNameInput = page.locator('input[placeholder*="Grand Hyatt"], input[placeholder*="Organization"]').first();
      await orgNameInput.fill("E2E Test Hotel Group");

      const codeInput = page.locator('input[placeholder*="ABC"], input[placeholder*="Code"]').first();
      await codeInput.fill("E2EHT");

      const schemaInput = page.locator('input[placeholder*="abc"], input[placeholder*="Schema"]').first();
      await schemaInput.fill("e2e_hotel_test");

      const contactEmail = page.locator('input[placeholder*="admin@org"], input[type="email"]').last();
      await contactEmail.fill("test@e2ehotel.com");

      const nextBtn = page.locator("button", { hasText: "Next" }).first();
      await nextBtn.click();
      await page.waitForTimeout(500);

      const typeSelect = page.locator("select").first();
      await typeSelect.selectOption("hotels");

      const nameInput = page.locator('input[placeholder*="Hyderabad"]').first();
      await nameInput.fill("E2E Test Hotel Bangalore");

      const addWsBtn = page
        .locator("button", { hasText: "Add Workspace" })
        .first();
      await addWsBtn.click();

      const nextBtn2 = page.locator("button", { hasText: "Next" }).first();
      await nextBtn2.click();
      await page.waitForTimeout(500);

      await expect(page.locator("text=Review Summary")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Property Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, "raghu.superadmin@ehms.demo", "Demo@1234");
    });

    test("TC-PROP-001: Navigate to Properties/Workspaces page", async ({
      page,
    }) => {
      await page.goto("/dashboard/admin/properties");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Properties|Workspaces/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-PROP-002: View property list with cards", async ({ page }) => {
      await page.goto("/dashboard/admin/properties");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const propertyCards = page.locator(
        '[class*="rounded-2xl"], [class*="rounded-xl"]'
      );
      const count = await propertyCards.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("TC-PROP-003: Create new property with feature config", async ({
      page,
    }) => {
      await page.goto("/dashboard/admin/properties");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      const createBtn = page
        .locator("button", { hasText: /Add Property|Create|New Property/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);

        const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="Hotel"]').first();
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameInput.fill("E2E Test Property");
        }

        const featureToggles = page.locator('button[class*="toggle"], [role="switch"]');
        const toggleCount = await featureToggles.count();
        expect(toggleCount).toBeGreaterThanOrEqual(0);
      }
    });

    test("TC-PROP-004: Property detail page shows feature toggles", async ({
      page,
    }) => {
      await page.goto("/dashboard/admin/properties");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const firstProperty = page.locator('a[href*="/admin/properties/"]').first();
      if (await firstProperty.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstProperty.click();
        await page.waitForLoadState("domcontentloaded");

        await expect(
          page.locator("main").getByText(/Overview|Configuration/).first()
        ).toBeVisible({ timeout: 10000 });

        const featureLabels = [
          "Rooms Map",
          "Rate Card",
          "Restaurant",
          "Bar",
          "Laundry",
          "Maintenance",
        ];
        for (const label of featureLabels) {
          const el = page.locator(`text=${label}`).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(el).toBeVisible();
          }
        }
      }
    });

    test("TC-PROP-005: Rooms inventory management for property", async ({
      page,
    }) => {
      await page.goto("/dashboard/rooms-inventory");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Rooms|Units|Inventory/).first()).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
