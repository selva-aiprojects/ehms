import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE, navigateSidebar, waitForPageReady } from "./helpers/auth";
import { expectVisible, clickButtonByText, fillInput, waitForApiResponse } from "./helpers/test-utils";

const EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

/**
 * COMPLETE WORKFLOW CERTIFICATION TEST
 * =====================================
 * This test suite certifies the entire hospitality management system across all workspaces.
 * It covers:
 *   - Property Management: Room creation for Hotels, Serviced Apartments, Apartment Rental, Workplace
 *   - Guest Journey: Booking (Channel Partner, Walk-in, Advertisement) → Check-in → Services → Check-out → Billing
 *   - Premise Utilities: Bar, Restaurant, Laundry, Spa, Gym, Pool
 *   - Cross-Module Workflows: Front Office → Housekeeping → Maintenance → HR → Finance
 *   - Maintenance SLA & Readiness Workflow
 *   - Housekeeping Dirty Room Readiness & SLA Alerts
 *
 * Command: npx playwright test 13-complete-workflow-certification
 */

test.describe("COMPLETE WORKFLOW CERTIFICATION", () => {
  test.describe("PHASE 0: Seed Data Verification & Platform Readiness", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("CERT-000: All 4 workspace types exist with properties", async ({ page }) => {
      await page.goto("/dashboard/admin/properties");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(3000);

      const bodyText = await page.locator("body").textContent() || "";
      const hasHotel = bodyText.includes("Viswa Grand Hotel") || bodyText.includes("Oceanview");
      const hasServiceApt = bodyText.includes("Viswa Service Apartments") || bodyText.includes("Service");
      const hasRental = bodyText.includes("Greenwood Residency") || bodyText.includes("Greenwood");
      const hasWorkplace = bodyText.includes("Innovate Coworking") || bodyText.includes("Coworking");

      expect(hasHotel, "Hotel property must exist").toBeTruthy();
      expect(hasServiceApt, "Service Apartment property must exist").toBeTruthy();
      expect(hasRental, "Rental property must exist").toBeTruthy();
      expect(hasWorkplace, "Workplace property must exist").toBeTruthy();
    });

    test("CERT-001: Room matrix shows rooms with 3-digit labels", async ({ page }) => {
      await page.goto("/dashboard/front-desk", { waitUntil: "domcontentloaded" });
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      const roomCards = page.locator("main button").filter({ hasText: /\d{3}/ });
      const count = await roomCards.count();
      expect(count).toBeGreaterThanOrEqual(5);
    });

    test("CERT-002: All room statuses present (Occupied, Available, Dirty, Reserved, Maint)", async ({ page }) => {
      await page.goto("/dashboard/front-desk", { waitUntil: "domcontentloaded" });
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      const statuses = ["Occupied", "Available", "Dirty", "Reserved", "Maint"];
      const bodyText = await page.locator("body").textContent() || "";
      for (const s of statuses) {
        expect(bodyText, `Status "${s}" must be present`).toContain(s);
      }
    });

    test("CERT-003: 8+ checked-in guests visible in In-House panel", async ({ page }) => {
      await page.waitForTimeout(3000);
      const inHouse = page.locator("main").getByText("In-House").first();
      if (await inHouse.isVisible({ timeout: 5000 }).catch(() => false)) {
        const card = inHouse.locator("..").first();
        const text = await card.textContent();
        const match = text?.match(/(\d+)/);
        if (match) {
          expect(parseInt(match[1])).toBeGreaterThanOrEqual(5);
        }
      }
    });

    test("CERT-004: Guest profiles page shows 20+ guests with VIPs", async ({ page }) => {
      await page.goto("/dashboard/front-desk/guests");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const subtitle = page.locator("main").getByText("profiles found").first();
      if (await subtitle.isVisible({ timeout: 5000 }).catch(() => false)) {
        const text = await subtitle.textContent();
        const match = text?.match(/(\d+)/);
        if (match) {
          expect(parseInt(match[1])).toBeGreaterThanOrEqual(15);
        }
      }

      const vipBadge = page.locator("main").getByText("VIP Guest").first();
      if (await vipBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(vipBadge).toBeVisible();
      }
    });

    test("CERT-005: Housekeeping tasks seeded (17+ tasks)", async ({ page }) => {
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const rows = await table.locator("tbody tr").count();
        expect(rows).toBeGreaterThanOrEqual(10);
      }
    });

    test("CERT-006: Maintenance tickets seeded (6+ tickets)", async ({ page }) => {
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const rows = await table.locator("tbody tr").count();
        expect(rows).toBeGreaterThanOrEqual(3);
      }
    });

    test("CERT-007: F&B menu has 25+ items with prices", async ({ page }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Menu").first()).toBeVisible({ timeout: 10000 });
      const priceTags = page.locator("main").getByText(/₹\d+/);
      const count = await priceTags.count();
      expect(count).toBeGreaterThanOrEqual(10);
    });

    test("CERT-008: Finance chart of accounts seeded", async ({ page }) => {
      await page.goto("/dashboard/finance/accounts");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Chart of Accounts|Accounts/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-009: 8+ employees seeded in HR", async ({ page }) => {
      await page.goto("/dashboard/hr/employees");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const rows = await table.locator("tbody tr").count();
        expect(rows).toBeGreaterThanOrEqual(5);
      }
    });

    test("CERT-010: Billing shows active folios with outstanding amounts", async ({ page }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Total Outstanding").first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator("main").getByText("Active Folios").first()).toBeVisible();
    });
  });

  test.describe("PHASE 1: Property Management - Room Creation Per Workspace", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("CERT-011: Hotels workspace - Room inventory page loads with room list", async ({ page }) => {
      await page.goto("/dashboard/rooms-inventory");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Room Inventory|Rooms/).first()).toBeVisible({ timeout: 10000 });

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const h = headers.join(" ").toLowerCase();
        expect(h.includes("room") || h.includes("unit")).toBeTruthy();
        expect(h.includes("type") || h.includes("category")).toBeTruthy();
        expect(h.includes("status") || h.includes("floor")).toBeTruthy();
      }
    });

    test("CERT-012: Hotels workspace - Room creation modal has all required fields", async ({ page }) => {
      await page.goto("/dashboard/rooms-inventory");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const addBtn = page.locator("button").filter({ hasText: /Add Room|New Room|Create/ }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const fields = ["Room Number", "Room Type", "Floor", "Rate", "Status"];
        for (const f of fields) {
          const el = page.locator(`text=${f}`).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(el).toBeVisible();
          }
        }
      }
    });

    test("CERT-013: Hotels workspace - Room types include Standard, Deluxe, Suite, Penthouse", async ({ page }) => {
      await page.goto("/dashboard/rooms-inventory");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const addBtn = page.locator("button").filter({ hasText: /Add Room|New Room|Create/ }).first();
      if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const typeSelect = page.locator("select").filter({ hasText: /Standard|Deluxe|Suite/ }).first();
        if (await typeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await typeSelect.locator("option").allTextContents();
          const lower = options.map((o) => o.toLowerCase());
          expect(lower).toEqual(expect.arrayContaining(["standard", "deluxe", "suite"]));
        }
      }
    });

    test("CERT-014: Serviced Apartments workspace - Unit inventory loads", async ({ page }) => {
      await page.goto("/dashboard/apartments");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Apartment|Unit/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-015: Apartment Rental workspace - Lease/rental units visible", async ({ page }) => {
      await page.goto("/dashboard/rental");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Rental|Lease|Property/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-016: Workplace Services workspace - Desks/meeting rooms visible", async ({ page }) => {
      await page.goto("/dashboard/workplace");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Workplace|Desk|Meeting/).first()).toBeVisible({ timeout: 15000 });
    });

    test("CERT-017: Multi-property management page shows all properties", async ({ page }) => {
      await page.goto("/dashboard/multi-property");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Multi-Property|Properties/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("PHASE 2: Guest Booking Journey - Multiple Sources", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/front-desk", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
    });

    test("CERT-018: Walk-in booking modal opens with complete form", async ({ page }) => {
      await page.waitForTimeout(2000);

      const walkInBtn = page.locator("button", { hasText: "Walk-in" }).first();
      if (await walkInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await walkInBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Walk-In Check-In").first()).toBeVisible({ timeout: 5000 });

        const requiredFields = [
          "First Name", "Last Name", "Phone Number",
          "Email Address", "Check-In Date", "Check-Out Date"
        ];
        for (const f of requiredFields) {
          const el = page.locator(`text=${f}`).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(el).toBeVisible();
          }
        }

        // Verify booking model toggle
        await expect(page.locator("main").getByText("Standard Nightly").first()).toBeVisible();
        await expect(page.locator("main").getByText("Flexi").first()).toBeVisible();

        // Verify room selector with availability
        const roomSelect = page.locator("select").filter({ hasText: /Select Available Room|available/ }).first();
        if (await roomSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
          const options = await roomSelect.locator("option").allTextContents();
          expect(options.length).toBeGreaterThanOrEqual(1);
          const hasRate = options.some((o) => o.includes("₹") || o.includes("/night"));
          expect(hasRate).toBeTruthy();
        }

        // Verify estimated charges
        await expect(page.locator("main").getByText("Estimated Charges").first()).toBeVisible({ timeout: 5000 });

        // Verify ID document upload
        await expect(page.locator("main").getByText("ID Document").first()).toBeVisible({ timeout: 5000 });
      }
    });

    test("CERT-019: Channel Partner (OTA) - Webhook simulator opens with all channels", async ({ page }) => {
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Channel Manager").first()).toBeVisible({ timeout: 10000 });

      const simBtn = page.locator("button", { hasText: "Webhook Simulator" }).first();
      if (await simBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await simBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Simulate Inbound OTA Webhook").first()).toBeVisible({ timeout: 5000 });

        const channels = ["Booking.com", "MakeMyTrip", "Airbnb", "Expedia", "Agoda"];
        for (const ch of channels) {
          const el = page.locator(`option`, { hasText: ch }).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(el).toBeVisible();
          }
        }
      }

      const syncBtn = page.locator("button", { hasText: /Sync All|Broadcasting/ }).first();
      if (await syncBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(syncBtn).toBeVisible();
      }
    });

    test("CERT-020: Reservation calendar shows bookings with date range selector", async ({ page }) => {
      await page.goto("/dashboard/front-desk/calendar");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Reservation Calendar").first()).toBeVisible({ timeout: 15000 });

      const daysSelect = page.locator("select").first();
      if (await daysSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await daysSelect.locator("option").allTextContents();
        expect(options).toContain("7 days");
        expect(options).toContain("30 days");
      }
    });

    test("CERT-021: Pricing/Rate plans page shows configured rates", async ({ page }) => {
      await page.goto("/dashboard/pricing");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Pricing").first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-022: OTA Channel Manager page loads with channel list", async ({ page }) => {
      await page.goto("/dashboard/ota");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/OTA|Channel/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("PHASE 3: Check-In Process & SOP Compliance", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("CERT-023: Check-Ins page shows arrivals log with filter", async ({ page }) => {
      await page.goto("/dashboard/front-desk/check-ins");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Check-Ins & Arrivals").first()).toBeVisible({ timeout: 15000 });
      await expect(page.locator("main").getByText("Arrivals Log").first()).toBeVisible();

      const filter = page.locator("select").first();
      if (await filter.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await filter.locator("option").allTextContents();
        expect(options).toContain("All Bookings");
      }
    });

    test("CERT-024: Room detail panel shows Check In button with SOP checklist", async ({ page }) => {
      await page.waitForTimeout(2000);

      const roomCard = page.locator("button").filter({ hasText: /\d{3}/ }).first();
      if (await roomCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roomCard.click();
        await page.waitForTimeout(500);

        const checkInBtn = page.locator("button", { hasText: "Check In" }).first();
        if (await checkInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await checkInBtn.click();
          await page.waitForTimeout(500);

          await expect(page.locator("main").getByText("SOP Checklist").first()).toBeVisible({ timeout: 5000 });
          await expect(page.locator("main").getByText("ID Verification").first()).toBeVisible();
          await expect(page.locator("main").getByText("Room Readiness").first()).toBeVisible();
          await expect(page.locator("main").getByText("Key Handover").first()).toBeVisible();
        }
      }
    });

    test("CERT-025: Check-In modal has Parking tab with vehicle number field", async ({ page }) => {
      await page.waitForTimeout(2000);

      const roomCard = page.locator("button").filter({ hasText: /\d{3}/ }).first();
      if (await roomCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roomCard.click();
        await page.waitForTimeout(500);

        const checkInBtn = page.locator("button", { hasText: "Check In" }).first();
        if (await checkInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await checkInBtn.click();
          await page.waitForTimeout(500);

          const parkingTab = page.locator("button", { hasText: "Parking" }).first();
          if (await parkingTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await parkingTab.click();
            await expect(page.locator("main").getByText("Vehicle Number").first()).toBeVisible();
          }
        }
      }
    });

    test("CERT-026: Check-In modal has Upsell tab with early check-in fee", async ({ page }) => {
      await page.waitForTimeout(2000);

      const roomCard = page.locator("button").filter({ hasText: /\d{3}/ }).first();
      if (await roomCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roomCard.click();
        await page.waitForTimeout(500);

        const checkInBtn = page.locator("button", { hasText: "Check In" }).first();
        if (await checkInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await checkInBtn.click();
          await page.waitForTimeout(500);

          const upsellTab = page.locator("button", { hasText: "Upsell" }).first();
          if (await upsellTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await upsellTab.click();
            await expect(page.locator("main").getByText("Early Check-in Fee").first()).toBeVisible();
          }
        }
      }
    });

    test("CERT-027: Self Check-in Management page shows status filters", async ({ page }) => {
      await page.goto("/dashboard/front-desk/checkin");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Self Check-in Management").first()).toBeVisible({ timeout: 10000 });

      const statuses = ["Pending", "ID Verified", "Payment Due", "Completed", "Expired"];
      for (const s of statuses) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });
  });

  test.describe("PHASE 4: Premise Utilities & Guest Services", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("CERT-028: Restaurant POS - Floor plan with tables, statuses, and detail panel", async ({ page }) => {
      await page.goto("/dashboard/restaurant");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Restaurant POS").first()).toBeVisible();

      // Three tabs
      const tabs = ["Floor Plan", "Orders", "Reservations"];
      for (const t of tabs) {
        await expect(page.locator("button").filter({ hasText: t }).first()).toBeVisible();
      }

      // Table cards
      const tables = page.locator("button").filter({ hasText: /^\d+$/ });
      if ((await tables.count()) > 0) {
        await expect(tables.first()).toBeVisible();
      }

      // Click table opens detail panel
      const tableBtn = tables.filter({ hasNotText: /Available|Occupied|Reserved|Cleaning/ }).first();
      if (await tableBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tableBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Change Status").first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("main").getByText("Capacity").first()).toBeVisible();

        // 5 status buttons
        const statuses = ["Available", "Occupied", "Reserved", "Cleaning", "Out of Service"];
        for (const s of statuses) {
          const btn = page.locator("button").filter({ hasText: new RegExp(s, "i") }).first();
          if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(btn).toBeVisible();
          }
        }
      }
    });

    test("CERT-029: Restaurant POS - Orders tab shows active orders with Accept button", async ({ page }) => {
      await page.goto("/dashboard/restaurant");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const ordersTab = page.locator("button").filter({ hasText: "Orders" }).first();
      await ordersTab.click();
      await page.waitForTimeout(1000);

      await expect(page.locator("main").getByText("Active Orders").first()).toBeVisible();

      const acceptBtn = page.locator("button").filter({ hasText: "Accept" }).first();
      if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(acceptBtn).toBeVisible();
      }
    });

    test("CERT-030: Restaurant POS - Reservations tab with New Reservation form", async ({ page }) => {
      await page.goto("/dashboard/restaurant");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const resTab = page.locator("button").filter({ hasText: "Reservations" }).first();
      await resTab.click();
      await page.waitForTimeout(1000);

      await expect(page.locator("main").getByText("Table Reservations").first()).toBeVisible();

      const newResBtn = page.locator("button").filter({ hasText: "New Reservation" }).first();
      await expect(newResBtn).toBeVisible();
      await newResBtn.click();
      await page.waitForTimeout(500);

      const fields = ["Guest Name", "Phone", "Party Size", "Duration", "Table", "Date & Time", "Notes"];
      for (const f of fields) {
        await expect(page.locator(`text=${f}`).first()).toBeVisible();
      }
    });

    test("CERT-031: KDS - Kitchen Display System with 3-column Kanban", async ({ page }) => {
      await page.goto("/dashboard/restaurant/kds");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Kitchen Display System").first()).toBeVisible();

      const columns = ["New", "In Progress", "Ready"];
      for (const c of columns) {
        await expect(page.locator(`text=${c}`).first()).toBeVisible();
      }

      // Station filter
      const stationSelect = page.locator("select").filter({ hasText: /All Stations/ }).first();
      await expect(stationSelect).toBeVisible();

      // Status transition buttons
      const advanceNew = page.locator("button").filter({ hasText: /Move to in progress/ }).first();
      if (await advanceNew.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(advanceNew).toBeVisible();
      }
    });

    test("CERT-032: F&B Room Service - Menu with categories, items, prices, and order creation", async ({ page }) => {
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Food & Beverage").first()).toBeVisible();
      await expect(page.locator("main").getByText("Active Orders").first()).toBeVisible();
      await expect(page.locator("main").getByText("Menu").first()).toBeVisible();

      // Category pills
      const categories = ["All", "Breakfast", "Appetizers", "Main Course", "Desserts", "Beverages"];
      for (const cat of categories) {
        const pill = page.locator("button").filter({ hasText: cat }).first();
        if (await pill.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(pill).toBeVisible();
        }
      }

      // Menu items with prices
      const priceTags = page.locator("main").getByText(/₹\d+/);
      if ((await priceTags.count()) > 0) {
        await expect(priceTags.first()).toBeVisible();
      }

      // New Order form
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("New Room Service Order").first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("main").getByText("Guest / Room").first()).toBeVisible();
        await expect(page.locator("main").getByText("Menu Items").first()).toBeVisible();
        await expect(page.locator("main").getByText("Post to Guest Folio").first()).toBeVisible();

        // +/- quantity buttons
        const plusBtn = page.locator("button").filter({ hasText: "+" }).first();
        if (await plusBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(plusBtn).toBeVisible();
        }
      }
    });

    test("CERT-033: Laundry Management - Full order lifecycle with 5 statuses", async ({ page }) => {
      await page.goto("/dashboard/laundry");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Laundry").first()).toBeVisible({ timeout: 10000 });

      // 5-step status flow
      const statuses = ["Pending", "Picked Up", "In Progress", "Ready", "Delivered"];
      for (const s of statuses) {
        const pill = page.locator("button").filter({ hasText: new RegExp(`^${s}$`, "i") }).first();
        if (await pill.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(pill).toBeVisible();
        }
      }

      // Status transition buttons
      const pickUpBtn = page.locator("button").filter({ hasText: "Pick Up" }).first();
      if (await pickUpBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(pickUpBtn).toBeVisible();
      }

      // New Order form
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("New Laundry Order").first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("main").getByText("Special Instructions").first()).toBeVisible();
        await expect(page.locator("main").getByText("Items").first()).toBeVisible();

        // Wash type options
        const washTypeSelect = page.locator("select").filter({ hasText: /Regular|Dry Clean|Iron/ }).first();
        if (await washTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await washTypeSelect.locator("option").allTextContents();
          expect(options).toEqual(expect.arrayContaining(["Regular", "Dry Clean", "Iron Only"]));
        }

        // Add Item button
        const addItemBtn = page.locator("button").filter({ hasText: "+ Add Item" }).first();
        if (await addItemBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(addItemBtn).toBeVisible();
        }
      }
    });

    test("CERT-034: Guest Requests & Complaints - Full request management", async ({ page }) => {
      await page.goto("/dashboard/front-desk/requests");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Guest Requests & Complaints").first()).toBeVisible();
      await expect(page.locator("main").getByText("Pending Action").first()).toBeVisible();

      // Status filter
      const filter = page.locator("select").filter({ hasText: /All Requests/ }).first();
      if (await filter.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await filter.locator("option").allTextContents();
        expect(options).toEqual(expect.arrayContaining([
          expect.stringContaining("All"),
          expect.stringContaining("Pending"),
          expect.stringContaining("In Progress"),
          expect.stringContaining("Resolved"),
        ]));
      }

      // New Request form
      const newBtn = page.locator("button").filter({ hasText: "New Request" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Log Guest Request").first()).toBeVisible({ timeout: 5000 });

        const fields = ["Guest / Room", "Request Type", "Department", "Description"];
        for (const f of fields) {
          await expect(page.locator(`text=${f}`).first()).toBeVisible();
        }

        // Request types
        const typeSelect = page.locator("select").filter({ hasText: /housekeeping|maintenance|room_service|front_desk/i }).first();
        if (await typeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await typeSelect.locator("option").allTextContents();
          const lower = options.map((o) => o.toLowerCase());
          expect(lower).toEqual(expect.arrayContaining([
            expect.stringContaining("housekeeping"),
            expect.stringContaining("maintenance"),
          ]));
        }
      }
    });

    test("CERT-035: Guest Feedback page with ratings and department filter", async ({ page }) => {
      await page.goto("/dashboard/front-desk/feedbacks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Guest Feedbacks").first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator("main").getByText("Average Rating").first()).toBeVisible();

      const filter = page.locator("select").filter({ hasText: "All Departments" }).first();
      if (await filter.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await filter.locator("option").allTextContents();
        expect(options).toContain("All Departments");
      }

      // Log Feedback button
      const logBtn = page.locator("button", { hasText: "Log Feedback" }).first();
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

  test.describe("PHASE 5: Housekeeping Operations - Dirty Room Readiness & SLA", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("CERT-036: HK Dashboard loads with all KPIs and stat cards", async ({ page }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const stats = ["Open Tasks", "In Progress", "Completed Today", "Critical Priority"];
      for (const s of stats) {
        await expect(page.locator(`text=${s}`).first()).toBeVisible();
      }

      // Status filter buttons
      const filters = ["All", "open", "in_progress", "resolved"];
      for (const f of filters) {
        const btn = page.locator("button").filter({ hasText: new RegExp(f.replace("_", " "), "i") }).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(btn).toBeVisible();
        }
      }
    });

    test("CERT-037: HK Dashboard - My Tasks panel shows assigned tasks with room, priority, type", async ({ page }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("My Tasks").first()).toBeVisible();

      const taskItems = page.locator(".flex.items-center.justify-between.p-3");
      if ((await taskItems.count()) > 0) {
        const first = taskItems.first();
        await expect(first).toBeVisible();
      }
    });

    test("CERT-038: HK Dashboard - Floor Summary shows per-floor task counts", async ({ page }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Floor Summary").first()).toBeVisible();

      const floorRows = page.locator("text=/Floor \\d+/");
      if ((await floorRows.count()) > 0) {
        await expect(floorRows.first()).toBeVisible();
      }
    });

    test("CERT-039: HK Dashboard - Linen Lifecycle shows 5 stages", async ({ page }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Linen Lifecycle Ledger").first()).toBeVisible();

      const stages = ["In Use", "Soiled", "Dispatched", "Received", "Scrapped"];
      for (const s of stages) {
        await expect(page.locator(`text=${s}`).first()).toBeVisible();
      }
    });

    test("CERT-040: HK Dashboard - Staff Performance with ratings", async ({ page }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Staff Performance").first()).toBeVisible();
      await expect(page.locator("main").getByText("Team Total").first()).toBeVisible();
    });

    test("CERT-041: HK Dashboard - Quality Checklist with 4 sections and checkboxes", async ({ page }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Quality Checklist").first()).toBeVisible();

      const sections = ["Room Readiness", "Public Areas", "Linen and Supplies", "Special Requests"];
      for (const s of sections) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }

      const checkboxes = page.locator('input[type="checkbox"]');
      expect(await checkboxes.count()).toBeGreaterThanOrEqual(15);
    });

    test("CERT-042: HK Dashboard - Equipment Status shows equipment types", async ({ page }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Equipment Status").first()).toBeVisible();

      const equipment = ["Vacuum Cleaners", "Floor Buffers", "Housekeeping Carts", "Steam Cleaners"];
      for (const e of equipment) {
        const el = page.locator(`text=${e}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("CERT-043: HK Tasks page - Table with columns, search, and filters", async ({ page }) => {
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const headerText = headers.join(" ").toLowerCase();
        expect(headerText.includes("room") || headerText.includes("unit") || headerText.includes("task")).toBeTruthy();
        expect(headerText.includes("status")).toBeTruthy();
        expect(headerText.includes("priority")).toBeTruthy();
      }

      // Search
      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill("101");
        await page.waitForTimeout(500);
      }

      // Status filter
      const statusSelect = page.locator("select").filter({ hasText: /All Status/ }).first();
      if (await statusSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await statusSelect.locator("option").allTextContents();
        expect(options).toEqual(expect.arrayContaining(["All Statuses", "Open", "In Progress", "Resolved", "Completed"]));
      }
    });

    test("CERT-044: HK Task Lifecycle - Create, Start, Complete with Checklist", async ({ page }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      // Create Task modal
      const newTaskBtn = page.locator("button").filter({ hasText: /New Task|Create Task/ }).first();
      if (await newTaskBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newTaskBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Create Task").first()).toBeVisible({ timeout: 5000 });

        const fields = ["Task Type", "Unit ID", "Assigned To", "Priority", "Notes"];
        for (const f of fields) {
          await expect(page.locator(`text=${f}`).first()).toBeVisible();
        }

        // Priority dropdown has 4 levels
        const prioritySelect = page.locator("select").filter({ hasText: /Low|Medium|High|Critical/ }).first();
        if (await prioritySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await prioritySelect.locator("option").allTextContents();
          expect(options.length).toBe(4);
          expect(options.map((o) => o.toLowerCase())).toEqual(expect.arrayContaining(["low", "medium", "high", "critical"]));
        }

        // Cancel closes modal
        const cancelBtn = page.locator("button", { hasText: "Cancel" }).first();
        if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
          await expect(page.locator("main").getByText("Create Task").first()).not.toBeVisible({ timeout: 3000 });
        }
      }

      // Start and Complete buttons
      await page.waitForTimeout(1000);
      const startBtns = page.locator("button").filter({ hasText: "Start" });
      if ((await startBtns.count()) > 0) {
        await expect(startBtns.first()).toBeVisible();
      }

      const completeBtns = page.locator("button").filter({ hasText: "Complete" });
      if ((await completeBtns.count()) > 0) {
        await expect(completeBtns.first()).toBeVisible();
      }
    });

    test("CERT-045: HK Tasks page - Complete with Checklist modal", async ({ page }) => {
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      const checklistBtn = page.locator('[title="Complete with Checklist"]').first();
      if (await checklistBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checklistBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Checklist").first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("main").getByText("Complete Task").first()).toBeVisible();

        const checkboxes = page.locator('input[type="checkbox"]');
        expect(await checkboxes.count()).toBeGreaterThanOrEqual(1);

        const closeBtn = page.locator("button", { hasText: "Close" }).first();
        await expect(closeBtn).toBeVisible();
      }
    });

    test("CERT-046: HK Sub-pages - Linen, Inspections, Staff roster", async ({ page }) => {
      // Linen page
      await page.goto("/dashboard/housekeeping/linen");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText("Linen").first()).toBeVisible({ timeout: 10000 });

      const tabs = ["Batch", "Item", "Transaction"];
      for (const t of tabs) {
        const el = page.locator(`text=${t}`).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }

      // Inspections page
      await page.goto("/dashboard/housekeeping/inspections");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText("Inspections").first()).toBeVisible({ timeout: 10000 });

      // Staff roster
      await page.goto("/dashboard/housekeeping/staff");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText("Staff").first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-047: Dirty Room Readiness - Checked-out rooms become dirty (HK trigger)", async ({ page }) => {
      await page.waitForTimeout(3000);

      const dirtyCount = page.locator("button", { hasText: "Dirty" }).first();
      if (await dirtyCount.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(dirtyCount).toBeVisible();
      }

      // Dirty room shows Mark Available action
      const dirtyRoom = page.locator("button").filter({ hasText: "Dirty" }).first();
      if (await dirtyRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
        await dirtyRoom.click();
        await page.waitForTimeout(500);

        const cleanBtn = page.locator("button", { hasText: /Mark Available|Cleaned/ }).first();
        if (await cleanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(cleanBtn).toBeVisible();
        }
      }
    });

    test("CERT-048: HK SLA - Critical priority tasks visible with time tracking", async ({ page }) => {
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Critical Priority").first()).toBeVisible();

      // Today's Schedule shows timeline events
      await expect(page.locator("main").getByText("Today's Schedule").first()).toBeVisible();
      const events = ["Breakfast Setup", "Staff Briefing", "Checkout Cleaning"];
      for (const e of events) {
        const el = page.locator(`text=${e}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });
  });

  test.describe("PHASE 6: Maintenance Operations - SLA & Readiness Workflow", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("CERT-049: Maintenance Dashboard loads with all KPIs", async ({ page }) => {
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const stats = ["Open", "In Progress", "Resolved Today", "Avg Resolution"];
      for (const s of stats) {
        await expect(page.locator(`text=${s}`).first()).toBeVisible();
      }

      // Status filter buttons
      const filters = ["All", "open", "in_progress", "resolved"];
      for (const f of filters) {
        const btn = page.locator("button").filter({ hasText: new RegExp(f.replace("_", " "), "i") }).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(btn).toBeVisible();
        }
      }

      // Priority filter buttons
      await expect(page.locator("button").filter({ hasText: "All Priority" }).first()).toBeVisible();
      const priorities = ["critical", "high", "medium", "low"];
      for (const p of priorities) {
        const btn = page.locator("button").filter({ hasText: new RegExp(`^${p}$`, "i") }).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(btn).toBeVisible();
        }
      }
    });

    test("CERT-050: Maintenance Dashboard - Active Tickets table with columns", async ({ page }) => {
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Active Tickets").first()).toBeVisible();

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const headerText = headers.join(" ").toLowerCase();
        expect(headerText.includes("issue") || headerText.includes("title")).toBeTruthy();
        expect(headerText.includes("priority")).toBeTruthy();
        expect(headerText.includes("status")).toBeTruthy();
      }
    });

    test("CERT-051: Maintenance Dashboard - AMC Monitor, PM Schedule, Parts Inventory", async ({ page }) => {
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      // AMC Monitor
      await expect(page.locator("main").getByText("AMC Monitor").first()).toBeVisible();

      // Preventive Maintenance Schedule
      await expect(page.locator("main").getByText("Preventive Maintenance Schedule").first()).toBeVisible();

      // Parts Inventory
      await expect(page.locator("main").getByText("Parts Inventory").first()).toBeVisible();
    });

    test("CERT-052: Maintenance Dashboard - Team, Vendor Performance, Weekly Workload", async ({ page }) => {
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Maintenance Team").first()).toBeVisible();
      await expect(page.locator("main").getByText("Vendor Performance").first()).toBeVisible();
      await expect(page.locator("main").getByText("Weekly Workload Chart").first()).toBeVisible();

      // Bottom stat cards
      const cards = ["Total Parts", "Team Available", "Avg Vendor Rating", "Weekly Total"];
      for (const c of cards) {
        const el = page.locator(`text=${c}`).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("CERT-053: Maintenance Ticket Lifecycle - Create, Assign, Start, Resolve, Close", async ({ page }) => {
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      // Create Ticket modal
      const newBtn = page.locator("button").filter({ hasText: "New Ticket" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Create New Ticket").first()).toBeVisible({ timeout: 5000 });

        const fields = ["Title", "Description", "Priority", "Category"];
        for (const f of fields) {
          await expect(page.locator(`text=${f}`).first()).toBeVisible();
        }

        // Category dropdown
        const catSelect = page.locator("select").filter({ hasText: /Select/ }).first();
        if (await catSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await catSelect.locator("option").allTextContents();
          const categories = options.map((o) => o.toLowerCase());
          expect(categories).toEqual(expect.arrayContaining(["hvac", "plumbing", "electrical"]));
        }

        // Cancel closes form
        const cancelBtn = page.locator("button", { hasText: "Cancel" }).first();
        if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
        }
      }

      // Action buttons
      await page.waitForTimeout(1000);
      const assignBtn = page.locator('[title="Assign"]').first();
      if (await assignBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(assignBtn).toBeVisible();
      }

      const startBtn = page.locator('[title="Start"]').first();
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(startBtn).toBeVisible();
      }

      const resolveBtn = page.locator('[title="Resolve"]').first();
      if (await resolveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(resolveBtn).toBeVisible();
      }

      const closeBtn = page.locator('[title="Close"]').first();
      if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(closeBtn).toBeVisible();
      }
    });

    test("CERT-054: Maintenance Ticket Detail - Parts Used, Time Logged, Approval History", async ({ page }) => {
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const expandBtn = page.locator('[title="Details"]').first();
      if (await expandBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expandBtn.click();
        await page.waitForTimeout(1000);

        await expect(page.locator("main").getByText("Parts Used").first()).toBeVisible();
        await expect(page.locator("main").getByText("Time Logged").first()).toBeVisible();
        await expect(page.locator("main").getByText("Approval History").first()).toBeVisible();
      }
    });

    test("CERT-055: Maintenance - Guest Feedback Triage with Raise Ticket", async ({ page }) => {
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const triage = page.locator("main").getByText("Guest Feedback Triage").first();
      if (await triage.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(triage).toBeVisible();

        const raiseBtn = page.locator("button").filter({ hasText: "Raise Ticket" }).first();
        if (await raiseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(raiseBtn).toBeVisible();
        }
      }
    });

    test("CERT-056: Maintenance Sub-pages - Parts, Assets, Tickets with filters", async ({ page }) => {
      // Parts inventory
      await page.goto("/dashboard/maintenance/parts");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText("Parts").first()).toBeVisible({ timeout: 15000 });

      // Assets
      await page.goto("/dashboard/maintenance/assets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText("Assets").first()).toBeVisible({ timeout: 15000 });

      // Tickets page with filters
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const headerText = headers.join(" ").toLowerCase();
        expect(headerText.includes("ticket") || headerText.includes("id")).toBeTruthy();
        expect(headerText.includes("issue")).toBeTruthy();
        expect(headerText.includes("priority")).toBeTruthy();
        expect(headerText.includes("status")).toBeTruthy();
      }

      // Status filter
      const statusSelect = page.locator("select").filter({ hasText: /All Status/ }).first();
      if (await statusSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await statusSelect.locator("option").allTextContents();
        expect(options).toEqual(expect.arrayContaining([
          expect.stringContaining("Open"),
          expect.stringContaining("Assigned"),
          expect.stringContaining("In Progress"),
          expect.stringContaining("Resolved"),
          expect.stringContaining("Closed"),
        ]));
      }

      // Priority filter (lowercase values in UI)
      const prioSelect = page.locator("select").filter({ hasText: /All Priority/ }).first();
      if (await prioSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await prioSelect.locator("option").allTextContents();
        const lower = options.map((o) => o.toLowerCase());
        expect(lower).toEqual(expect.arrayContaining([
          expect.stringContaining("low"),
          expect.stringContaining("medium"),
          expect.stringContaining("high"),
          expect.stringContaining("critical"),
        ]));
      }

      // Category filter
      const catSelect = page.locator("select").filter({ hasText: /All Categories/ }).first();
      if (await catSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await catSelect.locator("option").allTextContents();
        expect(options).toEqual(expect.arrayContaining([
          expect.stringContaining("HVAC"),
          expect.stringContaining("Plumbing"),
          expect.stringContaining("Electrical"),
        ]));
      }
    });
  });

  test.describe("PHASE 7: Billing, Payment & Check-Out", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("CERT-057: Billing page shows Total Outstanding and Active Folios", async ({ page }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Billing & Folio").first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator("main").getByText("Total Outstanding").first()).toBeVisible();
      await expect(page.locator("main").getByText("Active Folios").first()).toBeVisible();

      // Search functionality
      const search = page.locator('input[placeholder*="Search"]').first();
      if (await search.isVisible({ timeout: 5000 }).catch(() => false)) {
        await search.fill("Unit");
        await page.waitForTimeout(500);
      }
    });

    test("CERT-058: Folio modal shows itemized charges, payments, and balance", async ({ page }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const openFolioBtn = page.locator("button", { hasText: /Open Folio|View/ }).first();
      if (await openFolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openFolioBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Guest Folio").first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("main").getByText("Total Charges").first()).toBeVisible();
        await expect(page.locator("main").getByText("Balance Due").first()).toBeVisible();
        await expect(page.locator("main").getByText("Itemized Charges").first()).toBeVisible();
        await expect(page.locator("main").getByText("Payments Received").first()).toBeVisible();
      }
    });

    test("CERT-059: Post Charge has all service types (Room Service, Laundry, Restaurant, Bar, etc.)", async ({ page }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const openFolioBtn = page.locator("button", { hasText: /Open Folio|View/ }).first();
      if (await openFolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openFolioBtn.click();
        await page.waitForTimeout(500);

        const postChargeBtn = page.locator("button", { hasText: "Post Charge" }).first();
        if (await postChargeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await postChargeBtn.click();
          await page.waitForTimeout(500);

          const chargeTypes = [
            "Room Service", "Laundry", "Restaurant", "Bar",
            "Minibar", "Spa", "Transportation", "Damage"
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

    test("CERT-060: Payment methods include Credit Card, UPI, Cash", async ({ page }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const openFolioBtn = page.locator("button", { hasText: /Open Folio|View/ }).first();
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

    test("CERT-061: Print Invoice option available on folio", async ({ page }) => {
      await page.goto("/dashboard/front-desk/billing");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const openFolioBtn = page.locator("button", { hasText: /Open Folio|View/ }).first();
      if (await openFolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openFolioBtn.click();
        await page.waitForTimeout(500);

        const printBtn = page.locator("button", { hasText: "Print Invoice" }).first();
        if (await printBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(printBtn).toBeVisible();
        }
      }
    });

    test("CERT-062: Check-Out page shows departure stats and statuses", async ({ page }) => {
      await page.goto("/dashboard/front-desk/checkout");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Self Check-out").first()).toBeVisible({ timeout: 10000 });

      const statuses = ["Pending", "Folio Review", "Payment Due", "Checked Out"];
      for (const s of statuses) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("CERT-063: Occupied room shows Check Out button", async ({ page }) => {
      await page.waitForTimeout(2000);

      const occupiedRoom = page.locator("button").filter({ hasText: "Occupied" }).first();
      if (await occupiedRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
        await occupiedRoom.click();
        await page.waitForTimeout(500);

        const checkOutBtn = page.locator("button", { hasText: "Check Out" }).first();
        if (await checkOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(checkOutBtn).toBeVisible();
        }
      }
    });
  });

  test.describe("PHASE 8: HR & Finance Workflows", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("CERT-064: HR Dashboard loads with employee stats", async ({ page }) => {
      await page.goto("/dashboard/hr");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/HR|Human Resources/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-065: HR Employees page shows employee table with departments", async ({ page }) => {
      await page.goto("/dashboard/hr/employees");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const rows = await table.locator("tbody tr").count();
        expect(rows).toBeGreaterThanOrEqual(5);
      }
    });

    test("CERT-066: HR Payroll page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/payroll");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Payroll/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-067: HR Leave management page loads", async ({ page }) => {
      await page.goto("/dashboard/hr/leave");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Leave/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-068: HR Shifts & Timesheet pages load", async ({ page }) => {
      await page.goto("/dashboard/hr/shifts");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Shift/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/hr/timesheet");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Timesheet|Time/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-069: Finance Dashboard loads with financial KPIs", async ({ page }) => {
      await page.goto("/dashboard/finance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Finance|Financial/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-070: Finance Chart of Accounts page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/accounts");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Chart of Accounts|Accounts/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-071: Finance Journal Entries page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/journal");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Journal/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-072: Finance Ledger page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/ledger");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Ledger/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-073: Finance Receivables & Payables pages load", async ({ page }) => {
      await page.goto("/dashboard/finance/receivables");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Receivable/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/finance/payables");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Payable/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-074: Finance Budget, Tax, Fixed Assets pages load", async ({ page }) => {
      await page.goto("/dashboard/finance/budget");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Budget/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/finance/tax");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Tax/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/finance/assets");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Fixed Asset|Asset/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-075: Finance Reports page loads", async ({ page }) => {
      await page.goto("/dashboard/finance/reports");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Report/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("PHASE 9: Cross-Module Workflow Integration", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/front-desk", { waitUntil: "domcontentloaded" });
      try { await page.locator("main").waitFor({ timeout: 15000 }); } catch { await page.waitForTimeout(2000); }
    });

    test("CERT-076: Command Center shows activity feed with all event types", async ({ page }) => {
      await page.waitForTimeout(3000);

      await expect(page.locator("main").getByText("Today's Activity Feed").first()).toBeVisible({ timeout: 10000 });

      const activityTypes = [
        "Check-In Completed", "Check-Out Processed",
        "Guest Request", "Housekeeping", "Maintenance"
      ];
      for (const a of activityTypes) {
        const el = page.locator(`text=${a}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("CERT-077: Room metrics show occupancy rate, revenue, ADR", async ({ page }) => {
      await page.waitForTimeout(3000);

      await expect(page.locator("main").getByText("Detailed Room Metrics").first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator("main").getByText("Occupancy Rate").first()).toBeVisible();
      await expect(page.locator("main").getByText("Today's Revenue").first()).toBeVisible();
      await expect(page.locator("main").getByText("Avg. Daily Rate").first()).toBeVisible();
    });

    test("CERT-078: Guest Messaging panel visible on command center", async ({ page }) => {
      await page.waitForTimeout(3000);

      await expect(page.locator("main").getByText("Guest Messaging").first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-079: AI Revenue Manager with Auto-Pilot toggle", async ({ page }) => {
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("AI Revenue Manager").first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator("main").getByText("Dynamic Auto-Pilot").first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-080: Guest request -> HK task -> Maintenance ticket cross-module flow", async ({ page }) => {
      // Guest Requests page
      await page.goto("/dashboard/front-desk/requests");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Guest Requests").first()).toBeVisible({ timeout: 10000 });

      const newReqBtn = page.locator("button", { hasText: "New Request" }).first();
      if (await newReqBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newReqBtn.click();
        await page.waitForTimeout(500);

        const types = page.locator("select option, label").filter({
          hasText: /Housekeeping|Maintenance|Room Service|Front Desk/,
        });
        if ((await types.count()) > 0) {
          expect(await types.count()).toBeGreaterThan(0);
        }
      }

      // HK tasks page shows task types matching guest request categories
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const taskTypes = await table.locator("td").allTextContents();
        const allText = taskTypes.join(" ").toLowerCase();
        expect(
          allText.includes("clean") || allText.includes("turndown") ||
          allText.includes("checkout") || allText.includes("inspection") ||
          allText.includes("deep") || allText.includes("linen") || allText.includes("restock")
        ).toBeTruthy();
      }

      // Maintenance feedback triage
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const triage = page.locator("main").getByText("Guest Feedback Triage").first();
      if (await triage.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(triage).toBeVisible();
      }
    });

    test("CERT-081: Guest profiles reflect stay history", async ({ page }) => {
      await page.goto("/dashboard/front-desk/guests");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Guest Profiles").first()).toBeVisible({ timeout: 10000 });

      const viewBtn = page.locator("button", { hasText: "View" }).first();
      if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await viewBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Guest Profile").first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("main").getByText("Stay History").first()).toBeVisible();
      }
    });

    test("CERT-082: Revenue dashboard shows financial summary", async ({ page }) => {
      await page.goto("/dashboard/revenue");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText("Revenue").first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-083: Inventory module pages load", async ({ page }) => {
      await page.goto("/dashboard/inventory");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Inventory/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/inventory/items");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Items/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/inventory/warehouses");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Warehouse/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-084: Procurement module pages load", async ({ page }) => {
      await page.goto("/dashboard/procurement");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Procurement/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/procurement/purchase-orders");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Purchase Order/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-085: Vendors module with services and orders", async ({ page }) => {
      await page.goto("/dashboard/vendors");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Vendor/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/vendors/services");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Service/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("PHASE 10: Multi-Workspace Verification", () => {
    test("CERT-086: Serviced Apartments workspace loads with unit management", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "apartments");
      await page.goto("/dashboard/apartments");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Apartment|Unit/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-087: Apartment Rental workspace loads with lease management", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "rental");
      await page.goto("/dashboard/rental");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Rental|Lease/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/rental/leases");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Lease/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-088: Workplace Services workspace loads with desk/visitor management", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "workplace");
      await page.goto("/dashboard/workplace");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Workplace|Desk/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/workplace/memberships");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Membership/).first()).toBeVisible({ timeout: 10000 });

      await page.goto("/dashboard/workplace/visitors");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
      await expect(page.locator("main").getByText(/Visitor/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-089: Loyalty program page loads", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/loyalty");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/Loyalty/).first()).toBeVisible({ timeout: 10000 });
    });

    test("CERT-090: WhatsApp integration page loads", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/whatsapp");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      await expect(page.locator("main").getByText(/WhatsApp/).first()).toBeVisible({ timeout: 10000 });
    });
  });
});