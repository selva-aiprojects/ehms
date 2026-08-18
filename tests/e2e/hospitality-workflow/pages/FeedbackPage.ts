/**
 * Guest Feedback page object: log feedback for the active booking.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go, reload } from "../helpers/navigation";
import { retryClick, waitForToast } from "../helpers/actions";

export class FeedbackPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/front-desk/feedbacks", /Guest Feedbacks/);
  }

  /** Log a 5-star feedback against the active booking. */
  async logFeedback(): Promise<void> {
    await retryClick(this.page, this.page.getByRole("button", { name: /Log Feedback/i }));

    const modal = this.page.locator("div.fixed").filter({ hasText: "Guest Feedback" }).last();
    await expect(modal).toBeVisible({ timeout: 15_000 });

    await this.page.waitForFunction(() => {
      const selects = Array.from(document.querySelectorAll("div.fixed select")) as HTMLSelectElement[];
      return selects.some((s) => s.options.length > 1);
    }, undefined, { timeout: 20_000 });

    const bookingSelect = modal.locator("select").first();
    await bookingSelect.selectOption({ value: state.bookingId });

    const ratingLabel = modal.getByText("Rating (1-5)").first();
    const ratingSection = ratingLabel.locator("xpath=ancestor::div[1]");
    const stars = ratingSection.locator('button[type="button"]');
    expect(await stars.count()).toBe(5);
    await stars.nth(4).click();

    const comments = modal.getByLabel("Comments");
    await comments.fill("Lovely stay, will recommend!");

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/dashboard/front-desk/feedbacks") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await retryClick(this.page, modal.getByRole("button", { name: /Submit Feedback/i }));
    const resp = await respPromise;
    expect(resp.ok()).toBeTruthy();

    await waitForToast(this.page, "Feedback submitted successfully!", { critical: true });
    await this.page.waitForTimeout(1500);
  }

  /** Assert the feedback row lists the guest and unit. */
  async assertFeedbackListed(): Promise<void> {
    await reload(this.page);
    const row = this.page.locator("tr").filter({ hasText: state.guestName }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(row).toContainText(`Unit ${state.unitLabel}`);
  }
}
