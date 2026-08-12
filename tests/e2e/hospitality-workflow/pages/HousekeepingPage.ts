/**
 * Housekeeping page object: task creation and completion with QA checklist.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go, reload } from "../helpers/navigation";
import { fillByLabel, pickSelectOption, retryClick, waitForToast } from "../helpers/actions";

export class HousekeepingPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/housekeeping", /Housekeeping/);
  }

  /** Dispatch a high-priority stayover tidy task for the booked unit. */
  async createTask(): Promise<void> {
    await retryClick(this.page, this.page.getByRole("button", { name: /New Task/i }));

    const modal = this.page.locator("div.fixed").filter({ hasText: "Assign Housekeeping Task" }).last();
    await expect(modal).toBeVisible({ timeout: 15_000 });

    await this.page.waitForFunction(() => {
      const labels = Array.from(document.querySelectorAll("label"));
      const lab = labels.find((l) => l.textContent?.includes("Target Room / Unit"));
      const select = lab?.nextElementSibling as HTMLSelectElement | null;
      return !!select && select.options.length > 1;
    }, undefined, { timeout: 20_000 });

    await pickSelectOption(this.page, "Target Room / Unit", { value: state.unitId });
    await pickSelectOption(this.page, "Task Type", { label: "Stayover Tidy" });
    await pickSelectOption(this.page, "Priority", { label: "High" });
    await fillByLabel(this.page, "Special Instructions", "Guest checked in today; restock amenities.");

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/tasks") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await retryClick(this.page, modal.getByRole("button", { name: /Create & Dispatch Task/i }));

    const resp = await respPromise;
    const json = (await resp.json()) as any;
    state.taskId = json?.data?.id || "";

    await waitForToast(this.page, "Task created and dispatched!", { critical: true });
    await this.page.waitForTimeout(1500);
  }

  /** Start → Complete the task via the QA checklist modal. */
  async completeTask(): Promise<void> {
    await reload(this.page);

    const row = this.page.locator("div").filter({ hasText: state.unitLabel }).filter({ hasText: "Stayover Tidy" }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });

    await retryClick(this.page, row.getByRole("button", { name: /Start/i }));
    await this.page.waitForTimeout(800);

    await retryClick(this.page, row.getByRole("button", { name: /Complete/i }));

    const checklist = this.page.locator("div.fixed").filter({ hasText: "Quality Assurance Checklist" }).last();
    await expect(checklist).toBeVisible({ timeout: 15_000 });

    const checkboxes = checklist.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    const completeBtn = checklist.getByRole("button", { name: /Complete Task/i });
    await expect(completeBtn).toBeEnabled({ timeout: 5_000 });
    await completeBtn.click();

    await waitForToast(this.page, "Task marked as resolved", { critical: false });
    await this.page.waitForTimeout(1500);
  }
}
