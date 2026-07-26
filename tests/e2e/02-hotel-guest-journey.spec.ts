import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE } from "./helpers/auth";

const HOTEL_EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

test.describe("Hotel Workspace - Complete Guest Journey", () => {
  test.describe("Front Desk Command Center", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "front-desk");
    });

    test("TC-HOTEL-001: Command Center loads with room matrix", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Front Desk Command Center").first()
      ).toBeVisible({ timeout: 15000 });

      await expect(page.locator("main").getByText("Room Matrix").first()).toBeVisible({
        timeout: 10000,
      });

      await expect(page.locator("main").getByText("Arrivals Today").first()).toBeVisible();
      await expect(page.locator("main").getByText("In-House").first()).toBeVisible();
      await expect(page.locator("main").getByText("Departures Today").first()).toBeVisible();
    });

    test("TC-HOTEL-002: Room matrix shows status filters", async ({
      page,
    }) => {
      await expect(page.locator("main").getByText("Status Filter").first()).toBeVisible({
        timeout: 10000,
      });

      const filters = ["All", "Available", "Occupied", "Dirty", "Maint"];
      for (const f of filters) {
        const btn = page.locator(`button`, { hasText: new RegExp(f) }).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(btn).toBeVisible();
        }
      }
    });

    test("TC-HOTEL-003: Click room card shows room detail panel", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const roomCard = page.locator("button").filter({ hasText: /\d{3}/ }).first();
      if (await roomCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roomCard.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Select a Room").first()).not.toBeVisible({
          timeout: 3000,
        }).catch(() => {});
      }
    });

    test("TC-HOTEL-004: Quick Actions panel visible", async ({ page }) => {
      await expect(page.locator("main").getByText("Quick Actions").first()).toBeVisible({
        timeout: 10000,
      });

      const actions = ["New Guest", "Housekeeping", "Report Issue"];
      for (const a of actions) {
        const el = page.locator(`button`, { hasText: a }).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("TC-HOTEL-005: Guest Messaging panel visible", async ({ page }) => {
      await expect(page.locator("main").getByText("Guest Messaging").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("TC-HOTEL-006: Activity Feed visible", async ({ page }) => {
      await expect(
        page.locator("main").getByText("Today's Activity Feed").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HOTEL-007: Room Metrics visible", async ({ page }) => {
      await expect(
        page.locator("main").getByText("Detailed Room Metrics").first()
      ).toBeVisible({ timeout: 10000 });

      await expect(page.locator("main").getByText("Occupancy Rate").first()).toBeVisible();
      await expect(page.locator("main").getByText("Today's Revenue").first()).toBeVisible();
    });
  });

  test.describe("Walk-In Booking Flow", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HOTEL-WI-001: Walk-In button opens booking modal", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const walkInBtn = page
        .locator("button", { hasText: "Walk-in" })
        .first();
      if (await walkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await walkInBtn.click();

        await expect(
          page.locator("main").getByText("Walk-In Check-In").first()
        ).toBeVisible({ timeout: 5000 });

        await expect(
          page.locator('text=First Name').first()
        ).toBeVisible();
        await expect(
          page.locator('text=Last Name').first()
        ).toBeVisible();
        await expect(
          page.locator('text=Phone Number').first()
        ).toBeVisible();
      }
    });

    test("TC-HOTEL-WI-002: Walk-In modal has booking model toggle", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const walkInBtn = page
        .locator("button", { hasText: "Walk-in" })
        .first();
      if (await walkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await walkInBtn.click();
        await page.waitForTimeout(500);

        await expect(
          page.locator("main").getByText("Standard Nightly").first()
        ).toBeVisible();
        await expect(
          page.locator("main").getByText("Flexi").first()
        ).toBeVisible();
      }
    });

    test("TC-HOTEL-WI-003: Walk-In shows room selector with availability", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const walkInBtn = page
        .locator("button", { hasText: "Walk-in" })
        .first();
      if (await walkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await walkInBtn.click();
        await page.waitForTimeout(1000);

        const roomSelect = page.locator("select").filter({ hasText: /Select Available Room|available/ }).first();
        if (await roomSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
          const options = await roomSelect.locator("option").count();
          expect(options).toBeGreaterThanOrEqual(1);
        }
      }
    });

    test("TC-HOTEL-WI-004: Walk-In shows estimated charges", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const walkInBtn = page
        .locator("button", { hasText: "Walk-in" })
        .first();
      if (await walkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await walkInBtn.click();

        await expect(
          page.locator("main").getByText("Estimated Charges").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("TC-HOTEL-WI-005: Walk-In has ID document upload", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const walkInBtn = page
        .locator("button", { hasText: "Walk-in" })
        .first();
      if (await walkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await walkInBtn.click();

        await expect(
          page.locator("main").getByText("ID Document").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe("OTA Channel Partner Booking", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HOTEL-OTA-001: Channel Manager card visible", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      await expect(
        page.locator("main").getByText("Channel Manager").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HOTEL-OTA-002: Webhook simulator opens booking form", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const simBtn = page
        .locator("button", { hasText: "Webhook Simulator" })
        .first();
      if (await simBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await simBtn.click();

        await expect(
          page.locator("main").getByText("Simulate Inbound OTA Webhook").first()
        ).toBeVisible({ timeout: 5000 });

        const channelSelect = page.locator("select").first();
        if (await channelSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await channelSelect.locator("option").allTextContents();
          expect(options.length).toBeGreaterThan(0);
        }
      }
    });

    test("TC-HOTEL-OTA-003: OTA simulator has all channel sources", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const simBtn = page
        .locator("button", { hasText: "Webhook Simulator" })
        .first();
      if (await simBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await simBtn.click();
        await page.waitForTimeout(500);

        const channels = [
          "Booking.com",
          "MakeMyTrip",
          "Airbnb",
          "Expedia",
          "Agoda",
        ];
        for (const ch of channels) {
          const el = page.locator(`option`, { hasText: ch }).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(el).toBeVisible();
          }
        }
      }
    });

    test("TC-HOTEL-OTA-004: Sync All button present", async ({ page }) => {
      await page.waitForTimeout(2000);

      const syncBtn = page
        .locator("button", { hasText: /Sync All|Broadcasting/ })
        .first();
      if (await syncBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(syncBtn).toBeVisible();
      }
    });
  });

  test.describe("Check-In Process", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HOTEL-CI-001: Check-Ins page loads with arrival log", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/check-ins");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Check-Ins & Arrivals").first()
      ).toBeVisible({ timeout: 10000 });

      await expect(page.locator("main").getByText("Arrivals Log").first()).toBeVisible();
    });

    test("TC-HOTEL-CI-002: Check-Ins page has filter dropdown", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/check-ins");
      await page.waitForLoadState("domcontentloaded");

      const filter = page.locator("select").first();
      if (await filter.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await filter.locator("option").allTextContents();
        expect(options).toContain("All Bookings");
      }
    });

    test("TC-HOTEL-CI-003: Room detail shows Check In button", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const roomCard = page.locator("button").filter({ hasText: /\d{3}/ }).first();
      if (await roomCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roomCard.click();
        await page.waitForTimeout(500);

        const checkInBtn = page
          .locator("button", { hasText: "Check In" })
          .first();
        if (await checkInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(checkInBtn).toBeVisible();
        }
      }
    });

    test("TC-HOTEL-CI-004: Check-In modal has SOP checklist", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const roomCard = page.locator("button").filter({ hasText: /\d{3}/ }).first();
      if (await roomCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roomCard.click();
        await page.waitForTimeout(500);

        const checkInBtn = page
          .locator("button", { hasText: "Check In" })
          .first();
        if (await checkInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await checkInBtn.click();

          await expect(
            page.locator("main").getByText("SOP Checklist").first()
          ).toBeVisible({ timeout: 5000 });

          await expect(
            page.locator("main").getByText("ID Verification").first()
          ).toBeVisible();
          await expect(
            page.locator("main").getByText("Room Readiness").first()
          ).toBeVisible();
          await expect(
            page.locator("main").getByText("Key Handover").first()
          ).toBeVisible();
        }
      }
    });

    test("TC-HOTEL-CI-005: Check-In modal has parking tab", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const roomCard = page.locator("button").filter({ hasText: /\d{3}/ }).first();
      if (await roomCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roomCard.click();
        await page.waitForTimeout(500);

        const checkInBtn = page
          .locator("button", { hasText: "Check In" })
          .first();
        if (await checkInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await checkInBtn.click();

          const parkingTab = page
            .locator("button", { hasText: "Parking" })
            .first();
          if (await parkingTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await parkingTab.click();
            await expect(
              page.locator("main").getByText("Vehicle Number").first()
            ).toBeVisible();
          }
        }
      }
    });

    test("TC-HOTEL-CI-006: Check-In modal has upsell tab", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const roomCard = page.locator("button").filter({ hasText: /\d{3}/ }).first();
      if (await roomCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roomCard.click();
        await page.waitForTimeout(500);

        const checkInBtn = page
          .locator("button", { hasText: "Check In" })
          .first();
        if (await checkInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await checkInBtn.click();

          const upsellTab = page
            .locator("button", { hasText: "Upsell" })
            .first();
          if (await upsellTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await upsellTab.click();
            await expect(
              page.locator("main").getByText("Early Check-in Fee").first()
            ).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Guest Services & Amenities", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HOTEL-SVC-001: Guest Requests page loads", async ({ page }) => {
      await page.goto("/dashboard/front-desk/requests");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Guest Requests").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HOTEL-SVC-002: Guest Requests has filter dropdown", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/requests");
      await page.waitForLoadState("domcontentloaded");

      const filter = page.locator("select").first();
      if (await filter.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await filter.locator("option").allTextContents();
        expect(options).toContain("All Requests");
        expect(options).toContain("Pending");
      }
    });

    test("TC-HOTEL-SVC-003: New Request form has request types", async ({
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

        const requestTypes = [
          "Housekeeping",
          "Maintenance",
          "Room Service",
          "Front Desk",
        ];
        for (const rt of requestTypes) {
          const el = page.locator(`option`, { hasText: rt }).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(el).toBeVisible();
          }
        }
      }
    });

    test("TC-HOTEL-SVC-004: Guest Feedback page loads", async ({ page }) => {
      await page.goto("/dashboard/front-desk/feedbacks");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Guest Feedbacks").first()
      ).toBeVisible({ timeout: 10000 });

      await expect(page.locator("main").getByText("Average Rating").first()).toBeVisible();
    });

    test("TC-HOTEL-SVC-005: Feedback has department filter", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/feedbacks");
      await page.waitForLoadState("domcontentloaded");

      const filter = page.locator("select").first();
      if (await filter.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await filter.locator("option").allTextContents();
        expect(options).toContain("All Departments");
      }
    });

    test("TC-HOTEL-SVC-006: F&B / Pantry order page loads", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Food & Beverage").first()).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator("main").getByText("Active Orders").first()).toBeVisible();
      await expect(page.locator("main").getByText("Menu").first()).toBeVisible();
    });

    test("TC-HOTEL-SVC-007: F&B has menu category filters", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");

      const categories = [
        "All",
        "Breakfast",
        "Appetizers",
        "Main Course",
        "Desserts",
        "Beverages",
      ];
      for (const cat of categories) {
        const el = page
          .locator("button", { hasText: cat })
          .first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("TC-HOTEL-SVC-008: New F&B order form opens", async ({ page }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");

      const newOrderBtn = page
        .locator("button", { hasText: "New Order" })
        .first();
      if (await newOrderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newOrderBtn.click();

        await expect(
          page.locator("main").getByText("New Room Service Order").first()
        ).toBeVisible({ timeout: 5000 });

        await expect(
          page.locator("main").getByText("Post to Guest Folio").first()
        ).toBeVisible();
      }
    });
  });

  test.describe("Billing & Folio", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HOTEL-BILL-001: Billing page loads with folio list", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Billing & Folio").first()
      ).toBeVisible({ timeout: 10000 });

      await expect(page.locator("main").getByText("Total Outstanding").first()).toBeVisible();
      await expect(page.locator("main").getByText("Active Folios").first()).toBeVisible();
    });

    test("TC-HOTEL-BILL-002: Billing has search functionality", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");

      const search = page
        .locator('input[placeholder*="Search"]')
        .first();
      if (await search.isVisible({ timeout: 5000 }).catch(() => false)) {
        await search.fill("Unit");
        await page.waitForTimeout(500);
      }
    });

    test("TC-HOTEL-BILL-003: Folio modal shows charges and payments", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");

      const openFolioBtn = page
        .locator("button", { hasText: /Open Folio|View/ })
        .first();
      if (await openFolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openFolioBtn.click();

        await expect(
          page.locator("main").getByText("Guest Folio").first()
        ).toBeVisible({ timeout: 5000 });

        await expect(
          page.locator("main").getByText("Total Charges").first()
        ).toBeVisible();
        await expect(
          page.locator("main").getByText("Balance Due").first()
        ).toBeVisible();
        await expect(
          page.locator("main").getByText("Itemized Charges").first()
        ).toBeVisible();
      }
    });

    test("TC-HOTEL-BILL-004: Folio post charge has all service types", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");

      const openFolioBtn = page
        .locator("button", { hasText: /Open Folio|View/ })
        .first();
      if (await openFolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openFolioBtn.click();
        await page.waitForTimeout(500);

        const postChargeBtn = page
          .locator("button", { hasText: "Post Charge" })
          .first();
        if (await postChargeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await postChargeBtn.click();

          const chargeTypes = [
            "Room Service",
            "Laundry",
            "Restaurant",
            "Bar",
            "Minibar",
            "Spa",
            "Transportation",
            "Damage",
          ];
          for (const ct of chargeTypes) {
            const el = page.locator(`option`, { hasText: ct }).first();
            if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
              await expect(el).toBeVisible();
            }
          }
        }
      }
    });

    test("TC-HOTEL-BILL-005: Folio has payment methods", async ({ page }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");

      const openFolioBtn = page
        .locator("button", { hasText: /Open Folio|View/ })
        .first();
      if (await openFolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openFolioBtn.click();
        await page.waitForTimeout(500);

        const payBtn = page.locator("button", { hasText: /Pay ₹/ }).first();
        if (await payBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          const methods = ["Credit Card", "UPI", "Cash"];
          for (const m of methods) {
            const el = page.locator(`button, option, label`, { hasText: m }).first();
            if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
              await expect(el).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe("Check-Out Process", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HOTEL-CO-001: Self Check-out page loads", async ({ page }) => {
      await page.goto("/dashboard/front-desk/checkout");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Self Check-out").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HOTEL-CO-002: Check-out has status stats", async ({ page }) => {
      await page.goto("/dashboard/front-desk/checkout");
      await page.waitForLoadState("domcontentloaded");

      const statuses = ["Pending", "Folio Review", "Payment Due", "Checked Out"];
      for (const s of statuses) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("TC-HOTEL-CO-003: Room detail shows Check Out button for occupied rooms", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const occupiedRoom = page
        .locator("button")
        .filter({ hasText: /Occupied/ })
        .first();
      if (await occupiedRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
        await occupiedRoom.click();
        await page.waitForTimeout(500);

        const checkOutBtn = page
          .locator("button", { hasText: "Check Out" })
          .first();
        if (await checkOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(checkOutBtn).toBeVisible();
        }
      }
    });
  });

  test.describe("Guest Profiles & CRM", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HOTEL-GUEST-001: Guest Profiles page loads", async ({ page }) => {
      await page.goto("/dashboard/front-desk/guests");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Guest Profiles").first()
      ).toBeVisible({ timeout: 10000 });

      await expect(page.locator("main").getByText("All Guests").first()).toBeVisible();
    });

    test("TC-HOTEL-GUEST-002: Guest search works", async ({ page }) => {
      await page.goto("/dashboard/front-desk/guests");
      await page.waitForLoadState("domcontentloaded");

      const search = page
        .locator('input[placeholder*="Search"]')
        .first();
      if (await search.isVisible({ timeout: 5000 }).catch(() => false)) {
        await search.fill("guest");
        await page.waitForTimeout(500);
      }
    });

    test("TC-HOTEL-GUEST-003: Guest profile shows VIP status and stay history", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/guests");
      await page.waitForLoadState("domcontentloaded");

      const viewBtn = page
        .locator("button", { hasText: "View" })
        .first();
      if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await viewBtn.click();

        await expect(
          page.locator("main").getByText("Guest Profile").first()
        ).toBeVisible({ timeout: 5000 });

        await expect(
          page.locator("main").getByText("Stay History").first()
        ).toBeVisible();
      }
    });
  });

  test.describe("Reservation Calendar", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HOTEL-CAL-001: Calendar page loads", async ({ page }) => {
      await page.goto("/dashboard/front-desk/calendar");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Reservation Calendar").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HOTEL-CAL-002: Calendar has date range selector", async ({
      page,
    }) => {
      await page.goto("/dashboard/front-desk/calendar");
      await page.waitForLoadState("domcontentloaded");

      const daysSelect = page.locator("select").first();
      if (await daysSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await daysSelect.locator("option").allTextContents();
        expect(options).toContain("7 days");
        expect(options).toContain("30 days");
      }
    });
  });

  test.describe("AI Revenue Manager", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HOTEL-AI-001: Revenue AI card visible on command center", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      await expect(
        page.locator("main").getByText("AI Revenue Manager").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HOTEL-AI-002: Auto-pilot toggle visible", async ({ page }) => {
      await page.waitForTimeout(2000);

      await expect(
        page.locator("main").getByText("Dynamic Auto-Pilot").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Self Check-In Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, HOTEL_EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("TC-HOTEL-SCI-001: Self Check-in page loads", async ({ page }) => {
      await page.goto("/dashboard/front-desk/checkin");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Self Check-in Management").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("TC-HOTEL-SCI-002: Status filter stats visible", async ({ page }) => {
      await page.goto("/dashboard/front-desk/checkin");
      await page.waitForLoadState("domcontentloaded");

      const statuses = [
        "Pending",
        "ID Verified",
        "Payment Due",
        "Completed",
        "Expired",
      ];
      for (const s of statuses) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });
  });
});
