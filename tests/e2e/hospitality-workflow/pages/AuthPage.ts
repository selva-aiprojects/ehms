/**
 * Auth & navigation page object.
 * Logs in as the tenant Super Admin and selects the active property.
 */
import { type Page, expect } from "@playwright/test";
import { state } from "../helpers/state";
import { waitForPageReady, go } from "../helpers/navigation";
import { softCheck } from "../helpers/actions";
import { TENANT_CODE, DEMO_USERS } from "../../helpers/auth";

function superAdminEmail(): string {
  const raw = process.env.SUPERADMIN_USERNAME || DEMO_USERS.superAdmin.email;
  return raw.includes("@") ? raw : `${raw}@ehms.demo`;
}

export class AuthPage {
  constructor(private readonly page: Page) {}

  async loginAsSuperAdmin(): Promise<void> {
    const tenantCode = process.env.TENANT_CODE || TENANT_CODE;
    const email = superAdminEmail();
    const password = process.env.SUPERADMIN_PASSWORD || DEMO_USERS.superAdmin.password;

    await this.page.goto(`/login?tenant=${tenantCode}`, { waitUntil: "domcontentloaded" });
    await this.page.waitForSelector('input[type="email"]', { timeout: 30_000 });

    await this.page.locator('input[type="email"]').first().fill(email);
    await this.page.locator('input[type="password"]').first().fill(password);
    await this.page.locator('form button[type="submit"]').first().click({ force: true });

    await this.page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await waitForPageReady(this.page);
  }

  /**
   * Super Admins see the "Active Property" selector in the header.
   * Select the first real workspace so property-scoped pages render data.
   */
  async selectActiveProperty(): Promise<void> {
    const select = this.page.locator("header select").first();
    await expect(select).toBeVisible({ timeout: 20_000 });
    await this.page.waitForFunction(() => {
      const el = document.querySelector("header select") as HTMLSelectElement | null;
      return !!el && el.options.length > 1;
    }, undefined, { timeout: 20_000 });

    await select.selectOption({ index: 1 });
    await this.page.waitForTimeout(600);

    state.propertyId = await select.inputValue();
    state.propertyName = await select.locator("option:checked").textContent().then((t) => (t || "").trim());
  }

  /** Verify the expected sidebar navigation modules exist for the Super Admin role. */
  async assertSidebarModules(): Promise<void> {
    await expect(this.page.locator("aside, nav, [class*='sidebar']").first()).toBeVisible({ timeout: 15_000 });
    const expected = [
      "Command Center",
      "Housekeeping",
      "Maintenance",
      "Finance",
      "HRMS",
      "Inventory",
      "Procurement",
      "OTA Channels",
      "Loyalty",
      "Feedbacks",
      "Billing & Folio",
      "F&B / Pantry",
    ];
    for (const label of expected) {
      await softCheck(this.page, label, `Sidebar nav item "${label}"`);
    }
  }

  async gotoDashboard(): Promise<void> {
    await go(this.page, "/dashboard", /Dashboard/);
  }
}
