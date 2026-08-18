/**
 * Procurement page object: create + send a purchase order.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go, reload } from "../helpers/navigation";
import { fillByLabel, pickSelectOption, retryClick } from "../helpers/actions";
import { todayISO } from "../helpers/test-data";

export class ProcurementPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/procurement/purchase-orders", /Purchase Orders/);
  }

  /** Create a purchase order with one line item. */
  async createPo(): Promise<void> {
    await retryClick(this.page, this.page.getByRole("button", { name: /New PO/i }));

    const modal = this.page.locator("div.fixed").filter({ hasText: "New Purchase Order" }).last();
    await expect(modal).toBeVisible({ timeout: 15_000 });

    await pickSelectOption(this.page, "Property", { value: state.propertyId });
    await pickSelectOption(this.page, "Vendor", { index: 1 });
    await fillByLabel(this.page, "PO Date", todayISO());
    await fillByLabel(this.page, "Notes", "Quarterly linen restock");

    const descInput = modal.getByPlaceholder("Description").first();
    await descInput.fill("Cotton Towels - Deluxe");
    const itemRow = descInput.locator("xpath=ancestor::div[contains(@class,'grid')][1]");
    await itemRow.getByPlaceholder("Qty").fill("5");
    await itemRow.getByPlaceholder("Unit Price").fill("120");
    await itemRow.getByPlaceholder("GST %").fill("12");

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/procurement/purchase-orders") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await retryClick(this.page, modal.getByRole("button", { name: /Create PO/i }));
    const resp = await respPromise;
    expect(resp.ok()).toBeTruthy();
    const json = (await resp.json()) as any;
    state.poNumber = json?.data?.po_number || "";

    await this.page.waitForTimeout(1500);
  }

  /** Assert the PO row appears and send it. */
  async sendPo(): Promise<void> {
    await reload(this.page);
    const row = this.page.locator("tr").filter({ hasText: state.poNumber }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });

    await row.getByRole("button", { name: /Send/i }).click();
    await expect(row).toContainText(/sent/i, { timeout: 15_000 });
    await this.page.waitForTimeout(1000);
  }
}
