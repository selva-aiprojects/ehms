/**
 * OTA page object: channel manager sync overview + logs.
 */
import { type Page } from "@playwright/test";
import { go } from "../helpers/navigation";
import { retryClick, expectText, softCheck } from "../helpers/actions";

export class OtaPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await go(this.page, "/dashboard/ota", /OTA Channel Manager/);
  }

  /** Verify channel dashboard and sync logs tab. */
  async assertChannels(): Promise<void> {
    await expectText(this.page, "Sync All Channels", 15_000);
    await expectText(this.page, "Active Mappings", 15_000);

    await retryClick(this.page, this.page.getByRole("button", { name: /Sync Logs/i }));
    await expectText(this.page, /Sync Log/i, 15_000);
    await softCheck(this.page, /OTA Settlements/i, "Settlements section");
  }
}
