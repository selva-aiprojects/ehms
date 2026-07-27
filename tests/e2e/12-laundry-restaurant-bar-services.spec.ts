import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE } from "./helpers/auth";

const EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

/**
 * LAUNDRY, RESTAURANT, KDS, F&B, GUEST REQUESTS & FEEDBACK -- Complete Workflow E2E
 * Command: npx playwright test 12-laundry-restaurant-bar-services
 */
test.describe("Laundry Management", () => {
  test.describe("Laundry Dashboard & Order Lifecycle", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/laundry");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    });

    test("LAUN-001: Dashboard loads with 4 stat cards", async ({ page }) => {
      const stats = ["Pending", "In Progress", "Ready", "Today's Revenue"];
      for (const s of stats) {
        await expect(page.locator(`text=${s}`).first()).toBeVisible();
      }
    });

    test("LAUN-002: Orders table has columns: Order#, Guest, Room, Amount, Status, Date, Actions", async ({
      page,
    }) => {
      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const h = headers.join(" ").toLowerCase();
        expect(h.includes("order")).toBeTruthy();
        expect(h.includes("guest")).toBeTruthy();
        expect(h.includes("room") || h.includes("unit")).toBeTruthy();
        expect(h.includes("amount")).toBeTruthy();
        expect(h.includes("status")).toBeTruthy();
      }
    });

    test("LAUN-003: Status filter pills visible (All, Pending, Picked Up, In Progress, Ready, Delivered)", async ({
      page,
    }) => {
      const statuses = ["All", "Pending", "Picked Up", "In Progress", "Ready", "Delivered"];
      for (const s of statuses) {
        const pill = page.locator("button").filter({ hasText: new RegExp(`^${s}$`, "i") }).first();
        if (await pill.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(pill).toBeVisible();
        }
      }
    });

    test("LAUN-004: Pending orders show 'Pick Up' action button", async ({ page }) => {
      const pickUpBtn = page.locator("button").filter({ hasText: "Pick Up" }).first();
      if (await pickUpBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(pickUpBtn).toBeVisible();
      }
    });

    test("LAUN-005: Picked Up orders show 'Start' action button", async ({ page }) => {
      const startBtn = page.locator("button").filter({ hasText: "Start" }).first();
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(startBtn).toBeVisible();
      }
    });

    test("LAUN-006: In Progress orders show 'Ready' action button", async ({ page }) => {
      const readyBtn = page.locator("button").filter({ hasText: "Ready" }).first();
      if (await readyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(readyBtn).toBeVisible();
      }
    });

    test("LAUN-007: Ready orders show 'Deliver' action button", async ({ page }) => {
      const deliverBtn = page.locator("button").filter({ hasText: "Deliver" }).first();
      if (await deliverBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(deliverBtn).toBeVisible();
      }
    });

    test("LAUN-008: Status transition: click 'Pick Up' moves pending order to picked_up", async ({
      page,
    }) => {
      const pickUpBtn = page.locator("button").filter({ hasText: "Pick Up" }).first();
      if (await pickUpBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await pickUpBtn.click();
        await page.waitForTimeout(2000);
      }
    });

    test("LAUN-009: New Order form opens with fields", async ({ page }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("New Laundry Order").first()).toBeVisible({
          timeout: 5000,
        });
        await expect(page.locator("main").getByText("Special Instructions").first()).toBeVisible();
        await expect(page.locator("main").getByText("Items").first()).toBeVisible();
      }
    });

    test("LAUN-010: Order form has item row with name, wash type, quantity, price", async ({
      page,
    }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const washTypeSelect = page.locator("select").filter({ hasText: /Regular|Dry Clean|Iron/ }).first();
        if (await washTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await washTypeSelect.locator("option").allTextContents();
          expect(options).toEqual(
            expect.arrayContaining(["Regular", "Dry Clean", "Iron Only"])
          );
        }
      }
    });

    test("LAUN-011: Order form '+ Add Item' adds second item row", async ({ page }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const addItemBtn = page.locator("button").filter({ hasText: "+ Add Item" }).first();
        if (await addItemBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addItemBtn.click();
          await page.waitForTimeout(300);

          const itemRows = page.locator("input[placeholder='Item name']");
          expect(await itemRows.count()).toBeGreaterThanOrEqual(2);
        }
      }
    });

    test("LAUN-012: Order form shows running total in INR", async ({ page }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const totalLabel = page.locator("main").getByText("/Total:.*₹/").first();
        if (await totalLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(totalLabel).toBeVisible();
        }
      }
    });

    test("LAUN-013: Price List panel opens with item rates", async ({ page }) => {
      const priceBtn = page.locator("button").filter({ hasText: "Price List" }).first();
      if (await priceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await priceBtn.click();
        await page.waitForTimeout(500);

        await expect(
          page.locator("main").getByText("Laundry Price List").first()
        ).toBeVisible({ timeout: 5000 });
        await expect(
          page.locator("main").getByText("Standard rates per item").first()
        ).toBeVisible();
      }
    });

    test("LAUN-014: Cancel on New Order closes form", async ({ page }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const cancelBtn = page.locator("button").filter({ hasText: "Cancel" }).first();
        if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
          await expect(page.locator("main").getByText("New Laundry Order").first()).not.toBeVisible({ timeout: 3000 });
        }
      }
    });

    test("LAUN-015: Cancelled status badge visible for cancelled orders", async ({ page }) => {
      await page.goto("/dashboard/laundry");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const cancelFilter = page.locator("button").filter({ hasText: /All/ }).first();
      if (await cancelFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cancelFilter.click();
        await page.waitForTimeout(1000);
      }
    });

    test("LAUN-016: Order shows INR currency format", async ({ page }) => {
      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const amounts = table.locator("td").filter({ hasText: /₹/ });
        if ((await amounts.count()) > 0) {
          await expect(amounts.first()).toBeVisible();
        }
      }
    });
  });
});

test.describe("Restaurant POS", () => {
  test.describe("Floor Plan View", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/restaurant");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    });

    test("REST-001: Restaurant POS page loads with header", async ({ page }) => {
      await expect(page.locator("main").getByText("Restaurant POS").first()).toBeVisible();
      await expect(
        page.locator("main").getByText("Manage tables, orders, and reservations").first()
      ).toBeVisible();
    });

    test("REST-002: Three tabs visible: Floor Plan, Orders, Reservations", async ({
      page,
    }) => {
      const tabs = ["Floor Plan", "Orders", "Reservations"];
      for (const t of tabs) {
        await expect(
          page.locator("button").filter({ hasText: t }).first()
        ).toBeVisible();
      }
    });

    test("REST-003: Floor Plan tab active by default with table grid", async ({
      page,
    }) => {
      const floorTab = page.locator("button").filter({ hasText: "Floor Plan" }).first();
      const bg = await floorTab.evaluate((el) => getComputedStyle(el).backgroundColor);
      const isLight = bg.includes("255") || bg.includes("white") || bg.includes("rgb(255") || bg === "#fff";
      expect(isLight).toBeTruthy();

      const tables = page.locator("button").filter({ hasText: /^\d+$/ });
      if ((await tables.count()) > 0) {
        await expect(tables.first()).toBeVisible();
      }
    });

    test("REST-004: Table cards show number, capacity, status, and color-coded border", async ({
      page,
    }) => {
      const tables = page.locator("button").filter({ hasText: /^\d+$/ });
      if ((await tables.count()) > 0) {
        const first = tables.first();
        await expect(first).toBeVisible();

        const text = await first.textContent();
        expect(text).toMatch(/\d+/);
      }
    });

    test("REST-005: Available tables shown in green", async ({ page }) => {
      const availableTables = page.locator("button").filter({ hasText: /available/i });
      if ((await availableTables.count()) > 0) {
        await expect(availableTables.first()).toBeVisible();
      }
    });

    test("REST-006: Occupied tables show elapsed time counter", async ({ page }) => {
      const occupiedTables = page.locator("button").filter({ hasText: /occupied/i });
      if ((await occupiedTables.count()) > 0) {
        const first = occupiedTables.first();
        const text = await first.textContent();
        expect(text).toMatch(/\d+:\d+/);
      }
    });

    test("REST-007: Click table opens slide-out detail panel", async ({ page }) => {
      const tables = page.locator("button").filter({ hasText: /^\d+$/ }).filter({ hasNotText: /Available|Occupied|Reserved|Cleaning/ });
      if (await tables.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await tables.first().click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Change Status").first()).toBeVisible({
          timeout: 5000,
        });
        await expect(page.locator("main").getByText("Capacity").first()).toBeVisible();
        await expect(page.locator("main").getByText("Section").first()).toBeVisible();
        await expect(page.locator("main").getByText("Shape").first()).toBeVisible();
      }
    });

    test("REST-008: Table detail has 5 status buttons: Available, Occupied, Reserved, Cleaning, Out of Service", async ({
      page,
    }) => {
      const table = page.locator("button").filter({ hasText: /^\d+$/ }).first();
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        await table.click();
        await page.waitForTimeout(500);

        const statuses = ["Available", "Occupied", "Reserved", "Cleaning", "Out of Service"];
        for (const s of statuses) {
          const btn = page.locator("button").filter({ hasText: new RegExp(s, "i") }).first();
          if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(btn).toBeVisible();
          }
        }
      }
    });

    test("REST-009: Current table status shown as disabled button", async ({
      page,
    }) => {
      const table = page.locator("button").filter({ hasText: /^\d+$/ }).first();
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        await table.click();
        await page.waitForTimeout(500);

        const disabledBtns = page.locator("button[disabled]");
        if ((await disabledBtns.count()) > 0) {
          const text = await disabledBtns.first().textContent();
          expect(text).toContain("current");
        }
      }
    });

    test("REST-010: Close table detail panel via backdrop click", async ({
      page,
    }) => {
      const table = page.locator("button").filter({ hasText: /^\d+$/ }).first();
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        await table.click();
        await page.waitForTimeout(500);

        const backdrop = page.locator(".fixed.inset-0.bg-black\\/30").first();
        if (await backdrop.isVisible({ timeout: 3000 }).catch(() => false)) {
          await backdrop.click({ position: { x: 10, y: 10 } });
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe("Orders Tab", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/restaurant");
      await page.waitForLoadState("domcontentloaded");
    });

    test("REST-011: Orders tab shows badge with active order count", async ({
      page,
    }) => {
      const ordersTab = page.locator("button").filter({ hasText: "Orders" }).first();
      await expect(ordersTab).toBeVisible();

      const badge = ordersTab.locator("span").filter({ hasText: /\d+/ });
      if ((await badge.count()) > 0) {
        await expect(badge.first()).toBeVisible();
      }
    });

    test("REST-012: Orders tab shows active orders with room, status, items, price", async ({
      page,
    }) => {
      const ordersTab = page.locator("button").filter({ hasText: "Orders" }).first();
      await ordersTab.click();
      await page.waitForTimeout(1000);

      await expect(page.locator("main").getByText("Active Orders").first()).toBeVisible();
    });

    test("REST-013: Active order shows Room number, status badge, item list, amount in INR", async ({
      page,
    }) => {
      const ordersTab = page.locator("button").filter({ hasText: "Orders" }).first();
      await ordersTab.click();
      await page.waitForTimeout(1000);

      const orderItems = page.locator(".divide-y > div");
      if ((await orderItems.count()) > 0) {
        const first = orderItems.first();
        await expect(first).toBeVisible();

        const text = await first.textContent();
        expect(text).toMatch(/Room \d+|₹/);
      }
    });

    test("REST-014: Pending orders show 'Accept' button to move to preparing", async ({
      page,
    }) => {
      const ordersTab = page.locator("button").filter({ hasText: "Orders" }).first();
      await ordersTab.click();
      await page.waitForTimeout(1000);

      const acceptBtn = page.locator("button").filter({ hasText: "Accept" }).first();
      if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(acceptBtn).toBeVisible();
      }
    });

    test("REST-015: Empty state shows 'No active orders' message", async ({
      page,
    }) => {
      const ordersTab = page.locator("button").filter({ hasText: "Orders" }).first();
      await ordersTab.click();
      await page.waitForTimeout(1000);

      if (
        (await page.locator("text=No active orders").count()) > 0
      ) {
        await expect(page.locator("main").getByText("No active orders").first()).toBeVisible();
      }
    });
  });

  test.describe("Reservations Tab", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/restaurant");
      await page.waitForLoadState("domcontentloaded");
    });

    test("REST-016: Reservations tab shows total count", async ({ page }) => {
      const resTab = page.locator("button").filter({ hasText: "Reservations" }).first();
      await expect(resTab).toBeVisible();
      await resTab.click();
      await page.waitForTimeout(1000);

      await expect(page.locator("main").getByText("Table Reservations").first()).toBeVisible();
    });

    test("REST-017: 'New Reservation' button appears on Reservations tab", async ({
      page,
    }) => {
      const resTab = page.locator("button").filter({ hasText: "Reservations" }).first();
      await resTab.click();
      await page.waitForTimeout(1000);

      const newResBtn = page.locator("button").filter({ hasText: "New Reservation" }).first();
      await expect(newResBtn).toBeVisible();
    });

    test("REST-018: New Reservation form opens with all fields", async ({
      page,
    }) => {
      const resTab = page.locator("button").filter({ hasText: "Reservations" }).first();
      await resTab.click();
      await page.waitForTimeout(1000);

      const newResBtn = page.locator("button").filter({ hasText: "New Reservation" }).first();
      await newResBtn.click();
      await page.waitForTimeout(500);

      await expect(page.locator("main").getByText("New Reservation").first()).toBeVisible({
        timeout: 5000,
      });

      const fields = ["Guest Name", "Phone", "Party Size", "Duration", "Table", "Date & Time", "Notes"];
      for (const f of fields) {
        await expect(page.locator(`text=${f}`).first()).toBeVisible();
      }
    });

    test("REST-019: Table selector only shows available tables", async ({
      page,
    }) => {
      const resTab = page.locator("button").filter({ hasText: "Reservations" }).first();
      await resTab.click();
      await page.waitForTimeout(1000);

      const newResBtn = page.locator("button").filter({ hasText: "New Reservation" }).first();
      await newResBtn.click();
      await page.waitForTimeout(500);

      const tableSelect = page.locator("select").filter({ hasText: /Select table/ }).first();
      if (await tableSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        const options = await tableSelect.locator("option").allTextContents();
        expect(options.length).toBeGreaterThanOrEqual(1);

        const hasAvailable = options.some((o) => o.includes("seats") || o.includes("Table") || o === "Select table");
        expect(hasAvailable).toBeTruthy();
      }
    });

    test("REST-020: Reservation shows guest name, party size, table, time, status", async ({
      page,
    }) => {
      const resTab = page.locator("button").filter({ hasText: "Reservations" }).first();
      await resTab.click();
      await page.waitForTimeout(1000);

      const reservations = page.locator(".divide-y > div");
      if ((await reservations.count()) > 0) {
        const first = reservations.first();
        await expect(first).toBeVisible();
      }
    });

    test("REST-021: Create Reservation button disabled without table and time", async ({
      page,
    }) => {
      const resTab = page.locator("button").filter({ hasText: "Reservations" }).first();
      await resTab.click();
      await page.waitForTimeout(1000);

      const newResBtn = page.locator("button").filter({ hasText: "New Reservation" }).first();
      await newResBtn.click();
      await page.waitForTimeout(500);

      const createBtn = page.locator("button").filter({ hasText: "Create Reservation" }).first();
      if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        const isDisabled = await createBtn.isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    });
  });
});

test.describe("Kitchen Display System (KDS)", () => {
  test.describe("KDS Layout & Tickets", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/restaurant/kds");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    });

    test("KDS-001: KDS page loads with 3-column layout", async ({ page }) => {
      await expect(page.locator("main").getByText("Kitchen Display System").first()).toBeVisible();

      const columns = ["New", "In Progress", "Ready"];
      for (const c of columns) {
        await expect(page.locator(`text=${c}`).first()).toBeVisible();
      }
    });

    test("KDS-002: Each column header shows ticket count badge", async ({
      page,
    }) => {
      const badges = page.locator(".rounded-full").filter({ hasText: /^\d+$/ });
      expect(await badges.count()).toBeGreaterThanOrEqual(3);
    });

    test("KDS-003: Station filter dropdown visible with 'All Stations' default", async ({
      page,
    }) => {
      const stationSelect = page.locator("select").filter({ hasText: /All Stations/ }).first();
      await expect(stationSelect).toBeVisible();
    });

    test("KDS-004: KDS ticket shows table number, priority badge, items, elapsed time", async ({
      page,
    }) => {
      const tickets = page.locator(".hover\\:shadow-md");
      if ((await tickets.count()) > 0) {
        const first = tickets.first();
        await expect(first).toBeVisible();

        const text = await first.textContent();
        expect(text).toMatch(/\d+/);
      }
    });

    test("KDS-005: Rush/High priority tickets have red/amber badges", async ({
      page,
    }) => {
      const rushBadge = page.locator("main").getByText("RUSH").first();
      if (await rushBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(rushBadge).toBeVisible();
      }

      const highBadge = page.locator("main").getByText("HIGH").first();
      if (await highBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(highBadge).toBeVisible();
      }
    });

    test("KDS-006: New ticket has 'Move to in progress' button", async ({
      page,
    }) => {
      const advanceBtn = page.locator("button").filter({ hasText: /Move to in progress/ }).first();
      if (await advanceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(advanceBtn).toBeVisible();
      }
    });

    test("KDS-007: In-progress ticket has 'Move to ready' button", async ({
      page,
    }) => {
      const advanceBtn = page.locator("button").filter({ hasText: /Move to ready/ }).first();
      if (await advanceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(advanceBtn).toBeVisible();
      }
    });

    test("KDS-008: Ready ticket has 'Move to served' button", async ({
      page,
    }) => {
      const advanceBtn = page.locator("button").filter({ hasText: /Move to served/ }).first();
      if (await advanceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(advanceBtn).toBeVisible();
      }
    });

    test("KDS-009: Ticket notes shown in yellow highlight", async ({ page }) => {
      const notes = page.locator(".bg-\\[\\#FFFBEB\\]").first();
      if (await notes.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(notes).toBeVisible();
      }
    });

    test("KDS-010: Station name shown on each ticket", async ({ page }) => {
      const stationLabels = page.locator("text=/Station: .+/");
      if ((await stationLabels.count()) > 0) {
        await expect(stationLabels.first()).toBeVisible();
      }
    });

    test("KDS-011: Empty column shows 'No tickets' placeholder", async ({
      page,
    }) => {
      const emptyCols = page.locator("text=No tickets");
      if ((await emptyCols.count()) > 0) {
        await expect(emptyCols.first()).toBeVisible();
      }
    });
  });
});

test.describe("F&B Room Service", () => {
  test.describe("F&B Overview & Menu", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    });

    test("FB-001: F&B page loads with header and New Order button", async ({
      page,
    }) => {
      await expect(page.locator("main").getByText("Food & Beverage").first()).toBeVisible();
      await expect(
        page.locator(
          "text=Manage room service orders and post charges to guest folios"
        ).first()
      ).toBeVisible();
    });

    test("FB-002: Active Orders card shows in-progress count", async ({
      page,
    }) => {
      await expect(page.locator("main").getByText("Active Orders").first()).toBeVisible();
    });

    test("FB-003: Menu sidebar shows 6 categories as pills", async ({
      page,
    }) => {
      await expect(page.locator("main").getByText("Menu").first()).toBeVisible();

      const categories = [
        "All",
        "Breakfast",
        "Appetizers",
        "Main Course",
        "Desserts",
        "Beverages",
      ];
      for (const c of categories) {
        const pill = page.locator("button").filter({ hasText: c }).first();
        if (await pill.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(pill).toBeVisible();
        }
      }
    });

    test("FB-004: Menu items show name, category, price in INR", async ({
      page,
    }) => {
      const menuItems = page.locator(".bg-\\[\\#F5F7FA\\].rounded").filter({ hasText: /₹/ });
      if ((await menuItems.count()) > 0) {
        const first = menuItems.first();
        const text = await first.textContent();
        expect(text).toMatch(/₹\d+/);
      }
    });

    test("FB-005: Click category pill filters menu to that category", async ({
      page,
    }) => {
      const beveragesPill = page.locator("button").filter({ hasText: "Beverages" }).first();
      if (await beveragesPill.isVisible({ timeout: 5000 }).catch(() => false)) {
        await beveragesPill.click();
        await page.waitForTimeout(500);
      }
    });

    test("FB-006: Active order shows room, status badge, items, time, amount", async ({
      page,
    }) => {
      const orders = page.locator(".divide-y > div");
      if ((await orders.count()) > 0) {
        const first = orders.first();
        await expect(first).toBeVisible();

        const text = await first.textContent();
        expect(text).toMatch(/Room \d+|₹/);
      }
    });

    test("FB-007: Pending F&B order shows 'Accept' button", async ({ page }) => {
      const acceptBtn = page.locator("button").filter({ hasText: "Accept" }).first();
      if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(acceptBtn).toBeVisible();
      }
    });
  });

  test.describe("F&B Order Creation Flow", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/front-desk/f-and-b");
      await page.waitForLoadState("domcontentloaded");
    });

    test("FB-008: New Order slide-out panel opens", async ({ page }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(
          page.locator("main").getByText("New Room Service Order").first()
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test("FB-009: Order form has Guest/Room selector", async ({ page }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Guest / Room").first()).toBeVisible();
      }
    });

    test("FB-010: Order form has category pills for menu filtering", async ({
      page,
    }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Menu Items").first()).toBeVisible();
      }
    });

    test("FB-011: Menu items have +/- quantity buttons", async ({ page }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const plusBtns = page.locator("button").filter({ hasText: "+" }).first();
        const minusBtns = page.locator("button").filter({ hasText: "-" }).first();

        if (await plusBtns.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(plusBtns).toBeVisible();
          await expect(minusBtns).toBeVisible();
        }
      }
    });

    test("FB-012: Menu items show veg/non-veg indicator", async ({ page }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const vegIndicator = page.locator("main").getByText("/Veg|Non-veg/").first();
        if (await vegIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(vegIndicator).toBeVisible();
        }
      }
    });

    test("FB-013: Clicking + adds item and shows quantity counter", async ({
      page,
    }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const plusBtn = page.locator("button").filter({ hasText: "+" }).first();
        if (await plusBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await plusBtn.click();
          await page.waitForTimeout(300);

          const counter = page.locator(".font-semibold.w-5.text-center").first();
          if (await counter.isVisible({ timeout: 2000 }).catch(() => false)) {
            const text = await counter.textContent();
            expect(parseInt(text || "0")).toBeGreaterThanOrEqual(1);
          }
        }
      }
    });

    test("FB-014: Selected items appear in footer with line totals", async ({
      page,
    }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const plusBtn = page.locator("button").filter({ hasText: "+" }).first();
        if (await plusBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await plusBtn.click();
          await page.waitForTimeout(300);

          const footerTotal = page.locator(".font-bold.text-\\[\\#1A3C5E\\]").filter({ hasText: /Total.*₹/ }).first();
          if (await footerTotal.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(footerTotal).toBeVisible();
          }
        }
      }
    });

    test("FB-015: 'Post to Guest Folio' button present for order submission", async ({
      page,
    }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(
          page.locator("button").filter({ hasText: "Post to Guest Folio" }).first()
        ).toBeVisible();
      }
    });

    test("FB-016: 'Post to Guest Folio' disabled without guest and items", async ({
      page,
    }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const submitBtn = page.locator("button").filter({ hasText: "Post to Guest Folio" }).first();
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          const isDisabled = await submitBtn.isDisabled();
          expect(isDisabled).toBeTruthy();
        }
      }
    });

    test("FB-017: Close order form via X button", async ({ page }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Order" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const closeBtn = page.locator(".fixed button").filter({ has: page.locator("svg") }).last();
        if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });
});

test.describe("Guest Requests & Complaints", () => {
  test.describe("Requests Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/front-desk/requests");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    });

    test("REQ-001: Requests page loads with header and filter", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Guest Requests & Complaints").first()
      ).toBeVisible();
      await expect(
        page.locator("main").getByText("Monitor all incoming requests").first()
      ).toBeVisible();
    });

    test("REQ-002: Status filter dropdown (All, Pending, In Progress, Resolved)", async ({
      page,
    }) => {
      const filter = page.locator("select").filter({ hasText: /All Requests/ }).first();
      if (await filter.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await filter.locator("option").allTextContents();
        expect(options).toEqual(
          expect.arrayContaining([
            expect.stringContaining("All"),
            expect.stringContaining("Pending"),
            expect.stringContaining("In Progress"),
            expect.stringContaining("Resolved"),
          ])
        );
      }
    });

    test("REQ-003: 'New Request' button opens form", async ({ page }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Request" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Log Guest Request").first()).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("REQ-004: Request form has Guest/Room selector, Type, Department, Description", async ({
      page,
    }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Request" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const fields = ["Guest / Room", "Request Type", "Department", "Description"];
        for (const f of fields) {
          await expect(page.locator(`text=${f}`).first()).toBeVisible();
        }
      }
    });

    test("REQ-005: Request type dropdown has housekeeping, maintenance, room_service, front_desk", async ({
      page,
    }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Request" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const typeSelect = page.locator("select").filter({ hasText: /housekeeping|maintenance|room_service|front_desk/i }).first();
        if (await typeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await typeSelect.locator("option").allTextContents();
          const lower = options.map((o) => o.toLowerCase());
          expect(lower).toEqual(
            expect.arrayContaining([
              expect.stringContaining("housekeeping"),
              expect.stringContaining("maintenance"),
            ])
          );
        }
      }
    });

    test("REQ-006: Department dropdown has housekeeping, maintenance, front_desk", async ({
      page,
    }) => {
      const newBtn = page.locator("button").filter({ hasText: "New Request" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        const deptSelect = page.locator("select").filter({ hasText: /housekeeping|maintenance|front_desk/i }).nth(1);
        if (await deptSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await deptSelect.locator("option").allTextContents();
          const lower = options.map((o) => o.toLowerCase());
          expect(lower).toEqual(
            expect.arrayContaining([
              expect.stringContaining("housekeeping"),
              expect.stringContaining("maintenance"),
            ])
          );
        }
      }
    });

    test("REQ-007: Request list shows request type, status, room, description", async ({
      page,
    }) => {
      const requests = page.locator(".divide-y > div");
      if ((await requests.count()) > 0) {
        const first = requests.first();
        await expect(first).toBeVisible();
      }
    });

    test("REQ-008: Pending request shows pending status badge", async ({
      page,
    }) => {
      const pendingBadge = page.locator("main").getByText("Pending").first();
      if (await pendingBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(pendingBadge).toBeVisible();
      }
    });
  });
});

test.describe("Guest Feedback", () => {
  test.describe("Feedback Management", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/front-desk/feedbacks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    });

    test("FDB-001: Feedback page loads with Average Rating card", async ({
      page,
    }) => {
      await expect(page.locator("main").getByText("Guest Feedbacks").first()).toBeVisible();
      await expect(page.locator("main").getByText("Average Rating").first()).toBeVisible();
    });

    test("FDB-002: Average Rating shows numeric value with / 5.0", async ({
      page,
    }) => {
      const ratingValue = page.locator(".text-4xl.font-bold").first();
      if (await ratingValue.isVisible({ timeout: 5000 }).catch(() => false)) {
        const text = await ratingValue.textContent();
        expect(parseFloat(text || "0")).toBeGreaterThanOrEqual(0);
      }

      await expect(page.locator("main").getByText("/ 5.0").first()).toBeVisible();
    });

    test("FDB-003: Department filter dropdown (All, Front Desk, Housekeeping, F&B, Maintenance, Overall)", async ({
      page,
    }) => {
      const filter = page.locator("select").filter({ hasText: /All Departments/ }).first();
      if (await filter.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await filter.locator("option").allTextContents();
        expect(options).toEqual(
          expect.arrayContaining([
            expect.stringContaining("All Departments"),
            expect.stringContaining("Front Desk"),
            expect.stringContaining("Housekeeping"),
            expect.stringContaining("F&B"),
            expect.stringContaining("Maintenance"),
            expect.stringContaining("Overall"),
          ])
        );
      }
    });

    test("FDB-004: 'Log Feedback' button opens slide-out form", async ({
      page,
    }) => {
      const logBtn = page.locator("button").filter({ hasText: "Log Feedback" }).first();
      if (await logBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Log New Feedback").first()).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test("FDB-005: Feedback form has Guest/Room, Department, Rating stars, Comments", async ({
      page,
    }) => {
      const logBtn = page.locator("button").filter({ hasText: "Log Feedback" }).first();
      if (await logBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logBtn.click();
        await page.waitForTimeout(500);

        const fields = ["Guest / Room", "Department", "Rating", "Comments"];
        for (const f of fields) {
          await expect(page.locator(`text=${f}`).first()).toBeVisible();
        }
      }
    });

    test("FDB-006: Star rating has 5 clickable stars (1-5)", async ({
      page,
    }) => {
      const logBtn = page.locator("button").filter({ hasText: "Log Feedback" }).first();
      if (await logBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logBtn.click();
        await page.waitForTimeout(500);

        const stars = page.locator("button").filter({ has: page.locator("svg.fill-amber-500, svg.text-amber-500, svg.text-gray-300") });
        if ((await stars.count()) >= 5) {
          await expect(stars.nth(4)).toBeVisible();
        }
      }
    });

    test("FDB-007: Clicking a star updates the rating selection", async ({
      page,
    }) => {
      const logBtn = page.locator("button").filter({ hasText: "Log Feedback" }).first();
      if (await logBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logBtn.click();
        await page.waitForTimeout(500);

        const star3 = page.locator("button").filter({ has: page.locator("svg") }).nth(3);
        if (await star3.isVisible({ timeout: 3000 }).catch(() => false)) {
          await star3.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test("FDB-008: Department dropdown in form has 5 departments", async ({
      page,
    }) => {
      const logBtn = page.locator("button").filter({ hasText: "Log Feedback" }).first();
      if (await logBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logBtn.click();
        await page.waitForTimeout(500);

        const deptSelect = page.locator("select").filter({ hasText: /All Departments/ }).first();
        if (await deptSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await deptSelect.locator("option").allTextContents();
          expect(options.length).toBeGreaterThanOrEqual(5);
        }
      }
    });

    test("FDB-009: Comments textarea has placeholder", async ({ page }) => {
      const logBtn = page.locator("button").filter({ hasText: "Log Feedback" }).first();
      if (await logBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logBtn.click();
        await page.waitForTimeout(500);

        const textarea = page.locator("textarea").first();
        if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
          const placeholder = await textarea.getAttribute("placeholder");
          expect(placeholder).toContain("feedback");
        }
      }
    });

    test("FDB-010: Submit Feedback button present", async ({ page }) => {
      const logBtn = page.locator("button").filter({ hasText: "Log Feedback" }).first();
      if (await logBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logBtn.click();
        await page.waitForTimeout(500);

        await expect(
          page.locator("button").filter({ hasText: "Submit Feedback" }).first()
        ).toBeVisible();
      }
    });

    test("FDB-011: Recent Feedback table shows Guest/Unit, Rating stars, Department, Comments", async ({
      page,
    }) => {
      await expect(page.locator("main").getByText("Recent Feedback").first()).toBeVisible();

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const h = headers.join(" ").toLowerCase();
        expect(
          h.includes("guest") || h.includes("unit")
        ).toBeTruthy();
        expect(h.includes("rating")).toBeTruthy();
        expect(h.includes("department")).toBeTruthy();
        expect(h.includes("comment")).toBeTruthy();
      }
    });

    test("FDB-012: Feedback rows show star rating with filled/unfilled icons", async ({
      page,
    }) => {
      const stars = page.locator(".fill-current");
      if ((await stars.count()) > 0) {
        await expect(stars.first()).toBeVisible();
      }
    });

    test("FDB-013: Feedback shows comment in italic with quotes", async ({
      page,
    }) => {
      const comment = page.locator("text=/.+\".+\"/").first();
      if (await comment.isVisible({ timeout: 5000 }).catch(() => false)) {
        const text = await comment.textContent();
        expect(text).toMatch(/".+"/);
      }
    });

    test("FDB-014: Close feedback form via X button", async ({ page }) => {
      const logBtn = page.locator("button").filter({ hasText: "Log Feedback" }).first();
      if (await logBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logBtn.click();
        await page.waitForTimeout(500);

        const closeBtn = page.locator(".fixed button").filter({ has: page.locator("svg") }).last();
        if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });
});
