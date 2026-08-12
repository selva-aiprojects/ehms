import { type Page, type Locator, expect } from "@playwright/test";

export async function fillInput(page: Page, placeholder: string, value: string): Promise<void> {
  const input = page.locator(`input[placeholder="${placeholder}"]`);
  await input.fill(value);
}

export async function clickButtonByText(page: Page, text: string): Promise<void> {
  const btn = page.locator("button", { hasText: text }).first();
  await btn.click();
}

export async function expectVisible(page: Page, text: string, timeout: number = 10000): Promise<void> {
  await expect(page.locator("main").getByText(text, { exact: false }).first()).toBeVisible({ timeout });
}

export async function expectNotVisible(page: Page, text: string, timeout: number = 5000): Promise<void> {
  await expect(page.locator("main").getByText(text, { exact: false }).first()).not.toBeVisible({ timeout });
}

export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 15000
): Promise<void> {
  await page.waitForResponse(
    (resp) =>
      (typeof urlPattern === "string"
        ? resp.url().includes(urlPattern)
        : urlPattern.test(resp.url())) &&
      resp.status() >= 200 &&
      resp.status() < 400,
    { timeout }
  );
}

export async function selectDropdownOption(page: Page, selectLocator: Locator, optionValue: string): Promise<void> {
  await selectLocator.selectOption(optionValue);
}

export async function closeModal(page: Page): Promise<void> {
  const closeBtn = page.locator('[class*="fixed"] button').first();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
}

export async function tableHasRows(page: Page, timeout: number = 10000): Promise<boolean> {
  try {
    const rows = page.locator("table tbody tr, [class*='table'] [class*='row']");
    await rows.first().waitFor({ state: "visible", timeout });
    const count = await rows.count();
    return count > 0;
  } catch {
    return false;
  }
}

export async function getCardCount(page: Page, selector: string = "[class*='card'], [class*='Card']"): Promise<number> {
  return page.locator(selector).count();
}

export async function expectNoConsoleErrors(page: Page, action: () => Promise<void>): Promise<void> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await action();
  await page.waitForTimeout(1000);
  const criticalErrors = errors.filter(
    (e) => !e.includes("favicon") && !e.includes("404") && !e.includes("hydrat")
  );
  expect(criticalErrors).toHaveLength(0);
}
