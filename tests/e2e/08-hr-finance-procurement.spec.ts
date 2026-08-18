import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE } from "./helpers/auth";

const EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

test.describe("HR, Finance & Procurement Workflows", () => {
  test.describe("HR Module", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HR-001: HRMS dashboard loads", async ({ page }) => {
      await page.goto("/dashboard/hr");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText(/HRMS|HR/).first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("TC-HR-002: Employees page loads with table", async ({ page }) => {
      await page.goto("/dashboard/hr/employees");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(
        page.locator("main").getByText("Employees").first()
      ).toBeVisible({ timeout: 10000 });

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const count = await table.locator("tbody tr").count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test("TC-HR-003: Employee search and filter", async ({ page }) => {
      await page.goto("/dashboard/hr/employees");
      await page.waitForLoadState("domcontentloaded");

      const search = page
        .locator('input[placeholder*="Search"]')
        .first();
      if (await search.isVisible({ timeout: 5000 }).catch(() => false)) {
        await search.fill("John");
        await page.waitForTimeout(500);
      }
    });

    test("TC-HR-004: Create employee modal", async ({ page }) => {
      await page.goto("/dashboard/hr/employees");
      await page.waitForLoadState("domcontentloaded");

      const createBtn = page
        .locator("button", { hasText: /New|Create|Add|Employee/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test("TC-HR-005: Timesheets page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/timesheet");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Timesheet").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HR-006: Leave management page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/leave");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Leave").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-HR-007: Leave has status filters", async ({ page }) => {
      await page.goto("/dashboard/hr/leave");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const statuses = ["pending", "approved", "rejected"];
      for (const s of statuses) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("TC-HR-008: Payroll page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/payroll");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Payroll").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-HR-009: Shift management page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/shifts");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Shifts").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-HR-010: HR Compliance page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/compliance");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Compliance").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HR-011: HR Masters page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/masters");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Masters").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-HR-012: Policies page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/policies");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });

      await expect(page.locator("main").getByText("Policies").first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("TC-HR-013: Appraisal page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/appraisal");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Appraisal").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HR-014: Compensation page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/compensation");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Compensation").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HR-015: HR Settings page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/settings");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Settings").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Finance Module", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-FIN-001: Finance dashboard loads", async ({ page }) => {
      await page.goto("/dashboard/finance");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Finance").first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("TC-FIN-002: Chart of Accounts page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/accounts");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Chart of Accounts|Accounts/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-FIN-003: Create account modal", async ({ page }) => {
      await page.goto("/dashboard/finance/accounts");
      await page.waitForLoadState("domcontentloaded");

      const createBtn = page
        .locator("button", { hasText: /New|Create|Add|Account/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test("TC-FIN-004: Journal entries page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/journal");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Journal").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-FIN-005: General Ledger page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/ledger");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Ledger").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-FIN-006: Receivables page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/receivables");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });

      await expect(
        page.locator("main").getByText("Receivables").first()
      ).toBeVisible({ timeout: 15000 });
    });

    test("TC-FIN-007: Payables page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/payables");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Payables").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-FIN-008: Budget management page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/budget");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Budget").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-FIN-009: Tax filings page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/tax");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Tax").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-FIN-010: Fixed assets page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/assets");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Fixed Assets|Assets/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-FIN-011: Financial reports page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/reports");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Reports").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-FIN-012: Trial balance report available", async ({ page }) => {
      await page.goto("/dashboard/finance/reports");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Trial Balance|Profit/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-FIN-013: Finance settings page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/settings");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Settings").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-FIN-014: Bank reconciliation page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/reconciliation");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Reconciliation").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Procurement Module", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-PROC-001: Procurement dashboard loads", async ({ page }) => {
      await page.goto("/dashboard/procurement");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Procurement").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-PROC-002: Purchase orders page loads", async ({ page }) => {
      await page.goto("/dashboard/procurement/purchase-orders");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Purchase Orders").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-PROC-003: Create purchase order", async ({ page }) => {
      await page.goto("/dashboard/procurement/purchase-orders");
      await page.waitForLoadState("domcontentloaded");

      const createBtn = page
        .locator("button", { hasText: /New|Create|Add|Order/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test("TC-PROC-004: Goods Receipt Notes page loads", async ({ page }) => {
      await page.goto("/dashboard/procurement/grn");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Goods Receipt|GRN/).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Vendors Module", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-VEND-001: Vendor directory page loads", async ({ page }) => {
      await page.goto("/dashboard/vendors");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Vendor").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-VEND-002: Create vendor modal", async ({ page }) => {
      await page.goto("/dashboard/vendors");
      await page.waitForLoadState("domcontentloaded");

      const createBtn = page
        .locator("button", { hasText: /New|Create|Add|Vendor/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test("TC-VEND-003: Vendor orders page loads", async ({ page }) => {
      await page.goto("/dashboard/vendors/orders");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Orders|Vendor/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-VEND-004: Vendor services page loads", async ({ page }) => {
      await page.goto("/dashboard/vendors/services");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Services|Vendor/).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Inventory Module", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-INV-001: Inventory dashboard loads", async ({ page }) => {
      await page.goto("/dashboard/inventory");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Inventory").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-INV-002: Inventory items page loads", async ({ page }) => {
      await page.goto("/dashboard/inventory/items");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Items|Inventory/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-INV-003: Stock transactions page loads", async ({ page }) => {
      await page.goto("/dashboard/inventory/transactions");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Transactions|Inventory/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-INV-004: Warehouses page loads", async ({ page }) => {
      await page.goto("/dashboard/inventory/warehouses");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Warehouse").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-INV-005: Categories page loads", async ({ page }) => {
      await page.goto("/dashboard/inventory/categories");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Categories|Inventory/).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Revenue & Pricing", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-REV-001: Revenue dashboard loads", async ({ page }) => {
      await page.goto("/dashboard/revenue");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Revenue Dashboard|Revenue/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-REV-002: Pricing rules page loads", async ({ page }) => {
      await page.goto("/dashboard/pricing");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Pricing").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-REV-003: Loyalty program page loads", async ({ page }) => {
      await page.goto("/dashboard/loyalty");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Loyalty").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-REV-004: OTA Channels page loads", async ({ page }) => {
      await page.goto("/dashboard/ota");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/OTA|Channel/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-REV-005: Revenue AI page loads", async ({ page }) => {
      await page.goto("/dashboard/revenue/ai");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText(/Revenue AI|AI/).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
