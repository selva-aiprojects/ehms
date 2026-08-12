/**
 * Maintenance page object: ticket creation (UI) + status workflow (API),
 * with notes attached at each transition.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go, reload } from "../helpers/navigation";
import { fillByLabel, pickSelectOption, retryClick, waitForToast } from "../helpers/actions";
import { randomTicketTitle } from "../helpers/test-data";

export class MaintenancePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/maintenance", /Maintenance/);
  }

  /** Create a maintenance ticket for the booked unit via the UI. */
  async createTicket(): Promise<void> {
    state.ticketTitle = randomTicketTitle();

    await retryClick(this.page, this.page.getByRole("button", { name: /Create Ticket/i }));

    const modal = this.page.locator("div.fixed").filter({ hasText: "Create Maintenance Ticket" }).last();
    await expect(modal).toBeVisible({ timeout: 15_000 });

    await fillByLabel(this.page, "Title", state.ticketTitle);
    await fillByLabel(this.page, "Description", "Guest reported issue during stay; requires repair.");
    await pickSelectOption(this.page, "Category", { label: /AC|Electrical|Plumbing/i });
    await pickSelectOption(this.page, "Priority", { label: "High" });

    const unitNumber = state.unitLabel.replace(/[^\d]/g, "");
    if (unitNumber) {
      const unitInput = modal.getByLabel("Unit ID");
      await unitInput.fill(unitNumber);
    } else {
      state.addWarning("Could not map unit label to numeric Unit ID");
    }

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/maintenance/tickets") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await retryClick(this.page, modal.getByRole("button", { name: /Create/i }));

    const resp = await respPromise;
    const json = (await resp.json()) as any;
    state.ticketId = json?.data?.id || "";

    await waitForToast(this.page, "created", { critical: true });
    await this.page.waitForTimeout(1500);
  }

  /** Drive ticket lifecycle open → assigned → in_progress → resolved via API. */
  async resolveTicketViaApi(): Promise<void> {
    const base = "/api/maintenance/tickets/" + state.ticketId;
    const steps: Array<[string, string]> = [
      ["assigned", "Assigned to maintenance engineer"],
      ["in_progress", "Repair in progress"],
      ["resolved", "Issue fixed and verified"],
    ];
    for (const [status, notes] of steps) {
      const res = await this.page.request.put(base, { data: { status, notes } });
      expect(res.ok()).toBeTruthy();
      await this.page.waitForTimeout(400);
    }
  }

  /** Reload and confirm the ticket row shows Resolved with our title. */
  async assertResolved(): Promise<void> {
    await reload(this.page);
    const row = this.page.locator("tr, div").filter({ hasText: state.ticketTitle }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await expect(row).toContainText(/resolved/i);
  }
}
