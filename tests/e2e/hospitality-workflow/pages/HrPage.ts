/**
 * HR page object: employee onboarding + monthly payroll run lifecycle.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { go, reload } from "../helpers/navigation";
import { fillByLabel, pickSelectOption, pickSelectIfAvailable, retryClick, waitForToast, expectText } from "../helpers/actions";
import { randomEmployeeName, randomEmployeeEmail, randomPhone, randomSalary, previousMonthRange } from "../helpers/test-data";

export class HrPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/hr/employees", /Employees/);
  }

  /** Add a new employee under the active property. */
  async addEmployee(): Promise<void> {
    state.employeeName = randomEmployeeName();
    state.employeeEmail = randomEmployeeEmail(state.employeeName);

    await retryClick(this.page, this.page.getByRole("button", { name: /Add Employee/i }));

    const modal = this.page.locator("div.fixed").filter({ hasText: "Add New Employee" }).last();
    await expect(modal).toBeVisible({ timeout: 15_000 });

    const [first, last] = state.employeeName.split(" ");
    await fillByLabel(this.page, "First Name", first);
    if (last) await fillByLabel(this.page, "Last Name", last);
    await fillByLabel(this.page, "Work Email", state.employeeEmail);
    await fillByLabel(this.page, "Phone", randomPhone());
    await pickSelectIfAvailable(this.page, "Department", { index: 1 });
    await fillByLabel(this.page, "Designation", "Guest Services Associate");
    await pickSelectIfAvailable(this.page, "Employment Type", { index: 1 });
    await fillByLabel(this.page, "Date of Joining", "2025-07-01");
    await fillByLabel(this.page, "Base Salary", String(randomSalary()));

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/hr/employees") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await retryClick(this.page, modal.getByRole("button", { name: /^Save$/i }));
    const resp = await respPromise;
    expect(resp.ok()).toBeTruthy();
    const json = (await resp.json()) as any;
    state.employeeId = json?.data?.id || "";

    await expectText(this.page, /added successfully/i, 15_000);
    await this.page.waitForTimeout(1500);
  }

  /** Run payroll for the previous month and advance it to paid. */
  async runPayroll(): Promise<void> {
    const [start, end] = previousMonthRange();

    await go(this.page, "/dashboard/hr/payroll", /Payroll/);
    await retryClick(this.page, this.page.getByRole("button", { name: /Run Payroll/i }));

    const modal = this.page.locator("div.fixed").filter({ hasText: "Run Payroll" }).last();
    await expect(modal).toBeVisible({ timeout: 15_000 });

    await pickSelectOption(this.page, "Property", { value: state.propertyId });
    await fillByLabel(this.page, "Period Start", start);
    await fillByLabel(this.page, "Period End", end);

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes("/api/hr/payroll") && res.request().method() === "POST",
      { timeout: 30_000 }
    );

    await retryClick(this.page, modal.getByRole("button", { name: /Run Payroll/i }));
    const resp = await respPromise;
    const json = (await resp.json()) as any;
    state.payrollRunId = json?.data?.id || "";

    await this.page.waitForTimeout(2000);
    await this.assertRunRowVisible();
  }

  private runIdShort(): string {
    return state.payrollRunId.slice(0, 8);
  }

  private runRow(): import("@playwright/test").Locator {
    return this.page.locator("tr").filter({ hasText: this.runIdShort() }).first();
  }

  private async assertRunRowVisible(): Promise<void> {
    const row = this.runRow();
    await expect(row).toBeVisible({ timeout: 20_000 });
  }

  /** Drive the payroll run through compute → approve → paid. */
  async advancePayrollToPaid(): Promise<void> {
    await reload(this.page);
    const runRow = this.runRow();
    await expect(runRow).toBeVisible({ timeout: 20_000 });

    await runRow.getByRole("button", { name: /Compute/i }).click();
    await expect(runRow).toContainText(/computed/i, { timeout: 15_000 });

    await runRow.getByRole("button", { name: /Approve/i }).click();
    await expect(runRow).toContainText(/approved/i, { timeout: 15_000 });

    await runRow.getByRole("button", { name: /Mark Paid/i }).click();
    await expect(runRow).toContainText(/paid/i, { timeout: 15_000 });
  }

  /** Verify the employee appears in the payroll detail breakdown. */
  async assertEmployeeInPayroll(): Promise<void> {
    await reload(this.page);
    const runRow = this.runRow();
    await runRow.getByRole("button", { name: /View Details|Details/i }).click();

    await expect(this.page.getByText(state.employeeName).first()).toBeVisible({ timeout: 20_000 });
  }
}
