import { test, expect } from "@playwright/test";
import { loginAsTenantUser, DEMO_USERS, waitForPageReady } from "./helpers/auth";

test.describe("Module 08: HRMS & Payroll Module", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(
      page,
      DEMO_USERS.hr.email,
      DEMO_USERS.hr.password,
      "VISWA",
      "hotels"
    );
  });

  test("08.1 HRMS Overview & Headcount Metrics", async ({ page }) => {
    await page.goto("/dashboard/hr", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/HRMS|Headcount|Employees|Department/i);
  });

  test("08.2 Employee Directory", async ({ page }) => {
    await page.goto("/dashboard/hr/employees", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Employees|Directory|Onboarding/i);
  });

  test("08.3 Timesheets & Attendance Tracking", async ({ page }) => {
    await page.goto("/dashboard/hr/timesheet", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Timesheet|Attendance|Clock|Overtime/i);
  });

  test("08.4 Leave Management & Approvals", async ({ page }) => {
    await page.goto("/dashboard/hr/leave", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Leave|Requests|Approval|Balance/i);
  });

  test("08.5 Shift Rosters & Scheduling", async ({ page }) => {
    await page.goto("/dashboard/hr/shifts", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Shifts|Roster|Morning|Night/i);
  });

  test("08.6 Automated Payroll Execution", async ({ page }) => {
    await page.goto("/dashboard/hr/payroll", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Payroll|Salary|Slips|Deductions/i);
  });

  test("08.7 Statutory Compliance (PF/ESI/TDS)", async ({ page }) => {
    await page.goto("/dashboard/hr/compliance", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Compliance|PF|ESI|TDS/i);
  });

  test("08.8 HR Masters & Department Setup", async ({ page }) => {
    await page.goto("/dashboard/hr/masters", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Masters|Departments|Designations|Bands/i);
  });

  test("08.9 HR Settings & Master Configurations", async ({ page }) => {
    await page.goto("/dashboard/hr/settings", { waitUntil: "domcontentloaded" });
    await waitForPageReady(page);

    await expect(page.locator("body")).toContainText(/Departments|Designations|Employee Bands|Salary Structures/i);
  });
});
