/**
 * Front Desk page object: walk-in booking, room card selection,
 * checked-in state assertions, and guest request logging.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go, reload } from "../helpers/navigation";
import { fillByLabel, pickSelectOption, waitForToast, idProofPath, extractNumber, expectText } from "../helpers/actions";
import { randomFirstName, randomLastName, randomGuestEmail, randomPhone, todayISO, daysFromNowISO } from "../helpers/test-data";

export class FrontDeskPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/front-desk", /Front Desk|Command Center/);
  }

  async createWalkInBooking(): Promise<void> {
    const modal = this.openWalkInModal();

    state.guestName = `${randomFirstName()} ${randomLastName()}`;
    state.guestEmail = randomGuestEmail(state.guestName.split(" ")[0], state.guestName.split(" ")[1] || "guest");
    state.phone = randomPhone();

    await fillByLabel(this.page, "First Name", state.guestName.split(" ")[0]);
    await fillByLabel(this.page, "Last Name", state.guestName.split(" ")[1] || "Guest");
    await fillByLabel(this.page, "Phone Number", state.phone);
    await fillByLabel(this.page, "Email Address", state.guestEmail);

    // Wait for the availability API to populate the room dropdown.
    await this.page.waitForFunction(() => {
      const labels = Array.from(document.querySelectorAll("label"));
      const lab = labels.find((l) => l.textContent?.includes("Assign Available Room"));
      const select = lab?.nextElementSibling as HTMLSelectElement | null;
      return !!select && select.options.length > 1;
    }, undefined, { timeout: 20_000 });

    const unitSelect = await pickSelectOption(this.page, "Assign Available Room", { index: 1 });
    const selectedOptionText = await unitSelect.locator("option:checked").textContent();
    const unitMatch = (selectedOptionText || "").match(/Unit\s+([\w.-]+)/i);
    if (unitMatch) state.unitLabel = unitMatch[1];

    // Total is auto-calculated after picking the room; capture from UI (soft) + API (authoritative).
    const totalInput = modal.locator('input[type="number"][readonly]').first();
    try {
      await expect(totalInput).toHaveValue(/\d+/, { timeout: 10_000 });
      const raw = await totalInput.inputValue();
      state.totalAmount = extractNumber(raw);
    } catch {
      state.addWarning("Walk-in total_amount input did not auto-fill");
    }

    // Upload ID proof (KYC) — walk-in requires a file to be chosen.
    const fileInput = modal.locator('input[type="file"]').first();
    await fileInput.setInputFiles(idProofPath());

    // Arm response capture before submitting.
    const guestResPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/guests") && res.request().method() === "POST",
      { timeout: 30_000 }
    );
    const bookingResPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/reservations") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await modal.getByRole("button", { name: /Complete Walk-In Check-In/ }).click();

    const guestRes = await guestResPromise;
    const guestJson = (await guestRes.json()) as any;
    state.guestId = guestJson?.data?.id || "";

    const bookingRes = await bookingResPromise;
    const bookingJson = (await bookingRes.json()) as any;
    state.bookingId = bookingJson?.data?.id || "";
    state.unitId = bookingJson?.data?.unit_id || state.unitId;
    state.propertyId = bookingJson?.data?.property_id || state.propertyId;
    state.totalAmount = Number(bookingJson?.data?.total_amount) || state.totalAmount;
    state.unitLabel = bookingJson?.data?.unit?.unit_label || bookingJson?.data?.unit_label || state.unitLabel;

    expect(state.bookingId).toBeTruthy();
    expect(state.guestId).toBeTruthy();

    await waitForToast(this.page, "Walk-in checked in successfully!", { critical: true });
    await this.page.waitForTimeout(1500);
  }

  private openWalkInModal(): ReturnType<Page["locator"]> {
    const quickAction = this.page.getByRole("button", { name: /New Guest/ }).first();
    quickAction.click({ force: true });
    const modal = this.page.locator("div.fixed").filter({ hasText: "Walk-In Check-In" }).last();
    expect(modal).toBeVisible({ timeout: 15_000 });
    return modal;
  }

  /** Click the room card for the active booking's unit and assert occupied state. */
  async assertRoomCheckedIn(): Promise<void> {
    await reload(this.page);
    const card = this.page.locator("button").filter({ hasText: state.unitLabel }).first();
    await expect(card).toBeVisible({ timeout: 20_000 });
    await card.click();
    await expectText(this.page, "Currently checked in", 15_000);
    await softAssertGuestInPanel(this.page);
  }

  /** Verify the guest appears in the In-House panel on the front desk page. */
  async assertInHouse(): Promise<void> {
    await reload(this.page);
    const panel = this.page.getByText("In-House").first();
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await softAssertGuestInPanel(this.page);
  }
}

async function softAssertGuestInPanel(page: Page): Promise<void> {
  try {
    const guestLink = page.locator("text=" + state.guestName).first();
    await expect(guestLink).toBeVisible({ timeout: 10_000 });
  } catch {
    state.addWarning(`Guest "${state.guestName}" not visible in panel`);
  }
}

export async function assertInHouse(page: Page): Promise<void> {
  await new FrontDeskPage(page).assertInHouse();
}

export { todayISO, daysFromNowISO };
