import { defineConfig, devices } from "@playwright/test";

/**
 * Dedicated Playwright config for the unified Hospitality E2E workflow.
 *
 * Run from repo root:
 *   npx playwright test -c tests/e2e/hospitality-workflow/playwright.config.ts
 *   npx playwright test -c tests/e2e/hospitality-workflow/playwright.config.ts --headed
 *
 * Environment variables:
 *   BASE_URL              Target app origin (default: https://hostsphere.cybelinx.com)
 *   TENANT_CODE           Tenant shard code (default: VISWA)
 *   SUPERADMIN_USERNAME   Login identifier (default: raghu.superadmin)
 *   SUPERADMIN_PASSWORD   Password (REQUIRED; no production fallback)
 *   RUN_LOCAL=1           Also boot the local dev server via webServer block
 */
const BASE_URL = process.env.BASE_URL || "https://hostsphere.cybelinx.com";

export default defineConfig({
  testDir: ".",
  testMatch: /hospitality-workflow\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "./playwright-report" }],
    ["json", { outputFile: "./test-results/hospitality-workflow.json" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  outputDir: "./test-results",
  timeout: 30 * 60 * 1000,
  expect: {
    timeout: 15_000,
  },
  ...(process.env.RUN_LOCAL
    ? {
        webServer: {
          command: "npm run dev",
          url: BASE_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }
    : {}),
});
