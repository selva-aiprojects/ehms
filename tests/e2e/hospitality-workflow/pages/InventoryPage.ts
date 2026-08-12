/**
 * Inventory page object: add item + stock adjustment flow.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go } from "../helpers/navigation";
import { fillByLabel, pickSelectOption, retryClick, expectText } from "../helpers/actions";
import { randomItemName } from "../helpers/test-data";

export class InventoryPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/inventory/items", /Inventory/);
  }

  /** Add a new inventory item under the active property. */
  async addItem(): Promise<void> {
    state.itemName = randomItemName();

    await retryClick(this.page, this.page.getByRole("button", { name: /Add Item/i }));

    const modal = this.page.locator("div.fixed").filter({ hasText: "Add New Item" }).last();
    await expect(modal).toBeVisible({ timeout: 15_000 });

    await fillByLabel(this.page, "Item Name", state.itemName);
    await pickSelectOption(this.page, "Category", { index: 1 });
    await fillByLabel(this.page, "Description", "Item created by E2E workflow");
    await fillByLabel(this.page, "Quantity on Hand", "50");
    await fillByLabel(this.page, "Reorder Point", "10");
    await fillByLabel(this.page, "Unit Cost", "150");

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/inventory/items") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await retryClick(this.page, modal.getByRole("button", { name: /Save Item/i }));
    const resp = await respPromise;
    expect(resp.ok()).toBeTruthy();
    const json = (await resp.json()) as any;
    state.itemId = json?.data?.id || "";

    await expectText(this.page, /added successfully/i, 15_000);
    await this.page.waitForTimeout(1500);
  }

  /** Receive +10 units into stock via Adjust Stock. */
  async adjustStock(): Promise<void> {
    const search = this.page.getByPlaceholder(/Search by name or SKU/i).first();
    await search.fill(state.itemName);

    const row = this.page.locator("tr").filter({ hasText: state.itemName }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.getByRole("button", { name: /Adjust Stock/i }).click();

    const modal = this.page.locator("div.fixed").filter({ hasText: "Adjust Stock:" }).last();
    await expect(modal).toBeVisible({ timeout: 15_000 });

    await pickSelectOption(this.page, "Adjustment Type", { value: "adjustment_add" });
    await fillByLabel(this.page, "Quantity", "10");
    await fillByLabel(this.page, "Notes", "Stock received from vendor");

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/inventory/items/stock") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await retryClick(this.page, modal.getByRole("button", { name: /Submit Adjustment/i }));
    const resp = await respPromise;
    expect(resp.ok()).toBeTruthy();

    await expectText(this.page, /Inventory adjusted successfully/i, 15_000);
    await this.page.waitForTimeout(1500);
  }
}
