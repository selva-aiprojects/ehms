/**
 * Navigation helpers for the hospitality workflow.
 */
import { type Page, expect } from "@playwright/test";
import { addWarning } from "./state";

/** Navigate and wait for the page to settle on a matching marker. */
export async function go(page: Page, path: string, marker: RegExp): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForPageReady(page);
  try {
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 20_000 });
  } catch {
    addWarning(`Page marker ${marker} not found after navigating to ${path}`);
  }
}

/** Reload the current page and wait for it to settle. */
export async function reload(page: Page): Promise<void> {
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForPageReady(page);
  await page.waitForTimeout(800);
}

/** Wait for network idle-ish state after a navigation. */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(600);
}
