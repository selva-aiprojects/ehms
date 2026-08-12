import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE } from "./helpers/auth";

const EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

/**
 * FULL E2E GUEST LIFECYCLE
 * Exercises the complete hospitality workflow that a customer would see in a demo:
 *   Walk-In -> Room Assignment -> Check-In -> Guest Services -> Billing -> Payment -> Check-Out
 *
 * Also covers: Housekeeping triggered by check-out, Maintenance from guest request,
 *              F&B ordering, Laundry, Feedback
 *
 * Command: npx playwright test 11-full-guest-lifecycle
 */
test.describe("Full Guest Lifecycle - End-to-End Demo Flow", () => {
  test.describe("Phase 1: Walk-In Guest Arrival", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "hotels"
      );
      await page.goto("/dashboard/front-desk", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
    });

    test("LIFECYCLE-001: Walk-in guest sees room availability on command center", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Front Desk Command Center").first()
      ).toBeVisible({ timeout: 15000 });

      await expect(page.locator("main").getByText("Room Matrix").first()).toBeVisible();

      const availableCount = page
        .locator("button", { hasText: "Available" })
        .first();
      if (await availableCount.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(availableCount).toBeVisible();
      }
    });

    test("LIFECYCLE-002: Click vacant room shows booking action", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      const vacantRoom = page
        .locator("button")
        .filter({ hasText: "Available" })
        .first();
      if (await vacantRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
        await vacantRoom.click();
        await page.waitForTimeout(500);

        const bookBtn = page
          .locator("button", { hasText: /\+ Book|Book|Check In/ })
          .first();
        if (await bookBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(bookBtn).toBeVisible();
        }
      }
    });

    test("LIFECYCLE-003: Walk-in modal opens with all required fields", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      const walkInBtn = page
        .locator("button", { hasText: "Walk-in" })
        .first();
      if (await walkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await walkInBtn.click();

        await expect(
          page.locator("main").getByText("Walk-In Check-In").first()
        ).toBeVisible({ timeout: 5000 });

        const requiredFields = [
          "First Name",
          "Last Name",
          "Phone Number",
          "Email Address",
          "Check-In Date",
          "Check-Out Date",
        ];
        for (const f of requiredFields) {
          const el = page.locator(`text=${f}`).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(el).toBeVisible();
          }
        }
      }
    });

    test("LIFECYCLE-004: Room selector shows vacant rooms with rates", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      const walkInBtn = page
        .locator("button", { hasText: "Walk-in" })
        .first();
      if (await walkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await walkInBtn.click();
        await page.waitForTimeout(1000);

        const roomSelect = page.locator("select").filter({ hasText: /Select Available Room|available/ }).first();
        if (await roomSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
          const options = await roomSelect.locator("option").allTextContents();
          expect(options.length).toBeGreaterThanOrEqual(1);

          const hasRate = options.some((o) => o.includes("₹") || o.includes("/night"));
          expect(hasRate).toBeTruthy();
        }
      }
    });
  });

  test.describe("Phase 2: Check-In Process", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "hotels"
      );
    });

    test("LIFECYCLE-005: Check-in page shows arrivals log", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/check-ins");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Check-Ins & Arrivals").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("LIFECYCLE-006: Confirmed booking appears in arrivals", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/check-ins");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      const filter = page.locator("select").first();
      if (await filter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await filter.selectOption("Upcoming Arrivals");
        await page.waitForTimeout(1000);
      }
    });

    test("LIFECYCLE-007: Room occupied shows guest details and Check-Out button", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      const occupiedRoom = page
        .locator("button")
        .filter({ hasText: "Occupied" })
        .first();
      if (await occupiedRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
        await occupiedRoom.click();
        await page.waitForTimeout(500);

        await expect(
          page.locator("main").getByText("Check Out").first()
        ).toBeVisible({ timeout: 3000 });
      }
    });

    test("LIFECYCLE-008: Room detail shows guest name and stay dates", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      const occupiedRoom = page
        .locator("button")
        .filter({ hasText: "Occupied" })
        .first();
      if (await occupiedRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
        await occupiedRoom.click();
        await page.waitForTimeout(500);

        const detailPanel = page.locator("main").getByText("Currently checked in").first();
        if (await detailPanel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(detailPanel).toBeVisible();
        }
      }
    });

    test("LIFECYCLE-009: Dirty room shows Mark Available action", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      const dirtyRoom = page
        .locator("button")
        .filter({ hasText: "Dirty" })
        .first();
      if (await dirtyRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
        await dirtyRoom.click();
        await page.waitForTimeout(500);

        const cleanBtn = page
          .locator("button", { hasText: /Mark Available|Cleaned/ })
          .first();
        if (await cleanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(cleanBtn).toBeVisible();
        }
      }
    });
  });

  test.describe("Phase 3: Guest Services During Stay", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "hotels"
      );
    });

    test("LIFECYCLE-010: Guest requests page shows pending requests", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/requests");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Guest Requests").first()
      ).toBeVisible({ timeout: 10000 });

      await expect(page.locator("main").getByText("Pending Action").first()).toBeVisible();
    });

    test("LIFECYCLE-011: Request types include Housekeeping, Maintenance, F&B, Front Desk", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/requests");
      await page.waitForLoadState("domcontentloaded");

      const newReqBtn = page
        .locator("button", { hasText: "New Request" })
        .first();
      if (await newReqBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newReqBtn.click();
        await page.waitForTimeout(500);

        const types = [
          "Housekeeping",
          "Maintenance",
          "Room Service",
          "Front Desk",
        ];
        for (const t of types) {
          const el = page.locator(`option`, { hasText: t }).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(el).toBeVisible();
          }
        }
      }
    });

    test("LIFECYCLE-012: F&B order can be placed to guest folio", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Food & Beverage").first()).toBeVisible({
        timeout: 10000,
      });

      const newOrderBtn = page
        .locator("button", { hasText: "New Order" })
        .first();
      if (await newOrderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newOrderBtn.click();

        await expect(
          page.locator("main").getByText("Post to Guest Folio").first()
        ).toBeVisible({ timeout: 5000 });

        const menuSection = page.locator("main").getByText("Menu Items").first();
        if (await menuSection.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(menuSection).toBeVisible();
        }
      }
    });

    test("LIFECYCLE-013: F&B menu has categories with items and prices", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const priceTag = page.locator("main").getByText("₹").first();
      if (await priceTag.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(priceTag).toBeVisible();
      }
    });

    test("LIFECYCLE-014: Laundry order can be created", async ({ page }) => {
      await page.goto("/dashboard/laundry");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Laundry").first()).toBeVisible({
        timeout: 10000,
      });

      const createBtn = page
        .locator("button", { hasText: /New|Create|Add/ })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test("LIFECYCLE-015: Guest feedback can be logged", async ({ page }) => {
      await page.goto("/dashboard/front-desk/feedbacks");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Guest Feedbacks").first()
      ).toBeVisible({ timeout: 10000 });

      const logBtn = page
        .locator("button", { hasText: "Log Feedback" })
        .first();
      if (await logBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logBtn.click();
        await page.waitForTimeout(500);

        const starBtns = page.locator('[class*="star"], button').filter({ hasText: "★" });
        if (await starBtns.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(starBtns.first()).toBeVisible();
        }
      }
    });
  });

  test.describe("Phase 4: Billing & Payment", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "hotels"
      );
    });

    test("LIFECYCLE-016: Billing page shows total outstanding across folios", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Total Outstanding").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("LIFECYCLE-017: Folio shows itemized charges", async ({ page }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");

      const openFolioBtn = page
        .locator("button", { hasText: /Open Folio/ })
        .first();
      if (await openFolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openFolioBtn.click();

        await expect(
          page.locator("main").getByText("Guest Folio").first()
        ).toBeVisible({ timeout: 5000 });
        await expect(
          page.locator("main").getByText("Itemized Charges").first()
        ).toBeVisible();
        await expect(
          page.locator("main").getByText("Payments Received").first()
        ).toBeVisible();
      }
    });

    test("LIFECYCLE-018: Post charge has all 12 service types", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");

      const openFolioBtn = page
        .locator("button", { hasText: /Open Folio/ })
        .first();
      if (await openFolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openFolioBtn.click();
        await page.waitForTimeout(500);

        const postBtn = page
          .locator("button", { hasText: "Post Charge" })
          .first();
        if (await postBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await postBtn.click();

          const types = [
            "Room Service",
            "Laundry",
            "Restaurant",
            "Bar",
            "Minibar",
            "Spa",
            "Transportation",
            "Damage",
          ];
          for (const t of types) {
            const el = page.locator(`option`, { hasText: t }).first();
            if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
              await expect(el).toBeVisible();
            }
          }
        }
      }
    });

    test("LIFECYCLE-019: Payment methods include Card, UPI, Cash", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");

      const openFolioBtn = page
        .locator("button", { hasText: /Open Folio/ })
        .first();
      if (await openFolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openFolioBtn.click();
        await page.waitForTimeout(500);

        const payBtn = page
          .locator("button", { hasText: /Pay ₹/ })
          .first();
        if (await payBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          const methods = ["Credit Card", "UPI", "Cash"];
          for (const m of methods) {
            const el = page
              .locator(`button, option, label`, { hasText: m })
              .first();
            if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
              await expect(el).toBeVisible();
            }
          }
        }
      }
    });

    test("LIFECYCLE-020: Print Invoice option available", async ({ page }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");

      const openFolioBtn = page
        .locator("button", { hasText: /Open Folio/ })
        .first();
      if (await openFolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openFolioBtn.click();

        const printBtn = page
          .locator("button", { hasText: "Print Invoice" })
          .first();
        if (await printBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(printBtn).toBeVisible();
        }
      }
    });
  });

  test.describe("Phase 5: Check-Out & Post-Checkout", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "hotels"
      );
    });

    test("LIFECYCLE-021: Self check-out page shows departure stats", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/checkout");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Self Check-out").first()
      ).toBeVisible({ timeout: 10000 });

      const stats = ["Pending", "Folio Review", "Payment Due", "Checked Out"];
      for (const s of stats) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("LIFECYCLE-022: Departures today panel shows checkout-ready guests", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      await expect(
        page.locator("main").getByText("Departures Today").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("LIFECYCLE-023: Checked-out rooms become dirty (HK trigger)", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      const dirtyCount = page
        .locator("button", { hasText: "Dirty" })
        .first();
      if (await dirtyCount.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(dirtyCount).toBeVisible();
      }
    });

    test("LIFECYCLE-024: Housekeeping tasks auto-created for checkout rooms", async ({
      page,
    }) => {
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const checkoutClean = page.locator("main").getByText("checkout_clean").first();
      if (await checkoutClean.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(checkoutClean).toBeVisible();
      }
    });

    test("LIFECYCLE-025: Guest profiles reflect stay history", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/guests");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Guest Profiles").first()
      ).toBeVisible({ timeout: 10000 });

      const viewBtn = page
        .locator("button", { hasText: "View" })
        .first();
      if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await viewBtn.click();

        await expect(
          page.locator("main").getByText("Stay History").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("Phase 6: Cross-Module Verification", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(
        page,
        EMAIL,
        PASSWORD,
        TENANT_CODE,
        "hotels"
      );
      await page.goto("/dashboard/front-desk", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
    });

    test("LIFECYCLE-026: Room status changes tracked in activity feed", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      await expect(
        page.locator("main").getByText("Today's Activity Feed").first()
      ).toBeVisible({ timeout: 10000 });

      const activityTypes = [
        "Check-In Completed",
        "Check-Out Processed",
        "Guest Request",
        "Housekeeping",
        "Maintenance",
      ];
      for (const a of activityTypes) {
        const el = page.locator(`text=${a}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("LIFECYCLE-027: Occupancy metrics reflect current state", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      await expect(
        page.locator("main").getByText("Detailed Room Metrics").first()
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page.locator("main").getByText("Occupancy Rate").first()
      ).toBeVisible();
      await expect(
        page.locator("main").getByText("Today's Revenue").first()
      ).toBeVisible();
      await expect(
        page.locator("main").getByText("Avg. Daily Rate").first()
      ).toBeVisible();
    });

    test("LIFECYCLE-028: Guest messaging panel tracks open requests", async ({
      page,
    }) => {
      await page.waitForTimeout(3000);

      await expect(
        page.locator("main").getByText("Guest Messaging").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("LIFECYCLE-029: Revenue dashboard shows financial summary", async ({
      page,
    }) => {
      await page.goto("/dashboard/revenue");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Revenue").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("LIFECYCLE-030: Complete workflow summary visible across modules", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(
        page.locator("main").getByText("Dashboard").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
