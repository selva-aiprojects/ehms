/**
 * Business dashboard page object: KPI assertions.
 */
import { type Page } from "@playwright/test";
import { go } from "../helpers/navigation";
import { expectText, softCheck } from "../helpers/actions";

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard", /Dashboard|Overview/);
  }

  /** Assert the core KPI cards render. */
  async assertKpis(): Promise<void> {
    await expectText(this.page, "Total Revenue", 15_000);
    await expectText(this.page, "Occupancy Rate", 15_000);
    await softCheck(this.page, /Front Desk|Check-Ins|In-House/i, "Dashboard quick metrics");
  }
}
