/**
 * Shared UI interaction helpers for the hospitality workflow.
 */
import { type Page, type Locator, expect } from "@playwright/test";
import { state, addWarning } from "./state";
import { extractNumber } from "./test-data";

/** Path to a real file used as the guest ID proof upload. */
export function idProofPath(): string {
  return require("path").join(__dirname, "..", "fixtures", "id-proof.txt");
}

/** Fill a labeled input by its visible label text (case-insensitive). */
export async function fillByLabel(page: Page, labelText: string, value: string): Promise<void> {
  const locator = page.getByLabel(labelText, { exact: false }).first();
  await locator.fill(value, { timeout: 10_000 });
}

/** Pick an option from a labeled select. Returns the select locator. */
export async function pickSelectOption(
  page: Page,
  labelText: string,
  choice: { value?: string; label?: string | RegExp; index?: number }
): Promise<Locator> {
  const label = page.getByText(labelText, { exact: false }).first();
  await label.waitFor({ state: "visible", timeout: 15_000 });
  const select = label.locator("xpath=following-sibling::select").first();
  await select.waitFor({ state: "visible", timeout: 10_000 });

  if (choice.value !== undefined) {
    await select.selectOption({ value: choice.value });
  } else if (choice.label !== undefined) {
    await select.selectOption({ label: choice.label as any });
  } else if (choice.index !== undefined) {
    await select.selectOption({ index: choice.index });
  }
  return select;
}

/** Best-effort select that warns instead of failing when the field is unavailable. */
export async function pickSelectIfAvailable(
  page: Page,
  labelText: string,
  choice: { value?: string; label?: string | RegExp; index?: number }
): Promise<Locator | undefined> {
  try {
    return await pickSelectOption(page, labelText, choice);
  } catch (err) {
    addWarning(`Optional select "${labelText}" could not be set: ${(err as Error).message}`);
    return undefined;
  }
}

/** Retry a click a few times, tolerating transient overlays/animations. */
export async function retryClick(page: Page, locator: Locator, attempts = 4): Promise<void> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await locator.click({ timeout: 10_000 });
      return;
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(700);
    }
  }
  throw lastError;
}

/** Wait for a toast that contains the given text. */
export async function waitForToast(page: Page, text: string | RegExp, opts?: { critical?: boolean }): Promise<void> {
  const locator = page.locator("[class*='toast'], [role='status']").filter({ hasText: text }).first();
  const timeout = opts?.critical ? 20_000 : 15_000;
  try {
    await locator.waitFor({ state: "visible", timeout });
    if (opts?.critical) {
      expect(locator).toBeVisible();
    }
  } catch (err) {
    if (opts?.critical) throw err;
    addWarning(`Toast "${text}" not observed (non-critical)`);
  }
}

/** Assert a text fragment becomes visible. */
export async function expectText(page: Page, text: string | RegExp, timeout = 15_000): Promise<void> {
  await expect(page.getByText(text).first()).toBeVisible({ timeout });
}

/** Best-effort text assertion that degrades to a warning. */
export async function softCheck(page: Page, text: string | RegExp, label: string, timeout = 10_000): Promise<void> {
  try {
    await page.getByText(text).first().waitFor({ state: "visible", timeout });
  } catch {
    addWarning(`Soft check failed for "${label}" (text: ${text})`);
  }
}
