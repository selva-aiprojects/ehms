import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 09: Procurement & Vendor Operations", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.propertyManager.email,
      DEMO_USERS.propertyManager.password,
      "VISWA",
      "hotels"
    );
  });

  test("09.1 Procurement Overview Dashboard", async ({ page }) => {
    await page.goto("/dashboard/procurement", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Procurement|Purchase|Requisition/i);
  });

  test("09.2 Vendor Directory & Supplier Profiles", async ({ page }) => {
    await page.goto("/dashboard/vendors", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Vendors|Suppliers|GSTIN|Category/i);
  });

  test("09.3 Purchase Orders (PO) & Approvals", async ({ page }) => {
    await page.goto("/dashboard/procurement/purchase-orders", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Purchase Orders|PO|Approval|Supplier/i);
  });

  test("09.4 Goods Receipt Notes (GRN) Inspection", async ({ page }) => {
    await page.goto("/dashboard/procurement/grn", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Goods Receipt|GRN|Inspection|Quantity/i);
  });

  test("09.5 Vendor Orders & Recurring Services", async ({ page }) => {
    await page.goto("/dashboard/vendors/orders", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    await expect(page.locator("body")).toContainText(/Vendor Orders|Services|Purchases/i);

    await page.goto("/dashboard/vendors/services", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);
    await expect(page.locator("body")).toContainText(/Services|AMC|Contracts/i);
  });
});
