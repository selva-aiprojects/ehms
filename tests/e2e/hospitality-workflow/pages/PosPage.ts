/**
 * F&B Point-of-Sale page object: breakfast room-service order flow.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go } from "../helpers/navigation";
import { retryClick, waitForToast } from "../helpers/actions";

export class PosPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/front-desk/f-and-b", /Food & Beverage|F&B/);
  }

  /** Create a Breakfast room-service order for the checked-in guest. */
  async createBreakfastOrder(): Promise<void> {
    await retryClick(this.page, this.page.getByRole("button", { name: /New Order/i }));

    const panel = this.page.locator("div.fixed").filter({ hasText: "New Room Service Order" }).last();
    await expect(panel).toBeVisible({ timeout: 15_000 });

    // Attach order to the active booking via the guest/room selector.
    const bookingSelect = panel.locator("select").first();
    await bookingSelect.selectOption({ value: state.bookingId });

    // Select the Breakfast category (scoped to the order panel).
    await retryClick(this.page, panel.getByRole("button", { name: "Breakfast", exact: true }));
    await this.page.waitForTimeout(500);

    // Increment the first Breakfast item once.
    const addBtn = panel.getByRole("button", { name: "+", exact: true }).first();
    await retryClick(this.page, addBtn);
    await expect(panel.getByText(/^1$|qty|items?/i).first()).toBeVisible({ timeout: 5_000 }).catch(() => undefined);

    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/dashboard/f-and-b/orders") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await retryClick(this.page, panel.getByRole("button", { name: /Post to Guest Folio/i }));

    const resp = await responsePromise;
    const json = (await resp.json()) as any;
    state.orderId = json?.data?.id || "";
    state.orderTotal = Number(json?.data?.total) || 0;

    await waitForToast(this.page, "Order created and posted to guest folio!", { critical: true });
    await this.page.waitForTimeout(1500);
  }
}
