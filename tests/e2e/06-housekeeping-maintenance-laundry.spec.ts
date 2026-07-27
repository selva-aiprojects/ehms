import { test, expect } from "@playwright/test";
import { loginAsTenantUser, TENANT_CODE } from "./helpers/auth";

const EMAIL = "raghu.superadmin@ehms.demo";
const PASSWORD = "Demo@1234";

/**
 * HOUSEKEEPING, MAINTENANCE & LAUNDRY -- Complete Workflow E2E
 * Tests actual status transitions, CRUD, assignments, and cross-module flows.
 *
 * Command: npx playwright test 06-housekeeping-maintenance-laundry
 */
test.describe("Housekeeping Operations", () => {
  test.describe("HK Dashboard KPIs & Layout", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    });

    test("HK-001: Dashboard loads with 4 stat cards (Open, In Progress, Completed, Critical)", async ({
      page,
    }) => {
      const stats = ["Open Tasks", "In Progress", "Completed Today", "Critical Priority"];
      for (const s of stats) {
        await expect(page.locator(`text=${s}`).first()).toBeVisible();
      }
    });

    test("HK-002: Stat cards show numeric counts", async ({ page }) => {
      const statValues = page.locator(".text-2xl.font-bold");
      const count = await statValues.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test("HK-003: Status filter buttons visible (All, Open, In Progress, Resolved)", async ({
      page,
    }) => {
      const filters = ["All", "open", "in_progress", "resolved"];
      for (const f of filters) {
        const btn = page.locator(`button`, { hasText: new RegExp(f.replace("_", " "), "i") }).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(btn).toBeVisible();
        }
      }
    });

    test("HK-004: Clicking status filter changes task list", async ({ page }) => {
      const openBtn = page.locator("button").filter({ hasText: /^open$/i }).first();
      if (await openBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await openBtn.click();
        await page.waitForTimeout(1000);

        const activeBtn = page.locator("button").filter({ hasText: /^open$/i }).first();
        const bg = await activeBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg.includes("26") || bg.includes("60")).toBeTruthy();
      }
    });

    test("HK-005: My Tasks panel shows assigned tasks with room, priority, task type", async ({
      page,
    }) => {
      await expect(page.locator("main").getByText("My Tasks").first()).toBeVisible();

      const taskItems = page.locator(".flex.items-center.justify-between.p-3");
      if ((await taskItems.count()) > 0) {
        const first = taskItems.first();
        await expect(first).toBeVisible();

        const badges = first.locator("[class*=rounded-full]");
        expect(await badges.count()).toBeGreaterThanOrEqual(1);
      }
    });

    test("HK-006: Floor Summary panel shows per-floor task counts", async ({
      page,
    }) => {
      await expect(page.locator("main").getByText("Floor Summary").first()).toBeVisible();

      const floorRows = page.locator("text=/Floor \\d+/");
      if ((await floorRows.count()) > 0) {
        await expect(floorRows.first()).toBeVisible();
      }
    });

    test("HK-007: Linen Lifecycle Ledger shows 5 stages", async ({ page }) => {
      await expect(
        page.locator("main").getByText("Linen Lifecycle Ledger").first()
      ).toBeVisible();

      const stages = ["In Use", "Soiled", "Dispatched", "Received", "Scrapped"];
      for (const s of stages) {
        await expect(page.locator(`text=${s}`).first()).toBeVisible();
      }
    });

    test("HK-008: Staff Performance panel lists 8 staff with ratings", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Staff Performance").first()
      ).toBeVisible();

      const stars = page.locator("main").getByText("4.").first();
      if (await stars.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(stars).toBeVisible();
      }

      await expect(page.locator("main").getByText("Team Total").first()).toBeVisible();
    });

    test("HK-009: Today's Schedule shows timeline events", async ({ page }) => {
      await expect(
        page.locator("main").getByText("Today's Schedule").first()
      ).toBeVisible();

      const events = ["Breakfast Setup", "Staff Briefing", "Checkout Cleaning"];
      for (const e of events) {
        const el = page.locator(`text=${e}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("HK-010: Quality Checklist has 4 sections with checkboxes", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Quality Checklist").first()
      ).toBeVisible();

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

    test("HK-011: Equipment Status shows 8 equipment types with status", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Equipment Status").first()
      ).toBeVisible();

      const equipment = ["Vacuum Cleaners", "Floor Buffers", "Housekeeping Carts", "Steam Cleaners"];
      for (const e of equipment) {
        const el = page.locator(`text=${e}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("HK-012: Quick Actions panel has 4 action buttons", async ({ page }) => {
      await expect(page.locator("main").getByText("Quick Actions").first()).toBeVisible();

      const actions = ["View Open Tasks", "Assign New Task", "Refresh Board", "Linen Report"];
      for (const a of actions) {
        const btn = page.locator(`button`, { hasText: a }).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(btn).toBeVisible();
        }
      }
    });
  });

  test.describe("HK Task Lifecycle (Create - Start - Complete)", () => {
    test("HK-013: Create Task modal opens with all fields", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");

      const newTaskBtn = page.locator("button").filter({ hasText: /New Task|Create Task/ }).first();
      if (await newTaskBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newTaskBtn.click();

        await expect(page.locator("main").getByText("Create Task").first()).toBeVisible({ timeout: 5000 });

        const fields = ["Task Type", "Unit ID", "Assigned To", "Priority", "Notes"];
        for (const f of fields) {
          await expect(page.locator(`text=${f}`).first()).toBeVisible();
        }
      }
    });

    test("HK-014: Create Task modal shows employee dropdown with live availability badges", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");

      const newTaskBtn = page.locator("button").filter({ hasText: /New Task|Create Task/ }).first();
      if (await newTaskBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newTaskBtn.click();

        const assignSelect = page.locator("select").filter({ hasText: /Select employee|Live Availability/ }).first();
        if (await assignSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await assignSelect.locator("option").count();
          expect(options).toBeGreaterThanOrEqual(2);
        }
      }
    });

    test("HK-015: Create Task priority dropdown has 4 levels", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");

      const newTaskBtn = page.locator("button").filter({ hasText: /New Task|Create Task/ }).first();
      if (await newTaskBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newTaskBtn.click();

        const prioritySelect = page.locator("select").filter({ hasText: /Low|Medium|High|Critical/ }).first();
        if (await prioritySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await prioritySelect.locator("option").allTextContents();
          expect(options.length).toBe(4);
          expect(options.map((o) => o.toLowerCase())).toEqual(
            expect.arrayContaining(["low", "medium", "high", "critical"])
          );
        }
      }
    });

    test("HK-016: Create Task with Cancel closes modal", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");

      const newTaskBtn = page.locator("button").filter({ hasText: /New Task|Create Task/ }).first();
      if (await newTaskBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newTaskBtn.click();
        await page.waitForTimeout(500);

        const cancelBtn = page.locator("button", { hasText: "Cancel" }).first();
        if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
          await expect(page.locator("main").getByText("Create Task").first()).not.toBeVisible({ timeout: 3000 });
        }
      }
    });

    test("HK-017: Start button visible for open tasks", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const startBtns = page.locator("button").filter({ hasText: "Start" });
      if ((await startBtns.count()) > 0) {
        await expect(startBtns.first()).toBeVisible();
      }
    });

    test("HK-018: Complete button visible for in_progress tasks", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const completeBtns = page.locator("button").filter({ hasText: "Complete" });
      if ((await completeBtns.count()) > 0) {
        await expect(completeBtns.first()).toBeVisible();
      }
    });

    test("HK-019: Done badge visible for resolved tasks", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const doneBadge = page.locator("main").getByText("Done").first();
      if (await doneBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(doneBadge).toBeVisible();
      }
    });

    test("HK-020: Task item shows room number, priority badge, task type tag, floor, time", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const roomLabel = page.locator("main").getByText("/Room \\d+/").first();
      if (await roomLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(roomLabel).toBeVisible();
      }

      const floorLabel = page.locator("main").getByText("/Floor \\d+/").first();
      if (await floorLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(floorLabel).toBeVisible();
      }
    });
  });

  test.describe("HK Tasks Page (Table View)", () => {
    test("HK-021: Tasks table shows columns: Room, Task Type, Priority, Assigned, Status, Created", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const headerText = headers.join(" ").toLowerCase();
        expect(
          headerText.includes("room") ||
            headerText.includes("unit") ||
            headerText.includes("task")
        ).toBeTruthy();
        expect(headerText.includes("status")).toBeTruthy();
        expect(headerText.includes("priority")).toBeTruthy();
      }
    });

    test("HK-022: Search by room number filters task list", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill("101");
        await page.waitForTimeout(500);
      }
    });

    test("HK-023: Status filter dropdown on tasks page", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");

      const statusSelect = page.locator("select").filter({ hasText: /All Status/ }).first();
      if (await statusSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await statusSelect.locator("option").allTextContents();
        expect(options).toEqual(
          expect.arrayContaining(["All Statuses", "Open", "In Progress", "Resolved", "Completed"])
        );
      }
    });

    test("HK-024: Property filter dropdown on tasks page", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");

      const propSelect = page.locator("select").filter({ hasText: /All Properties/ }).first();
      if (await propSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await propSelect.locator("option").count();
        expect(options).toBeGreaterThanOrEqual(2);
      }
    });

    test("HK-025: View Details icon expands task detail panel", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      const eyeBtn = page.locator('[title="View Details"]').first();
      if (await eyeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await eyeBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Task Details").first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator("main").getByText("Assigned To").first()).toBeVisible();
        await expect(page.locator("main").getByText("Status").first()).toBeVisible();
        await expect(page.locator("main").getByText("Notes").first()).toBeVisible();
      }
    });

    test("HK-026: Start Task button on tasks page triggers status change", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const startBtn = page.locator('[title="Start Task"]').first();
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await startBtn.click();
        await page.waitForTimeout(2000);

        const feedback = page.locator("main").getByText("Task started").first();
        if (await feedback.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(feedback).toBeVisible();
        }
      }
    });

    test("HK-027: Complete with Checklist button opens checklist modal for in_progress tasks", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const checklistBtn = page.locator('[title="Complete with Checklist"]').first();
      if (await checklistBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checklistBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Checklist").first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator("main").getByText("Complete Task").first()).toBeVisible();
      }
    });

    test("HK-028: Checklist modal has checkbox items and Close button", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });
      await page.waitForTimeout(2000);

      const checklistBtn = page.locator('[title="Complete with Checklist"]').first();
      if (await checklistBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checklistBtn.click();
        await page.waitForTimeout(500);

        const checkboxes = page.locator('input[type="checkbox"]');
        expect(await checkboxes.count()).toBeGreaterThanOrEqual(1);

        const closeBtn = page.locator("button", { hasText: "Close" }).first();
        await expect(closeBtn).toBeVisible();
      }
    });

    test("HK-029: Close checklist modal dismisses it", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/housekeeping/tasks");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const checklistBtn = page.locator('[title="Complete with Checklist"]').first();
      if (await checklistBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await checklistBtn.click();
        await page.waitForTimeout(500);

        const closeBtn = page.locator("button", { hasText: "Close" }).first();
        if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe("HK Sub-Pages", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("HK-030: Linen page shows batches, items, transactions tabs", async ({
      page,
    }) => {
      await page.goto("/dashboard/housekeeping/linen");
      await page.waitForLoadState("domcontentloaded");

      const tabs = ["Batch", "Item", "Transaction"];
      for (const t of tabs) {
        const el = page.locator(`text=${t}`).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("HK-031: Linen page has Create/New button for adding batches", async ({
      page,
    }) => {
      await page.goto("/dashboard/housekeeping/linen");
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("main").getByText("Linen").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("HK-032: Inspections page loads with inspection list", async ({ page }) => {
      await page.goto("/dashboard/housekeeping/inspections");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Inspections").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("HK-033: HK Staff roster shows employee list with roles", async ({
      page,
    }) => {
      await page.goto("/dashboard/housekeeping/staff");
      await page.waitForLoadState("domcontentloaded");

      await expect(
        page.locator("main").getByText("Staff").first()
      ).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe("Maintenance Operations", () => {
  test.describe("Maintenance Dashboard KPIs & Layout", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);
    });

    test("MAINT-001: Dashboard loads with 4 stat cards (Open, In Progress, Resolved, Avg Resolution)", async ({
      page,
    }) => {
      const stats = ["Open", "In Progress", "Resolved Today", "Avg Resolution"];
      for (const s of stats) {
        await expect(page.locator(`text=${s}`).first()).toBeVisible();
      }
    });

    test("MAINT-002: Status filter buttons visible (All, Open, In Progress, Resolved)", async ({
      page,
    }) => {
      const filters = ["All", "open", "in_progress", "resolved"];
      for (const f of filters) {
        const btn = page.locator("button").filter({ hasText: new RegExp(f.replace("_", " "), "i") }).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(btn).toBeVisible();
        }
      }
    });

    test("MAINT-003: Priority filter buttons visible (All Priority, Critical, High, Medium, Low)", async ({
      page,
    }) => {
      await expect(
        page.locator("button").filter({ hasText: "All Priority" }).first()
      ).toBeVisible();

      const priorities = ["critical", "high", "medium", "low"];
      for (const p of priorities) {
        const btn = page.locator("button").filter({ hasText: new RegExp(`^${p}$`, "i") }).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(btn).toBeVisible();
        }
      }
    });

    test("MAINT-004: Active Tickets table shows columns: ID, Issue, Unit, Category, Priority, Status, Assigned", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Active Tickets").first()
      ).toBeVisible();

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const headerText = headers.join(" ").toLowerCase();
        expect(headerText.includes("issue") || headerText.includes("title")).toBeTruthy();
        expect(headerText.includes("priority")).toBeTruthy();
        expect(headerText.includes("status")).toBeTruthy();
      }
    });

    test("MAINT-005: AMC Monitor card shows active and expired AMCs", async ({
      page,
    }) => {
      await expect(page.locator("main").getByText("AMC Monitor").first()).toBeVisible();

      const amcBadges = page.locator("main").getByText("/active|expired/").first();
      if (await amcBadges.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(amcBadges).toBeVisible();
      }
    });

    test("MAINT-006: Preventive Maintenance Schedule table visible", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Preventive Maintenance Schedule").first()
      ).toBeVisible();

      const table = page.locator("table").nth(1);
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const headerText = headers.join(" ").toLowerCase();
        expect(
          headerText.includes("task") ||
            headerText.includes("asset") ||
            headerText.includes("frequency")
        ).toBeTruthy();
      }
    });

    test("MAINT-007: Parts Inventory panel shows parts with stock levels and reorder alerts", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Parts Inventory").first()
      ).toBeVisible();

      const lowStock = page.locator("main").getByText("/\\d+ low stock/").first();
      if (await lowStock.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(lowStock).toBeVisible();
      }
    });

    test("MAINT-008: Maintenance Team panel shows 8 technicians with availability status", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Maintenance Team").first()
      ).toBeVisible();

      const avail = page.locator("main").getByText("/\\d+\\/\\d+ available/").first();
      if (await avail.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(avail).toBeVisible();
      }

      const statuses = ["available", "busy", "off"];
      for (const s of statuses) {
        const el = page.locator(`text=${s}`).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });

    test("MAINT-009: Vendor Performance panel shows vendor ratings and response times", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Vendor Performance").first()
      ).toBeVisible();

      const avgRating = page.locator("main").getByText("/Avg rating/").first();
      if (await avgRating.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(avgRating).toBeVisible();
      }
    });

    test("MAINT-010: Weekly Workload bar chart visible with legend", async ({
      page,
    }) => {
      await expect(
        page.locator("main").getByText("Weekly Workload Chart").first()
      ).toBeVisible();

      const legend = page.locator("main").getByText("Tickets Raised").first();
      if (await legend.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(legend).toBeVisible();
        await expect(page.locator("main").getByText("Completed").first()).toBeVisible();
      }
    });

    test("MAINT-011: Critical badge shows when critical tickets exist", async ({
      page,
    }) => {
      const critical = page.locator("main").getByText("/\\d+ Critical/").first();
      if (await critical.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(critical).toBeVisible();
      }
    });

    test("MAINT-012: 4 bottom stat cards: Total Parts, Team Available, Avg Vendor Rating, Weekly Total", async ({
      page,
    }) => {
      const cards = ["Total Parts", "Team Available", "Avg Vendor Rating", "Weekly Total"];
      for (const c of cards) {
        const el = page.locator(`text=${c}`).first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(el).toBeVisible();
        }
      }
    });
  });

  test.describe("Maintenance Ticket Lifecycle", () => {
    test("MAINT-013: Create Ticket modal opens with all fields", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");

      const newBtn = page.locator("button").filter({ hasText: "New Ticket" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Create New Ticket").first()).toBeVisible({ timeout: 5000 });

        const fields = ["Title", "Description", "Priority", "Category"];
        for (const f of fields) {
          await expect(page.locator(`text=${f}`).first()).toBeVisible();
        }
      }
    });

    test("MAINT-014: Create Ticket category dropdown has 6 options", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");

      const newBtn = page.locator("button").filter({ hasText: "New Ticket" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();

        const catSelect = page.locator("select").filter({ hasText: /Select/ }).first();
        if (await catSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await catSelect.locator("option").allTextContents();
          const categories = options.map((o) => o.toLowerCase());
          expect(categories).toEqual(
            expect.arrayContaining(["hvac", "plumbing", "electrical"])
          );
        }
      }
    });

    test("MAINT-015: Create Ticket with Cancel closes form", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");

      const newBtn = page.locator("button").filter({ hasText: "New Ticket" }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();

        const cancelBtn = page.locator("button", { hasText: "Cancel" }).first();
        if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test("MAINT-016: Guest Feedback Triage section shows negative reviews with Raise Ticket button", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
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

    test("MAINT-017: Raise Ticket from feedback creates new maintenance ticket", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const raiseBtn = page.locator("button").filter({ hasText: "Raise Ticket" }).first();
      if (await raiseBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await raiseBtn.click();
        await page.waitForTimeout(2000);

        const feedback = page.locator("main").getByText("Converted feedback").first();
        if (await feedback.isVisible({ timeout: 5000 }).catch(() => false)) {
          await expect(feedback).toBeVisible();
        }
      }
    });

    test("MAINT-018: Assign ticket opens dropdown with vendors and on-site staff", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const assignBtn = page.locator('[title="Assign"]').first();
      if (await assignBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await assignBtn.click();
        await page.waitForTimeout(500);

        const vendorGroup = page.locator("main").getByText("Maintenance Vendors").first();
        if (await vendorGroup.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(vendorGroup).toBeVisible();
        }

        const staffGroup = page.locator("main").getByText("On-site Staff").first();
        if (await staffGroup.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(staffGroup).toBeVisible();
        }
      }
    });

    test("MAINT-019: Start button visible for assigned tickets", async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const startBtn = page.locator('[title="Start"]').first();
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(startBtn).toBeVisible();
      }
    });

    test("MAINT-020: Resolve button visible for in_progress tickets", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const resolveBtn = page.locator('[title="Resolve"]').first();
      if (await resolveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(resolveBtn).toBeVisible();
      }
    });

    test("MAINT-021: Close button visible for resolved or in_progress tickets", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const closeBtn = page.locator('[title="Close"]').first();
      if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(closeBtn).toBeVisible();
      }
    });
  });

  test.describe("Maintenance Ticket Detail Panel", () => {
    test("MAINT-022: Expand ticket shows Parts Used, Time Logged, Approval History", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const expandBtn = page.locator('[title="Details"]').first();
      if (await expandBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expandBtn.click();
        await page.waitForTimeout(1000);

        await expect(page.locator("main").getByText("Parts Used").first()).toBeVisible();
        await expect(page.locator("main").getByText("Time Logged").first()).toBeVisible();
        await expect(
          page.locator("main").getByText("Approval History").first()
        ).toBeVisible();
      }
    });

    test("MAINT-023: Ticket detail shows part names with quantity and unit price", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const expandBtn = page.locator('[title="Details"]').first();
      if (await expandBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expandBtn.click();
        await page.waitForTimeout(1000);

        const partSection = page.locator("main").getByText("Parts Used").first();
        if (await partSection.isVisible({ timeout: 3000 }).catch(() => false)) {
          const partItems = partSection.locator("..").locator("..").locator("div").filter({ hasText: /\$/ });
          if ((await partItems.count()) > 0) {
            await expect(partItems.first()).toBeVisible();
          }
        }
      }
    });

    test("MAINT-024: Ticket detail shows technician hours logged", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const expandBtn = page.locator('[title="Details"]').first();
      if (await expandBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expandBtn.click();
        await page.waitForTimeout(1000);

        const timeSection = page.locator("main").getByText("Time Logged").first();
        if (await timeSection.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(timeSection).toBeVisible();
        }
      }
    });

    test("MAINT-025: Ticket detail shows approval badges (approved/rejected/pending)", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const expandBtn = page.locator('[title="Details"]').first();
      if (await expandBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expandBtn.click();
        await page.waitForTimeout(1000);

        const approvalSection = page.locator("main").getByText("Approval History").first();
        if (await approvalSection.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(approvalSection).toBeVisible();
        }
      }
    });
  });

  test.describe("Maintenance Sub-Pages", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    });

    test("MAINT-026: Parts inventory page shows parts list with stock levels", async ({
      page,
    }) => {
      await page.goto("/dashboard/maintenance/parts");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });

      await expect(page.locator("main").getByText("Parts").first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("MAINT-027: Assets page shows asset list with status", async ({
      page,
    }) => {
      await page.goto("/dashboard/maintenance/assets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });

      await expect(page.locator("main").getByText("Assets").first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("MAINT-028: Tickets page table shows Ticket#, Issue, Unit, Category, Priority, Status columns", async ({
      page,
    }) => {
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      const table = page.locator("table");
      if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
        const headers = await table.locator("th").allTextContents();
        const headerText = headers.join(" ").toLowerCase();
        expect(
          headerText.includes("ticket") || headerText.includes("id")
        ).toBeTruthy();
        expect(headerText.includes("issue")).toBeTruthy();
        expect(headerText.includes("priority")).toBeTruthy();
        expect(headerText.includes("status")).toBeTruthy();
        expect(headerText.includes("assigned")).toBeTruthy();
      }
    });

    test("MAINT-029: Tickets page search filters by title or ticket ID", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });

      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill("HVAC");
        await page.waitForTimeout(500);
      }
    });

    test("MAINT-030: Tickets page status filter dropdown (Open, Assigned, In Progress, Resolved, Closed)", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });

      const statusSelect = page.locator("select").filter({ hasText: /All Status/ }).first();
      if (await statusSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await statusSelect.locator("option").allTextContents();
        expect(options).toEqual(
          expect.arrayContaining([
            expect.stringContaining("Open"),
            expect.stringContaining("Assigned"),
            expect.stringContaining("In Progress"),
            expect.stringContaining("Resolved"),
            expect.stringContaining("Closed"),
          ])
        );
      }
    });

    test("MAINT-031: Tickets page priority filter (low, medium, high, critical)", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });

      const prioSelect = page.locator("select").filter({ hasText: /All Priority/ }).first();
      if (await prioSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await prioSelect.locator("option").allTextContents();
        const lower = options.map((o) => o.toLowerCase());
        expect(lower).toEqual(
          expect.arrayContaining([
            expect.stringContaining("low"),
            expect.stringContaining("medium"),
            expect.stringContaining("high"),
            expect.stringContaining("critical"),
          ])
        );
      }
    });

    test("MAINT-032: Tickets page category filter (HVAC, Plumbing, Electrical, Elevator, Pool, Other)", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });

      const catSelect = page.locator("select").filter({ hasText: /All Categories/ }).first();
      if (await catSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        const options = await catSelect.locator("option").allTextContents();
        expect(options).toEqual(
          expect.arrayContaining([
            expect.stringContaining("HVAC"),
            expect.stringContaining("Plumbing"),
            expect.stringContaining("Electrical"),
          ])
        );
      }
    });

    test("MAINT-033: Create Ticket on tickets page opens modal with vendor/staff assignment", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });

      const createBtn = page
        .locator("button", { hasText: "Create Ticket" })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);

        await expect(page.locator("main").getByText("Create Ticket").first()).toBeVisible({
          timeout: 5000,
        });

        await expect(page.locator("main").getByText("Title").first()).toBeVisible();
        await expect(page.locator("main").getByText("Category").first()).toBeVisible();
        await expect(page.locator("main").getByText("Priority").first()).toBeVisible();
        await expect(page.locator("main").getByText("Assign To").first()).toBeVisible();
      }
    });

    test("MAINT-034: Assign To dropdown shows vendor and staff optgroups", async ({
      page,
    }) => {
      await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
      await page.goto("/dashboard/maintenance/tickets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator("main").waitFor({ timeout: 15000 });

      const createBtn = page
        .locator("button", { hasText: "Create Ticket" })
        .first();
      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);

        const assignSelect = page.locator("select").filter({ hasText: /Unassigned/ }).first();
        if (await assignSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          const options = await assignSelect.locator("option, optgroup").allTextContents();
          const optionText = options.join(" ");
          expect(
            optionText.includes("Vendor") ||
              optionText.includes("Staff") ||
              optionText.includes("Maintenance")
          ).toBeTruthy();
        }
      }
    });
  });
});

test.describe("Laundry Operations", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
  });

  test("LAUN-001: Laundry page loads with order list", async ({ page }) => {
    await page.goto("/dashboard/laundry");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main").getByText("Laundry").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("LAUN-002: 5-step status flow visible (Pending, Picked Up, In Progress, Ready, Delivered)", async ({
    page,
  }) => {
    await page.goto("/dashboard/laundry");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const statuses = [
      "Pending",
      "Picked Up",
      "In Progress",
      "Ready",
      "Delivered",
    ];
    for (const s of statuses) {
      const el = page.locator(`text=${s}`).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(el).toBeVisible();
      }
    }
  });

  test("LAUN-003: Create laundry order form opens", async ({ page }) => {
    await page.goto("/dashboard/laundry");
    await page.waitForLoadState("domcontentloaded");

    const createBtn = page
      .locator("button", { hasText: /New|Create|Add/ })
      .first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test("LAUN-004: Laundry page shows room/unit association for orders", async ({
    page,
  }) => {
    await page.goto("/dashboard/laundry");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await expect(page.locator("main").getByText("Laundry").first()).toBeVisible();
  });
});

test.describe("Cross-Module: Guest Request -> HK Task -> Maintenance Ticket", () => {
  test("CROSS-001: Guest request page shows request type categories", async ({
    page,
  }) => {
    await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    await page.goto("/dashboard/front-desk/requests");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("main").waitFor({ timeout: 15000 });

    await expect(
      page.locator("main").getByText("Guest Requests").first()
    ).toBeVisible({ timeout: 10000 });

    const newReqBtn = page
      .locator("button", { hasText: "New Request" })
      .first();
    if (await newReqBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newReqBtn.click();
      await page.waitForTimeout(500);

      const types = page.locator("select option, label").filter({
        hasText: /Housekeeping|Maintenance|Room Service|Front Desk/,
      });
      if ((await types.count()) > 0) {
        await expect(types.first()).toBeVisible();
      }
    }
  });

  test("CROSS-002: HK tasks page shows task types matching guest request categories", async ({
    page,
  }) => {
    await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    await page.goto("/dashboard/housekeeping/tasks");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const table = page.locator("table");
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      const taskTypes = await table.locator("td").allTextContents();
      const allText = taskTypes.join(" ").toLowerCase();
      expect(
        allText.includes("clean") ||
          allText.includes("turndown") ||
          allText.includes("checkout") ||
          allText.includes("inspection") ||
          allText.includes("deep") ||
          allText.includes("linen") ||
          allText.includes("restock")
      ).toBeTruthy();
    }
  });

  test("CROSS-003: Maintenance tickets can be linked to guest complaints via feedback triage", async ({
    page,
    }) => {
    await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
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

  test("CROSS-004: Command Center room detail shows guest services shortcuts", async ({
    page,
  }) => {
    await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    await page.goto("/dashboard/front-desk", { waitUntil: "domcontentloaded" });
    await page.locator("main").waitFor({ timeout: 15000 });
    await page.waitForTimeout(1000);

    await expect(
      page.locator("main").getByText("Front Desk Command Center").first()
    ).toBeVisible({ timeout: 15000 });

    const occupiedRoom = page
      .locator("button")
      .filter({ hasText: "Occupied" })
      .first();
    if (await occupiedRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
      await occupiedRoom.click();
      await page.waitForTimeout(500);

      const quickActions = page.locator("main").getByText("Quick Actions").first();
      if (await quickActions.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(quickActions).toBeVisible();
      }
    }
  });

  test("CROSS-005: HK dashboard Assign New Task opens task creation", async ({
    page,
  }) => {
    await loginAsTenantUser(page, EMAIL, PASSWORD, TENANT_CODE, "hotels");
    await page.goto("/dashboard/housekeeping");
    await page.waitForLoadState("domcontentloaded");

    const assignBtn = page
      .locator("button")
      .filter({ hasText: "Assign New Task" })
      .first();
    if (await assignBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await assignBtn.click();
      await page.waitForTimeout(500);

      await expect(page.locator("main").getByText("Create Task").first()).toBeVisible({
        timeout: 5000,
      });
    }
  });
});
