/**
 * CRM page object: guest profile + loyalty points.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go } from "../helpers/navigation";

export class CrmPage {
  constructor(private readonly page: Page) {}

  /** Open the guest profile and verify KYC + stay history. */
  async openGuestProfile(): Promise<void> {
    await go(this.page, "/dashboard/front-desk/guests", /Guest Profiles/);

    const search = this.page.getByPlaceholder("Search guests...").first();
    await search.fill(state.guestName.split(" ")[0]);

    const row = this.page.locator("tr").filter({ hasText: state.guestName }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.getByRole("button", { name: /View/i }).click();

    const modal = this.page.locator("div.fixed").filter({ hasText: "Guest Profile" }).last();
    await expect(modal).toBeVisible({ timeout: 15_000 });
    await expect(modal.getByText(state.guestName).first()).toBeVisible({ timeout: 10_000 });
    await expect(modal.getByText("KYC Verified").first()).toBeVisible({ timeout: 10_000 });
  }

  /** Award loyalty points to the guest. */
  async awardLoyaltyPoints(): Promise<void> {
    await go(this.page, "/dashboard/loyalty", /Loyalty/);

    const card = this.page.locator("div").filter({ hasText: "Adjust Guest Points" }).last();
    await expect(card).toBeVisible({ timeout: 15_000 });

    const guestSelect = card.locator("select").first();
    await this.page.waitForFunction(() => {
      const selects = Array.from(document.querySelectorAll("select"));
      return selects.some((s) => s.options.length > 1);
    }, undefined, { timeout: 20_000 });
    await guestSelect.selectOption({ value: state.guestId });

    await card.getByLabel("Points").fill("500");
    await card.getByLabel("Description").fill("E2E workflow loyalty bonus");

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/loyalty/transactions") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await card.getByRole("button", { name: /Award/i }).click();
    const resp = await respPromise;
    expect(resp.ok()).toBeTruthy();
    await this.page.waitForTimeout(1000);
  }
}
