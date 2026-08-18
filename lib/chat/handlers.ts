/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/chat/handlers.ts
 * Intent handlers for the MVP chat engine. Each handler is a pure async
 * function over (ctx, slots, sql) and returns a ChatTurnResult.
 *
 * DB access is via getDb() (Neon tagged-template driver). Queries that need
 * dynamic property scoping use sql.query(text, params) to avoid the driver
 * quirk with nested empty tagged templates. Property scoping is enforced with
 * an ANY(...) uuid array wherever the user is property-scoped.
 */

import type {
  ChatContext,
  ChatIntent,
  ChatTurnResult,
  ExtractedSlots,
} from "./types";
import { ALL_INTENTS, availableIntents } from "./catalog";
import { isPropertyUnrestricted } from "./context";
import { calculateBookingPrice } from "@/lib/pricing";
import type { WrappedSql } from "@/lib/db";

const UTIL_CAPABILITIES = ALL_INTENTS.find((i) => i.id === "util.capabilities")!;

type Sql = WrappedSql;
type Handler = (ctx: ChatContext, slots: ExtractedSlots, sql: Sql) => Promise<ChatTurnResult>;

/** Builds `property_id = ANY($n::uuid[])` / `= $n` and pushes params. */
function propClause(ctx: ChatContext, column: string, params: unknown[]): string {
  const propIds = isPropertyUnrestricted(ctx) ? [] : ctx.assignedPropertyIds;
  const scoped = ctx.propertyId ? [ctx.propertyId] : propIds;
  if (scoped.length === 0) return "TRUE";
  params.push(scoped);
  return `${column} = ANY($${params.length}::uuid[])`;
}

function guestName(g: any): string {
  if (!g) return "Guest";
  return [g.first_name, g.last_name].filter(Boolean).join(" ").trim() || "Guest";
}

function shortId(id: string): string {
  return id ? `${id.slice(0, 8)}…` : "—";
}

function isoDate(v: unknown): string {
  if (!v) return "—";
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? String(v).slice(0, 10) : d.toISOString().slice(0, 10);
}

function base(ctx: ChatContext, intent: ChatIntent): Omit<ChatTurnResult, "content"> {
  return {
    intentId: intent.id,
    intentName: intent.name,
    module: intent.module,
    action: intent.action,
    risk: intent.risk,
    warnings: [],
    suggestions: [],
    confirmationRequired: false,
  };
}

/** Resolve a concrete property for write intents, or null when ambiguous. */
function resolvePropertyId(ctx: ChatContext): string | null {
  if (ctx.propertyId) return ctx.propertyId;
  if (ctx.assignedPropertyIds.length === 1) return ctx.assignedPropertyIds[0];
  return null;
}

const handlers: Record<string, Handler> = {
  "util.capabilities": async (ctx) => {
    const intents = availableIntents(ctx);
    const byModule = new Map<string, string[]>();
    for (const i of intents) {
      if (!byModule.has(i.module)) byModule.set(i.module, []);
      byModule.get(i.module)!.push(i.name);
    }
    const lines = [...byModule.entries()]
      .map(([m, names]) => `• ${m}: ${names.join(", ")}`)
      .join("\n");
    return {
      ...base(ctx, UTIL_CAPABILITIES),
      content: `I can help with the following (${intents.length} commands available to your role):\n${lines}\n\nTry "Show today's arrivals" or "What is the occupancy?"`,
      data: intents.map((i) => ({ id: i.id, name: i.name, module: i.module, action: i.action })),
    };
  },

  "ops.occupancy.status": async (ctx, _slots, sql) => {
    const params: unknown[] = [];
    const rows = await sql.query(
      `SELECT u.status, COUNT(*) AS cnt
       FROM units u
       JOIN floors f ON f.id = u.floor_id
       JOIN buildings bld ON bld.id = f.building_id
       WHERE u.is_active = true AND ${propClause(ctx, "bld.property_id", params)}
       GROUP BY u.status`,
      params
    );
    const counts: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      counts[r.status] = Number(r.cnt);
      total += Number(r.cnt);
    }
    const occupied = counts.occupied || 0;
    const pct = total ? Math.round((occupied / total) * 100) : 0;
    const lines = [
      `Occupancy: ${occupied}/${total} (${pct}%)`,
      `Vacant: ${counts.vacant || 0}`,
      `Dirty / cleaning: ${(counts.dirty || 0) + (counts.cleaning || 0)}`,
      `Out of service: ${counts.maintenance || 0}`,
      `Reserved: ${counts.reserved || 0}`,
    ];
    return {
      ...base(ctx, await requireIntent("ops.occupancy.status")),
      content: lines.join("\n"),
      data: { total, occupied, pct, counts },
    };
  },

  "ops.arrivals.today": async (ctx, _slots, sql) => {
    const params: unknown[] = [];
    const rows = await sql.query(
      `SELECT b.id, b.check_in, b.adults, u.unit_label,
              gp.first_name, gp.last_name, gp.phone
       FROM bookings b
       JOIN units u ON u.id = b.unit_id
       LEFT JOIN booking_guests bg ON bg.booking_id = b.id AND bg.is_primary = true
       LEFT JOIN guest_profiles gp ON gp.id = bg.guest_id
       WHERE ${propClause(ctx, "b.property_id", params)}
         AND b.status IN ('confirmed','checked_in')
         AND b.check_in::date = CURRENT_DATE
       ORDER BY b.check_in ASC
       LIMIT 25`,
      params
    );
    if (rows.length === 0) {
      return {
        ...base(ctx, await requireIntent("ops.arrivals.today")),
        content: "No arrivals expected today.",
        data: [],
      };
    }
    const lines = rows.map(
      (b: any) => `${guestName(b)} — ${b.unit_label} (${b.adults} guest${Number(b.adults) === 1 ? "" : "s"})`
    );
    return {
      ...base(ctx, await requireIntent("ops.arrivals.today")),
      content: `Expected arrivals today (${rows.length}):\n${lines.join("\n")}`,
      data: rows,
    };
  },

  "ops.departures.today": async (ctx, _slots, sql) => {
    const params: unknown[] = [];
    const rows = await sql.query(
      `SELECT b.id, b.check_out, u.unit_label,
              gp.first_name, gp.last_name, gp.phone
       FROM bookings b
       JOIN units u ON u.id = b.unit_id
       LEFT JOIN booking_guests bg ON bg.booking_id = b.id AND bg.is_primary = true
       LEFT JOIN guest_profiles gp ON gp.id = bg.guest_id
       WHERE ${propClause(ctx, "b.property_id", params)}
         AND b.status IN ('confirmed','checked_in')
         AND b.check_out::date = CURRENT_DATE
       ORDER BY b.check_out ASC
       LIMIT 25`,
      params
    );
    if (rows.length === 0) {
      return {
        ...base(ctx, await requireIntent("ops.departures.today")),
        content: "No departures scheduled today.",
        data: [],
      };
    }
    const lines = rows.map(
      (b: any) => `${guestName(b)} — ${b.unit_label} (check-out ${isoDate(b.check_out)})`
    );
    return {
      ...base(ctx, await requireIntent("ops.departures.today")),
      content: `Departures today (${rows.length}):\n${lines.join("\n")}`,
      data: rows,
    };
  },

  "ops.dirty.rooms": async (ctx, _slots, sql) => {
    const params: unknown[] = [];
    const rows = await sql.query(
      `SELECT u.id, u.unit_label, u.status, u.layout_type,
              bld.name AS building_name
       FROM units u
       JOIN floors f ON f.id = u.floor_id
       JOIN buildings bld ON bld.id = f.building_id
       WHERE u.is_active = true
         AND u.status IN ('dirty','cleaning')
         AND ${propClause(ctx, "bld.property_id", params)}
       ORDER BY u.unit_label`,
      params
    );
    if (rows.length === 0) {
      return {
        ...base(ctx, await requireIntent("ops.dirty.rooms")),
        content: "No dirty rooms right now.",
        data: [],
      };
    }
    const dirty = rows.filter((r: any) => r.status === "dirty").map((r: any) => r.unit_label);
    const cleaning = rows.filter((r: any) => r.status === "cleaning").map((r: any) => r.unit_label);
    const lines = [
      dirty.length ? `Dirty (${dirty.length}): ${dirty.join(", ")}` : "Dirty: none",
      cleaning.length ? `Being cleaned (${cleaning.length}): ${cleaning.join(", ")}` : "Being cleaned: none",
    ];
    return {
      ...base(ctx, await requireIntent("ops.dirty.rooms")),
      content: lines.join("\n"),
      data: rows,
    };
  },

  "guest.lookup.summary": async (ctx, slots, sql) => {
    if (!slots.phone) {
      return {
        ...base(ctx, await requireIntent("guest.lookup.summary")),
        error: "Please provide the guest's 10-digit phone number.",
      };
    }
    const guestRows = await sql.query(
      `SELECT id, first_name, last_name, email, phone, id_type, tags,
              total_stays, loyalty_points, created_at
       FROM guest_profiles
       WHERE phone = $1 OR phone ILIKE $2
       LIMIT 1`,
      [slots.phone, `%${slots.phone.slice(-10)}%`]
    );
    if (guestRows.length === 0) {
      return {
        ...base(ctx, await requireIntent("guest.lookup.summary")),
        error: `No guest found for phone ${slots.phone}.`,
      };
    }
    const g = guestRows[0];
    const params: unknown[] = [g.id];
    const bookingRows = await sql.query(
      `SELECT b.id, b.status, b.check_in, b.check_out, b.total_amount, b.paid_amount,
              u.unit_label
       FROM bookings b
       JOIN units u ON u.id = b.unit_id
       WHERE b.guest_id = $1 AND b.status IN ('confirmed','checked_in')
       ORDER BY b.check_in DESC
       LIMIT 5`,
      params
    );
    const open = bookingRows.length ? `Active booking(s): ${bookingRows.length}` : "No active booking";
    return {
      ...base(ctx, await requireIntent("guest.lookup.summary")),
      content: `${guestName(g)} — ${g.phone}\n${g.email || "no email"}\nStays: ${g.total_stays ?? 0} | Loyalty: ${g.loyalty_points ?? 0}\n${open}\n${
        bookingRows.length
          ? bookingRows.map((b: any) => `  ${b.unit_label} · ${b.status} · ${isoDate(b.check_in)}`).join("\n")
          : ""
      }`,
      data: { guest: g, bookings: bookingRows },
    };
  },

  "frontdesk.folio.balance": async (ctx, slots, sql) => {
    const params: unknown[] = [];
    const p = propClause(ctx, "b.property_id", params);
    const conds = ["b.status IN ('confirmed','checked_in')"];
    if (slots.phone) {
      params.push(slots.phone);
      conds.push(`(gp.phone = $${params.length} OR gp.phone ILIKE '%' || $${params.length})`);
    } else if (slots.bookingRef) {
      params.push(`%${slots.bookingRef}%`);
      conds.push(`b.source_booking_ref ILIKE $${params.length}`);
    } else if (slots.roomNo) {
      params.push(slots.roomNo);
      conds.push(`u.unit_label = $${params.length}`);
    } else {
      return {
        ...base(ctx, await requireIntent("frontdesk.folio.balance")),
        error: "Provide a guest phone number, room number, or booking reference.",
      };
    }
    const rows = await sql.query(
      `SELECT b.id, b.total_amount, b.paid_amount, b.balance_amount, b.status,
              u.unit_label, gp.first_name, gp.last_name, gp.phone
       FROM bookings b
       JOIN units u ON u.id = b.unit_id
       LEFT JOIN booking_guests bg ON bg.booking_id = b.id AND bg.is_primary = true
       LEFT JOIN guest_profiles gp ON gp.id = bg.guest_id
       WHERE ${p} AND ${conds.join(" AND ")}
       ORDER BY b.check_in DESC
       LIMIT 10`,
      params
    );
    if (rows.length === 0) {
      return {
        ...base(ctx, await requireIntent("frontdesk.folio.balance")),
        content: "No open folio found for that guest.",
        data: [],
      };
    }
    const total = rows.reduce((s: number, r: any) => s + Number(r.balance_amount || 0), 0);
    const lines = rows.map(
      (r: any) =>
        `${guestName(r)} · ${r.unit_label} · ${r.status} · ₹${Number(r.balance_amount || 0).toLocaleString("en-IN")}`
    );
    return {
      ...base(ctx, await requireIntent("frontdesk.folio.balance")),
      content: `Outstanding balance: ₹${total.toLocaleString("en-IN")}\n${lines.join("\n")}`,
      data: { total, bookings: rows },
    };
  },

  "maint.tickets.list": async (ctx, _slots, sql) => {
    const params: unknown[] = [];
    const rows = await sql.query(
      `SELECT mt.id, mt.ticket_number, mt.title, mt.category, mt.priority, mt.status,
              mt.created_at, u.unit_label
       FROM maintenance_tickets mt
       LEFT JOIN units u ON u.id = mt.unit_id
       WHERE ${propClause(ctx, "mt.property_id", params)}
         AND mt.status IN ('open','assigned','in_progress')
       ORDER BY CASE mt.priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                mt.created_at DESC
       LIMIT 25`,
      params
    );
    if (rows.length === 0) {
      return {
        ...base(ctx, await requireIntent("maint.tickets.list")),
        content: "No open maintenance tickets.",
        data: [],
      };
    }
    const lines = rows.map(
      (t: any) => `${t.ticket_number} · ${t.priority} · ${t.status} · ${t.unit_label || "—"} · ${t.title}`
    );
    return {
      ...base(ctx, await requireIntent("maint.tickets.list")),
      content: `Open maintenance tickets (${rows.length}):\n${lines.join("\n")}`,
      data: rows,
    };
  },

  "hk.tasks.mine": async (ctx, _slots, sql) => {
    const isManager = /manager|executive|super_admin|property_manager/.test(ctx.role);
    const params: unknown[] = [];
    const p = propClause(ctx, "ht.property_id", params);
    let assignFilter = "";
    if (!isManager && ctx.userId) {
      params.push(ctx.userId);
      assignFilter = `AND (ht.assigned_to = $${params.length} OR ht.assigned_to IS NULL)`;
    }
    const rows = await sql.query(
      `SELECT ht.id, ht.task_type, ht.priority, ht.status, ht.scheduled_at, ht.created_at,
              u.unit_label
       FROM housekeeping_tasks ht
       LEFT JOIN units u ON u.id = ht.unit_id
       WHERE ${p}
         AND ht.status IN ('pending','assigned','in_progress')
         ${assignFilter}
       ORDER BY ht.created_at DESC
       LIMIT 25`,
      params
    );
    if (rows.length === 0) {
      return {
        ...base(ctx, await requireIntent("hk.tasks.mine")),
        content: isManager ? "No pending housekeeping tasks in this property." : "You have no assigned tasks right now.",
        data: [],
      };
    }
    const lines = rows.map(
      (t: any) => `${shortId(t.id)} · ${t.unit_label || "—"} · ${t.task_type} · ${t.priority} · ${t.status}`
    );
    return {
      ...base(ctx, await requireIntent("hk.tasks.mine")),
      content: `Housekeeping tasks (${rows.length}):\n${lines.join("\n")}`,
      data: rows,
    };
  },

  "inv.low.stock": async (ctx, _slots, sql) => {
    const params: unknown[] = [];
    const rows = await sql.query(
      `SELECT ii.id, ii.name, ii.sku, ii.quantity_on_hand, ii.reorder_level, ii.unit, ii.unit_cost
       FROM inventory_items ii
       WHERE ${propClause(ctx, "ii.property_id", params)}
         AND ii.is_active = true
         AND ii.quantity_on_hand <= ii.reorder_level
       ORDER BY (ii.quantity_on_hand - ii.reorder_level) ASC
       LIMIT 20`,
      params
    );
    if (rows.length === 0) {
      return {
        ...base(ctx, await requireIntent("inv.low.stock")),
        content: "No low-stock items.",
        data: [],
      };
    }
    const lines = rows.map(
      (i: any) => `${i.name} (${i.sku || "—"}) — ${i.quantity_on_hand} ${i.unit} / reorder at ${i.reorder_level}`
    );
    return {
      ...base(ctx, await requireIntent("inv.low.stock")),
      content: `Low-stock items (${rows.length}):\n${lines.join("\n")}`,
      data: rows,
    };
  },

  "frontdesk.reservation.create": async (ctx, slots, sql) => {
    const intent = await requireIntent("frontdesk.reservation.create");
    const propId = resolvePropertyId(ctx);
    if (!propId) {
      return {
        ...base(ctx, intent),
        error: "Please select a property first so the booking can be filed.",
      };
    }
    if (!slots.phone) {
      return {
        ...base(ctx, intent),
        error: "To book, please provide the guest's 10-digit phone number (e.g. \"book for 9876543210\").",
      };
    }
    if (!slots.nights) {
      return {
        ...base(ctx, intent),
        error: "How many nights? (e.g. \"book a deluxe room for 2 nights\")",
      };
    }

    // Resolve guest — reuse existing profile or create a minimal one.
    const guestRows = await sql.query(
      `SELECT id, first_name, last_name, phone FROM guest_profiles WHERE phone = $1 OR phone ILIKE $2 LIMIT 1`,
      [slots.phone, `%${slots.phone}%`]
    );
    let guestId: string;
    if (guestRows.length) {
      guestId = guestRows[0].id;
    } else {
      const created = await sql.query(
        `INSERT INTO guest_profiles (first_name, last_name, phone)
         VALUES ($1, $2, $3) RETURNING id`,
        ["Walk-in", null, slots.phone]
      );
      guestId = created[0].id;
    }

    // Pick an available unit — prefer a category match on the label.
    const params: unknown[] = [];
    const p = propClause(ctx, "bld.property_id", params);
    const pref = slots.category ? `AND (u.unit_label ILIKE '%' || $${params.length + 1} || '%' OR u.attributes->>'category' ILIKE '%' || $${params.length + 1} || '%')` : "";
    if (slots.category) params.push(slots.category);
    params.push("vacant");
    const unitRows = await sql.query(
      `SELECT u.id, u.unit_label, u.base_rate
       FROM units u
       JOIN floors f ON f.id = u.floor_id
       JOIN buildings bld ON bld.id = f.building_id
       WHERE u.is_active = true AND u.status = $${params.length}
         AND ${p} ${pref}
       ORDER BY u.unit_label
       LIMIT 1`,
      params
    );
    if (unitRows.length === 0) {
      return {
        ...base(ctx, intent),
        error: "No vacant units available for that property.",
      };
    }
    const unit = unitRows[0];

    // Compute check-in/out from slots.date + nights.
    const start = new Date();
    if (slots.date === "tomorrow") start.setDate(start.getDate() + 1);
    else if (slots.date && slots.date !== "today") {
      const d = new Date(`${slots.date}T12:00:00`);
      if (!Number.isNaN(d.getTime())) start.setTime(d.getTime());
    }
    start.setHours(14, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + slots.nights);
    end.setHours(11, 0, 0, 0);

    const price = calculateBookingPrice;
    const { totalAmount, nights } = price("nightly", Number(unit.base_rate) || 0, start, end);

    const inserted = await sql.query(
      `INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source,
                             check_in, check_out, adults, total_amount, paid_amount, special_requests)
       VALUES ($1, $2, $3, 'nightly', 'confirmed', 'direct', $4, $5, $6, $7, 0, $8)
       RETURNING id`,
      [propId, unit.id, guestId, start.toISOString(), end.toISOString(), 1, totalAmount, slots.freeText || null]
    );
    const bookingId = inserted[0].id;
    await sql.query(
      `INSERT INTO booking_guests (booking_id, guest_id, is_primary) VALUES ($1, $2, true)`,
      [bookingId, guestId]
    );
    await sql.query(`UPDATE units SET status = 'reserved' WHERE id = $1`, [unit.id]);

    const guestName = guestRows.length ? guestNameOf(guestRows[0]) : slots.phone;
    return {
      ...base(ctx, intent),
      content: `Booking confirmed for ${guestName}\n${unit.unit_label} · ${nights} night(s)\nCheck-in ${start.toISOString().slice(0, 10)} · Check-out ${end.toISOString().slice(0, 10)}\nTotal ₹${totalAmount.toLocaleString("en-IN")} (balance ₹${totalAmount.toLocaleString("en-IN")})\nBooking ID: ${shortId(bookingId)}`,
      data: { bookingId, unitLabel: unit.unit_label, totalAmount, nights, guestId },
      warnings: ["Walk-in created as confirmed; OTA/overlap not checked."],
    };
  },

  "frontdesk.request.create": async (ctx, slots, sql) => {
    const intent = await requireIntent("frontdesk.request.create");
    const propId = resolvePropertyId(ctx);
    if (!propId) {
      return {
        ...base(ctx, intent),
        error: "Please select a property first.",
      };
    }
    if (!slots.freeText && !slots.roomNo) {
      return {
        ...base(ctx, intent),
        error: "Describe the request and the room, e.g. \"log a request for extra towels in room 201\".",
      };
    }
    // Locate an open booking for the room/phone.
    const params: unknown[] = [];
    const p = propClause(ctx, "b.property_id", params);
    let locConds = "";
    if (slots.roomNo) {
      params.push(slots.roomNo);
      locConds = `u.unit_label = $${params.length}`;
    } else if (slots.phone) {
      params.push(slots.phone);
      locConds = `(gp.phone = $${params.length})`;
    }
    const bookingRows = locConds
      ? await sql.query(
          `SELECT b.id, b.guest_id, u.unit_label
           FROM bookings b
           JOIN units u ON u.id = b.unit_id
           LEFT JOIN booking_guests bg ON bg.booking_id = b.id AND bg.is_primary = true
           LEFT JOIN guest_profiles gp ON gp.id = bg.guest_id
           WHERE ${p} AND b.status IN ('confirmed','checked_in') AND ${locConds}
           ORDER BY b.check_in DESC LIMIT 1`,
          params
        )
      : [];
    if (bookingRows.length === 0) {
      return {
        ...base(ctx, intent),
        error: "Could not find an active booking for that room/guest.",
      };
    }

    const text = slots.freeText || "Guest request";
    const lower = text.toLowerCase();
    let requestType = "other";
    let dept: string | null = null;
    if (/\b(maintenance|repair|ac|leak|wifi|electrical|plumbing)\b/.test(lower)) {
      requestType = "maintenance";
      dept = "Maintenance";
    } else if (/\b(clean|towel|housekeeping|linen|laundry)\b/.test(lower)) {
      requestType = "housekeeping";
      dept = "Housekeeping";
    } else if (/\b(food|room service|dining|menu|order)\b/.test(lower)) {
      requestType = "room_service";
      dept = "Food & Beverage";
    } else if (/\b(complaint|unhappy|bad|issue|problem)\b/.test(lower)) {
      requestType = "complaint";
    }
    const inserted = await sql.query(
      `INSERT INTO guest_requests (property_id, booking_id, guest_id, request_type, description, status, assigned_to_dept)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING id`,
      [propId, bookingRows[0].id, bookingRows[0].guest_id || null, requestType, text, dept]
    );
    return {
      ...base(ctx, intent),
      content: `Request logged for ${bookingRows[0].unit_label}\nType: ${requestType} · Status: pending\n${text}`,
      data: { requestId: inserted[0].id, requestType, unitLabel: bookingRows[0].unit_label },
    };
  },

  "maint.tickets.create": async (ctx, slots, sql) => {
    const intent = await requireIntent("maint.tickets.create");
    const propId = resolvePropertyId(ctx);
    if (!propId) {
      return {
        ...base(ctx, intent),
        error: "Please select a property first.",
      };
    }
    if (!slots.freeText) {
      return {
        ...base(ctx, intent),
        error: "Describe the issue, e.g. \"raise a ticket for AC not working in room 201\".",
      };
    }
    const params: unknown[] = [];
    let unitId: string | null = null;
    if (slots.roomNo) {
      const p = propClause(ctx, "bld.property_id", params);
      params.push(slots.roomNo);
      const unitRows = await sql.query(
        `SELECT u.id FROM units u
         JOIN floors f ON f.id = u.floor_id
         JOIN buildings bld ON bld.id = f.building_id
         WHERE ${p} AND u.unit_label = $${params.length}
         LIMIT 1`,
        params
      );
      unitId = unitRows.length ? unitRows[0].id : null;
    }
    const lower = slots.freeText.toLowerCase();
    const category = /\b(hvac|ac|heating)\b/.test(lower)
      ? "hvac"
      : /\b(plumbing|leak|water)\b/.test(lower)
        ? "plumbing"
        : /\b(electrical|wifi|internet|light)\b/.test(lower)
          ? "electrical"
          : "general";
    const priority = /\b(urgent|critical|emergency|leak|fire|no ac)\b/.test(lower) ? "high" : "medium";
    const ticketNumber = `MTK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const title = slots.freeText.length > 90 ? `${slots.freeText.slice(0, 90)}…` : slots.freeText;
    const inserted = await sql.query(
      `INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, category,
                                        title, description, priority, status, reported_by)
       VALUES ($1, $2, $3, 'repair', $4, $5, $6, $7, 'open', $8)
       RETURNING id`,
      [propId, unitId, ticketNumber, category, title, slots.freeText, priority, ctx.userId || null]
    );
    return {
      ...base(ctx, intent),
      content: `Ticket raised\n${ticketNumber} · ${priority} priority · ${category}\n${slots.freeText}`,
      data: { ticketId: inserted[0].id, ticketNumber, priority, category, unitId },
    };
  },

  "hk.tasks.status.update": async (ctx, slots, sql) => {
    const intent = await requireIntent("hk.tasks.status.update");
    const isManager = /manager|executive|super_admin|property_manager/.test(ctx.role);
    const params: unknown[] = [];
    const p = propClause(ctx, "ht.property_id", params);

    let taskId: string | undefined = slots.taskId;
    if (!taskId && slots.roomNo) {
      params.push(slots.roomNo);
      const found = await sql.query(
        `SELECT ht.id FROM housekeeping_tasks ht
         LEFT JOIN units u ON u.id = ht.unit_id
         WHERE ${p} AND u.unit_label = $${params.length}
         ORDER BY ht.created_at DESC LIMIT 1`,
        params
      );
      if (found.length) taskId = found[0].id;
    }
    if (!taskId) {
      return {
        ...base(ctx, intent),
        error: "Which task? Provide the task id from your task list, e.g. \"mark task 7c3f… as completed\".",
      };
    }

    const lower = slots.freeText ? slots.freeText.toLowerCase() : "";
    const wantsStart = /\b(start|begin|in progress)\b/.test(lower);
    const newStatus = wantsStart ? "in_progress" : "completed";

    const p2 = propClause(ctx, "ht.property_id", params);
    params.push(taskId);
    const taskRows = await sql.query(
      `SELECT id, status, assigned_to FROM housekeeping_tasks
       WHERE ${p2} AND id = $${params.length}`,
      params
    );
    if (taskRows.length === 0) {
      return {
        ...base(ctx, intent),
        error: "Task not found in this property.",
      };
    }
    const task = taskRows[0];
    if (!isManager && ctx.userId && task.assigned_to && task.assigned_to !== ctx.userId) {
      return {
        ...base(ctx, intent),
        denied: true,
        deniedReason: "This task is assigned to another staff member.",
      };
    }
    if (newStatus === "completed") {
      await sql.query(
        `UPDATE housekeeping_tasks SET status = 'completed', completed_at = now() WHERE id = $1`,
        [taskId]
      );
    } else {
      await sql.query(
        `UPDATE housekeeping_tasks SET status = 'in_progress', started_at = now() WHERE id = $1`,
        [taskId]
      );
    }
    return {
      ...base(ctx, intent),
      content: `Task ${shortId(taskId)} marked ${newStatus.replace("_", " ")}.`,
      data: { taskId, newStatus },
    };
  },
};

function guestNameOf(g: any): string {
  return [g.first_name, g.last_name].filter(Boolean).join(" ").trim() || g.phone;
}

let intentCache: Record<string, ChatIntent> | null = null;
async function requireIntent(id: string): Promise<ChatIntent> {
  if (!intentCache) {
    const mod = await import("./catalog");
    intentCache = {};
    for (const i of mod.ALL_INTENTS) intentCache[i.id] = i;
  }
  return intentCache[id];
}

export async function runHandler(
  ctx: ChatContext,
  intent: ChatIntent,
  slots: ExtractedSlots,
  sql: Sql
): Promise<ChatTurnResult> {
  const handler = handlers[intent.id];
  if (!handler) {
    return {
      ...base(ctx, intent),
      error: `The "${intent.name}" command is not implemented yet.`,
    };
  }
  try {
    return await handler(ctx, slots, sql);
  } catch (err: any) {
    console.error(`[copilot:handler:${intent.id}]`, err);
    return {
      ...base(ctx, intent),
      error: `Something went wrong while running "${intent.name}". ${err?.message || ""}`,
    };
  }
}
