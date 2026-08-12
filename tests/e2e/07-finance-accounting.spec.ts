import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 07: Finance & Accounts Module", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.finance.email,
      DEMO_USERS.finance.password,
      "VISWA",
      "hotels"
    );
  });

  test("07.1 Executive Finance Summary", async ({ page }) => {
    await page.goto("/dashboard/finance", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Finance|Revenue|Expenses|Profit/i);
  });

  test("07.2 Chart of Accounts (COA)", async ({ page }) => {
    await page.goto("/dashboard/finance/accounts", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Chart of Accounts|Assets|Liabilities|Equity/i);
  });

  test("07.3 Double-Entry Journal Entries", async ({ page }) => {
    await page.goto("/dashboard/finance/journal", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Journal|Debit|Credit|Voucher/i);
  });

  test("07.4 General Ledger & Balances", async ({ page }) => {
    await page.goto("/dashboard/finance/ledger", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Ledger|Opening|Closing|Transactions/i);
  });

  test("07.5 Accounts Receivable (AR) & Aging", async ({ page }) => {
    await page.goto("/dashboard/finance/receivables", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Receivables|Aging|City Ledger|Outstanding/i);
  });

  test("07.6 Accounts Payable (AP) & Vendor Bills", async ({ page }) => {
    await page.goto("/dashboard/finance/payables", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Payables|Bills|Vendor|Disbursement/i);
  });

  test("07.7 Department Budgeting & Variance", async ({ page }) => {
    await page.goto("/dashboard/finance/budget", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Budget|Variance|Allocated|Cost Center/i);
  });

  test("07.8 Tax Filings & Compliance", async ({ page }) => {
    await page.goto("/dashboard/finance/tax", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Tax|GST|VAT|TDS/i);
  });

  test("07.9 Fixed Assets & Depreciation", async ({ page }) => {
    await page.goto("/dashboard/finance/assets", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Fixed Assets|Depreciation|Acquisition/i);
  });

  test("07.10 Financial Statements & Reports", async ({ page }) => {
    await page.goto("/dashboard/finance/reports", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Reports|Trial Balance|Profit & Loss|Balance Sheet/i);
  });

  test("07.11 Bank Reconciliation", async ({ page }) => {
    await page.goto("/dashboard/finance/reconciliation", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Reconciliation|Bank|Statement|Matching/i);
  });
});
