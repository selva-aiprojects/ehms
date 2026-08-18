/**
 * Finance page object: Billing & Folio — post an itemized charge,
 * verify folio lines (room + F&B), then settle the balance.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go } from "../helpers/navigation";
import { fillByLabel, pickSelectOption, waitForToast } from "../helpers/actions";

export class FinancePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/front-desk/billing", /Billing & Folio/);
  }

  /** Open the folio for the active booking. */
  async openFolio(): Promise<void> {
    const search = this.page.getByPlaceholder(/Search Unit or Guest/i).first();
    await search.fill(state.unitLabel);

    const row = this.page.locator("tr, div").filter({ hasText: state.guestName }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.getByRole("button", { name: /Open Folio/i }).click();

    const modal = this.page.locator("div.fixed").filter({ hasText: "Guest Folio" }).last();
    await expect(modal).toBeVisible({ timeout: 15_000 });
  }

  /** Post a bar charge to the folio and assert it appears. */
  async postCharge(): Promise<void> {
    const modal = this.page.locator("div.fixed").filter({ hasText: "Guest Folio" }).last();
    await modal.getByRole("button", { name: /Post Charge/i }).first().click();
    await expect(modal.getByText("Charge Type")).toBeVisible({ timeout: 10_000 });

    await pickSelectOption(this.page, "Charge Type", { value: "bar" });
    await fillByLabel(this.page, "Description", "Cocktail");
    await fillByLabel(this.page, "Unit Price", "500");
    await fillByLabel(this.page, "Qty", "2");
    await fillByLabel(this.page, "Tax", "5");

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/invoices/folio") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await modal.getByRole("button", { name: /Add to Folio/i }).click();
    const resp = await respPromise;
    expect(resp.ok()).toBeTruthy();

    await waitForToast(this.page, "Charge posted to folio!", { critical: true });
    await expect(modal.getByText("Cocktail").first()).toBeVisible({ timeout: 10_000 });
    await expect(modal.getByText(/Bar & Lounge/i).first()).toBeVisible({ timeout: 10_000 });
  }

  /** Assert folio contains the F&B order line plus room charges, then settle. */
  async verifyAndSettle(): Promise<void> {
    const modal = this.page.locator("div.fixed").filter({ hasText: "Guest Folio" }).last();

    await expect(modal.getByText(/F&B – Room Service/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(modal.getByText(/Room Charges/i).first()).toBeVisible({ timeout: 10_000 });

    const balance = modal.getByText(/Pay ₹/i).first();
    await expect(balance).toBeVisible({ timeout: 10_000 });

    const payRespPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/invoices/folio") && res.request().method() === "POST",
      { timeout: 30_000 }
    );
    await balance.click();
    const payResp = await payRespPromise;
    expect(payResp.ok()).toBeTruthy();

    await waitForToast(this.page, "Folio settled!", { critical: true });
    await expect(modal.getByText("Folio Settled").first()).toBeVisible({ timeout: 10_000 });
  }

  /** Verify an invoice exists for the booking. */
  async assertInvoice(): Promise<void> {
    const resp = await this.page.request.get(
      `/api/invoices?booking_id=${state.bookingId}`
    );
    const json = (await resp.json()) as any;
    const invoices = json?.data || [];
    expect(invoices.length).toBeGreaterThan(0);
    state.invoiceId = invoices[0]?.id || "";
    expect(state.invoiceId).toBeTruthy();
  }
}
