/**
 * Reservations page object: Check-Ins & Arrivals log verification.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go } from "../helpers/navigation";

export class ReservationPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/front-desk/check-ins", /Check-Ins & Arrivals/);
  }

  /** Assert the walk-in booking shows as checked-in with the right unit. */
  async assertCheckedIn(): Promise<void> {
    const filter = this.page.locator("select").first();
    await filter.selectOption({ label: "Currently Checked In" });

    const row = this.page.locator("tbody tr").filter({ hasText: state.guestName }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(row).toContainText(`Unit ${state.unitLabel}`);
    await expect(row).toContainText(/checked in/i);
  }
}
