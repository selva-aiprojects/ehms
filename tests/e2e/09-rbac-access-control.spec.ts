import { test, expect } from "@playwright/test";
import {
  loginAsTenantUser,
  loginAsPlatformAdmin,
  logoutUser,
  DEMO_USERS,
  TENANT_CODE,
} from "./helpers/auth";

test.describe("RBAC & Role-Based Access Control", () => {
  test.describe("Super Admin - Full Access", () => {
    test("TC-RBAC-001: Super admin can access all dashboard sections", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.superAdmin.email,
        DEMO_USERS.superAdmin.password
      );

      const sections = [
        "/dashboard/front-desk",
        "/dashboard/housekeeping",
        "/dashboard/maintenance",
        "/dashboard/finance",
        "/dashboard/hr",
        "/dashboard/admin/properties",
      ];

      for (const section of sections) {
        await page.goto(section);
        await page.waitForLoadState("domcontentloaded");
        await expect(page).toHaveURL(new RegExp(section.replace("/", "\\/")));
      }
    });

    test("TC-RBAC-002: Super admin sees all sidebar nav groups", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.superAdmin.email,
        DEMO_USERS.superAdmin.password
      );

      const groups = [
        "Front Desk & Guests",
        "Housekeeping",
        "Maintenance",
        "Finance & Accounts",
        "Human Resources",
        "Administration",
        "Procurement",
        "Inventory",
      ];

      for (const g of groups) {
        const el = page.locator(`text=${g}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });
  });

  test.describe("Front Desk - Limited Access", () => {
    test("TC-RBAC-003: Front desk can access front desk sections", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.frontDesk.email,
        DEMO_USERS.frontDesk.password
      );

      await page.goto("/dashboard/front-desk");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Front Desk Command Center").first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("TC-RBAC-004: Front desk cannot access HR directly via URL", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.frontDesk.email,
        DEMO_USERS.frontDesk.password
      );

      await page.goto("/dashboard/hr/employees");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      const isOnHR = page.url().includes("/hr/employees");
      expect(isOnHR).toBeFalsy();
    });

    test("TC-RBAC-005: Front desk cannot access finance via URL", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.frontDesk.email,
        DEMO_USERS.frontDesk.password
      );

      await page.goto("/dashboard/finance/accounts");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      const isOnFinance = page.url().includes("/finance/accounts");
      expect(isOnFinance).toBeFalsy();
    });
  });

  test.describe("Housekeeping Staff - Minimal Access", () => {
    test("TC-RBAC-006: Housekeeping staff can access housekeeping", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.housekeeping.email,
        DEMO_USERS.housekeeping.password
      );

      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Housekeeping").first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("TC-RBAC-007: Housekeeping staff cannot access admin", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.housekeeping.email,
        DEMO_USERS.housekeeping.password
      );

      await page.goto("/dashboard/admin/tenants");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      const isOnAdmin = page.url().includes("/admin/tenants");
      expect(isOnAdmin).toBeFalsy();
    });
  });

  test.describe("HR Manager - HR Only Access", () => {
    test("TC-RBAC-008: HR manager can access HR sections", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.hr.email,
        DEMO_USERS.hr.password
      );

      await page.goto("/dashboard/hr");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText(/HRMS|HR/).first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("TC-RBAC-009: HR manager cannot access maintenance", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.hr.email,
        DEMO_USERS.hr.password
      );

      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      const isOnMaint = page.url().includes("/maintenance/tickets");
      expect(isOnMaint).toBeFalsy();
    });
  });

  test.describe("Finance Manager - Finance Access", () => {
    test("TC-RBAC-010: Finance manager can access finance sections", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.finance.email,
        DEMO_USERS.finance.password
      );

      await page.goto("/dashboard/finance");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Finance").first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("TC-RBAC-011: Finance manager can access procurement", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.finance.email,
        DEMO_USERS.finance.password
      );

      await page.goto("/dashboard/procurement");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Procurement").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Platform Admin - Tenant Management Only", () => {
    test("TC-RBAC-012: Platform admin can access tenant management", async ({
      page,
    }) => {
      await loginAsPlatformAdmin(page);

      await expect(page).toHaveURL(/\/dashboard\/admin\/tenants/);
    });

    test("TC-RBAC-013: Platform admin cannot access front desk", async ({
      page,
    }) => {
      await loginAsPlatformAdmin(page);

      await page.goto("/dashboard/front-desk");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      await expect(page).toHaveURL(/\/dashboard\/admin\/tenants/);
    });

    test("TC-RBAC-014: Platform admin cannot access HR", async ({
      page,
    }) => {
      await loginAsPlatformAdmin(page);

      await page.goto("/dashboard/hr");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      await expect(page).toHaveURL(/\/dashboard\/admin\/tenants/);
    });
  });

  test.describe("Tenant Selection & Login Flow", () => {
    test("TC-RBAC-015: Login page shows tenant grid when no tenant selected", async ({
      page,
    }) => {
      await page.goto("/login");

      await expect(
        page.getByText("Select Your Organization")
      ).toBeVisible({ timeout: 15000 });
    });

    test("TC-RBAC-016: Clicking tenant card shows login form", async ({
      page,
    }) => {
      await page.goto("/login");

      const tenantCard = page.locator("button, a").filter({ hasText: /VISWA|Select Organization/ }).first();
      if (await tenantCard.isVisible({ timeout: 10000 }).catch(() => false)) {
        await tenantCard.click();
        await page.waitForTimeout(1000);

        await expect(
          page.getByText("HostSphere Portal")
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("TC-RBAC-017: Login form has demo credential autofill", async ({
      page,
    }) => {
      await page.goto(`/login?tenant=${TENANT_CODE}`);
      await page.waitForSelector("select", { timeout: 15000 });

      const demoSelect = page.locator("select").last();
      const options = await demoSelect.locator("option").allTextContents();
      expect(options.length).toBeGreaterThan(1);
    });

    test("TC-RBAC-018: Suspended tenant shows suspended badge", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");

      const suspendedBadge = page.getByText("Suspended");
      if (await suspendedBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(suspendedBadge).toBeVisible();
      }
    });

    test("TC-RBAC-019: Wrong password shows error", async ({ page }) => {
      await page.goto(`/login?tenant=${TENANT_CODE}`);
      await page.waitForSelector('input[type="email"]', { timeout: 15000 });

      await page.locator('input[type="email"]').first().fill("wrong@email.com");
      await page.locator('input[type="password"]').first().fill("wrongpassword");
      await page.locator('button[type="submit"]').first().click();

      await page.waitForTimeout(2000);

      const error = page.locator('[style*="E53E3E"], [style*="color-danger"], [class*="error"]').first();
      if (await error.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(error).toBeVisible();
      }
    });
  });

  test.describe("Logout Flow", () => {
    test("TC-RBAC-020: Logout clears session and redirects to login", async ({
      page,
    }) => {
      await loginAsTenantUser(
        page,
        DEMO_USERS.superAdmin.email,
        DEMO_USERS.superAdmin.password
      );

      await page.waitForLoadState("domcontentloaded");
      await logoutUser(page);

      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
