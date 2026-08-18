/**
 * lib/chat/catalog.ts
 * Deterministic intent catalog + classifier for the MVP.
 *
 * Each intent declares the journeys and roles that may use it, plus the
 * keyword tokens the lightweight scorer matches against. The classifier does
 * NOT call an LLM — it scores keyword coverage and extracts entity slots so
 * the chat endpoint stays cheap, fast, and fully testable. An LLM layer can
 * be layered on later for free-text understanding without changing the guards.
 */

import type {
  ChatContext,
  ChatIntent,
  ChatVertical,
  ExtractedSlots,
  IntentMatch,
} from "./types";
import { UNRESTRICTED_ROLES } from "./types";

const ALL_VERTICALS: ChatVertical[] = ["all", "hotels", "apartments", "rental", "workplace"];

const FRONT_DESK = ["front_desk", "frontdesk", "receptionist", "executive", "super_admin", "property_manager"];
const HOUSEKEEPING = ["housekeeping", "housekeeping_manager", "hk_supervisor", "executive", "super_admin", "property_manager"];
const MAINTENANCE = ["maintenance", "maintenance_manager", "executive", "super_admin", "property_manager"];
const FINANCE = ["finance", "finance_manager", "accounts", "executive", "super_admin"];
const INVENTORY = ["inventory", "store_manager", "purchase", "executive", "super_admin", "property_manager"];

const MVP_INTENTS: ChatIntent[] = [
  {
    id: "util.capabilities",
    name: "Capabilities",
    module: "Copilot",
    description: "List what the AI Co-Pilot can do for the active role and journey.",
    action: "read",
    risk: "low",
    verticals: ALL_VERTICALS,
    roles: ["*"],
    keywords: ["help", "capabilities", "what can you do", "features", "commands", "menu"],
    examples: ["What can you do?", "Help me", "Show me available commands"],
  },
  {
    id: "ops.occupancy.status",
    name: "Occupancy Status",
    module: "Operations",
    description: "Current occupancy, vacant, dirty, and in-maintenance unit counts.",
    action: "read",
    risk: "low",
    verticals: ["all", "hotels", "apartments"],
    roles: ["front_desk", "frontdesk", "receptionist", "executive", "super_admin", "property_manager", "housekeeping", "hk_supervisor"],
    keywords: ["occupancy", "occupation", "vacant", "availability", "room status", "rooms available", "how many rooms"],
    examples: ["What is the current occupancy?", "How many vacant rooms?", "Room availability"],
  },
  {
    id: "ops.arrivals.today",
    name: "Today's Arrivals",
    module: "Operations",
    description: "Expected check-ins for today (confirmed/checked_in bookings).",
    action: "read",
    risk: "low",
    verticals: ["all", "hotels", "apartments"],
    roles: FRONT_DESK,
    keywords: ["arrival", "arrivals", "arriving", "arrive", "check in", "check-in", "checking in", "expected", "incoming", "due in", "today"],
    examples: ["Who is arriving today?", "Show today's check-ins", "Expected arrivals"],
  },
  {
    id: "ops.departures.today",
    name: "Today's Departures",
    module: "Operations",
    description: "Guests scheduled to check out today.",
    action: "read",
    risk: "low",
    verticals: ["all", "hotels", "apartments"],
    roles: FRONT_DESK,
    keywords: ["departure", "departures", "departing", "check out", "check-out", "checking out", "leaving", "due out", "out today", "today"],
    examples: ["Who is checking out today?", "List today's departures"],
  },
  {
    id: "ops.dirty.rooms",
    name: "Dirty Rooms",
    module: "Housekeeping",
    description: "Units currently dirty or being cleaned and pending housekeeping.",
    action: "read",
    risk: "low",
    verticals: ["all", "hotels", "apartments"],
    roles: FRONT_DESK.concat(HOUSEKEEPING),
    keywords: ["dirty", "to clean", "needs cleaning", "cleaning", "dirty rooms", "pending clean"],
    examples: ["Which rooms are dirty?", "Pending cleaning", "Rooms to clean"],
  },
  {
    id: "guest.lookup.summary",
    name: "Guest Lookup",
    module: "Guest",
    description: "Find a guest by phone number and show their profile summary.",
    action: "read",
    risk: "low",
    verticals: ["all", "hotels", "apartments"],
    roles: FRONT_DESK,
    keywords: ["guest", "guests", "customer", "find guest", "lookup", "profile", "guest profile"],
    examples: ["Find guest with phone 9876543210", "Lookup guest profile"],
  },
  {
    id: "frontdesk.folio.balance",
    name: "Folio Balance",
    module: "Finance",
    description: "Outstanding balance for a guest's active booking or by phone.",
    action: "read",
    risk: "low",
    verticals: ["all", "hotels", "apartments"],
    roles: FRONT_DESK.concat(FINANCE),
    keywords: ["balance", "folio", "outstanding", "due amount", "owes", "pay", "unpaid"],
    examples: ["What is the outstanding balance?", "Show folio balance"],
  },
  {
    id: "maint.tickets.list",
    name: "Maintenance Tickets",
    module: "Maintenance",
    description: "List open/high-priority maintenance tickets for the property.",
    action: "read",
    risk: "low",
    verticals: ALL_VERTICALS,
    roles: MAINTENANCE.concat(FRONT_DESK),
    keywords: ["ticket", "tickets", "maintenance", "repair", "repairs", "issues", "raised"],
    examples: ["Show open maintenance tickets", "List high priority repairs"],
  },
  {
    id: "hk.tasks.mine",
    name: "My Housekeeping Tasks",
    module: "Housekeeping",
    description: "Tasks assigned to the current user (or the whole property for managers).",
    action: "read",
    risk: "low",
    verticals: ALL_VERTICALS,
    roles: HOUSEKEEPING,
    keywords: ["my tasks", "my task", "assigned to me", "my cleaning", "cleaning tasks", "my assignments", "what should i clean"],
    examples: ["What are my cleaning tasks?", "Show my assigned tasks"],
  },
  {
    id: "inv.low.stock",
    name: "Low Stock Items",
    module: "Inventory",
    description: "Inventory items at or below their reorder level.",
    action: "read",
    risk: "low",
    verticals: ALL_VERTICALS,
    roles: INVENTORY,
    keywords: ["stock", "stocks", "inventory", "reorder", "low stock", "out of stock", "stock level"],
    examples: ["List low stock items", "What needs reordering?"],
  },
  {
    id: "frontdesk.reservation.create",
    name: "Create Reservation",
    module: "Front Desk",
    description: "Create a confirmed walk-in booking for a guest.",
    action: "write",
    risk: "medium",
    verticals: ["all", "hotels", "apartments"],
    roles: FRONT_DESK,
    keywords: ["book", "book a", "booking", "reservation", "reserve", "walk in", "walk-in"],
    examples: ["Book a deluxe room for 2 nights", "Create a reservation for guest 9876543210"],
  },
  {
    id: "frontdesk.request.create",
    name: "Guest Request",
    module: "Front Desk",
    description: "Log a guest request (amenity, maintenance, housekeeping) to their booking.",
    action: "write",
    risk: "medium",
    verticals: ["all", "hotels", "apartments"],
    roles: FRONT_DESK,
    keywords: ["request", "log a request", "log request", "guest requested", "complaint", "amenity", "request for"],
    examples: ["Log a request for extra towels", "Guest complained about AC"],
  },
  {
    id: "maint.tickets.create",
    name: "Create Maintenance Ticket",
    module: "Maintenance",
    description: "Raise a maintenance ticket against a unit or asset.",
    action: "write",
    risk: "medium",
    verticals: ALL_VERTICALS,
    roles: MAINTENANCE.concat(FRONT_DESK),
    keywords: ["raise a ticket", "raise ticket", "log ticket", "report issue", "new ticket", "create ticket", "file a ticket", "ticket for"],
    examples: ["Raise a ticket for AC not working in room 201"],
  },
  {
    id: "hk.tasks.status.update",
    name: "Update Housekeeping Task",
    module: "Housekeeping",
    description: "Mark a housekeeping task in progress or completed.",
    action: "write",
    risk: "medium",
    verticals: ALL_VERTICALS,
    roles: HOUSEKEEPING,
    keywords: ["complete", "completed", "mark done", "mark complete", "start task", "finish", "task done", "done"],
    examples: ["Mark task 7c3f... as completed"],
  },
];

export const ALL_INTENTS: ChatIntent[] = MVP_INTENTS;

/** Whether a role may use the intent (deterministic, mirrors lib/role-access.ts). */
export function roleAllowed(intent: ChatIntent, role: string): boolean {
  if (intent.roles.includes("*")) return true;
  if (UNRESTRICTED_ROLES.has(role)) return true;
  return intent.roles.includes(role);
}

/** Whether the intent is usable inside the active vertical journey. */
export function verticalAllowed(intent: ChatIntent, journey: ChatVertical): boolean {
  return intent.verticals.includes("all") || intent.verticals.includes(journey);
}

/** Intents available to the current role + journey, sorted by module. */
export function availableIntents(ctx: ChatContext): ChatIntent[] {
  return ALL_INTENTS.filter((i) => roleAllowed(i, ctx.role) && verticalAllowed(i, ctx.journey)).sort(
    (a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name)
  );
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "of", "in", "on", "at", "to",
  "me", "show", "list", "get", "give", "tell", "what", "which", "how",
  "are", "is", "do", "does", "please", "can",
]);

/** Normalize a phrase: lowercase, collapse non-alphanumerics to single spaces. */
function norm(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(normalized: string): Set<string> {
  const tokens = new Set<string>();
  for (const word of normalized.split(" ")) {
    if (word && !STOPWORDS.has(word)) tokens.add(word);
  }
  return tokens;
}

/** Count keyword matches between a query and an intent's keyword list. */
export function scoreIntent(normText: string, queryTokens: Set<string>, intent: ChatIntent): number {
  let hits = 0;
  for (const kw of intent.keywords) {
    const nkw = norm(kw);
    const tokens = nkw.split(" ").filter(Boolean);
    if (tokens.length === 1) {
      const t = tokens[0];
      if (queryTokens.has(t)) {
        hits += 1;
      } else if ([...queryTokens].some((q) => q.startsWith(t) || t.startsWith(q))) {
        hits += 1;
      }
    } else if (normText.includes(nkw)) {
      hits += 2;
    }
  }
  return hits;
}

/** Best-effort entity extraction — numbers, phones, refs, rooms, dates, currency. */
export function extractSlots(message: string): ExtractedSlots {
  const slots: ExtractedSlots = {};
  const raw = message.toLowerCase();

  const phone = raw.match(/(?<!\d)\d{10}(?!\d)/);
  if (phone) slots.phone = phone[0];

  const bookingRef = raw.match(/\bres-?\d{3,}\b/i);
  if (bookingRef) slots.bookingRef = bookingRef[0].toUpperCase();

  const room = raw.match(/\b(?:room|unit|flat|desk|apartment)\s+(\d{1,4}[a-z]?)\b/);
  if (room) slots.roomNo = room[1].toUpperCase();

  const money = raw.match(/(?:₹|inr|rs\.?|rupees)\s?(\d+(?:[.,]\d+)?)/i);
  if (money) slots.amount = parseFloat(money[1].replace(/,/g, ""));

  const date = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (date) slots.date = date[1];
  else if (raw.includes("tomorrow")) slots.date = "tomorrow";
  else if (raw.includes("today")) slots.date = "today";

  const nights = raw.match(/\b(\d+)\s*(?:night|day)s?\b/);
  if (nights) slots.nights = parseInt(nights[1], 10);

  const category = raw.match(/\b(deluxe|executive|suite|standard|premium|studio|presidential)\b/);
  if (category) slots.category = category[1];

  const taskId = raw.match(/\b(?:task|ticket|id)\s+([a-f0-9]{8}-[a-f0-9-]{27,36})\b/i);
  if (taskId) slots.taskId = taskId[1];

  const freeText = raw
    .replace(/\b(?:please|show|list|get|find|tell|give|what|which|are|is|the|a|an|and|for|with|to|me|my|can|now)\b/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (freeText && !slots.phone && !slots.bookingRef) slots.freeText = freeText;

  return slots;
}

/** Resolve the best intent for a message, or undefined if no intent matched. */
export function resolveIntent(message: string, ctx: ChatContext): IntentMatch | undefined {
  const normText = norm(message);
  const tokens = tokenize(normText);
  const slots = extractSlots(message);
  const candidates = availableIntents(ctx).filter((i) => i.id !== "util.capabilities");
  const utilCap = ALL_INTENTS.find((i) => i.id === "util.capabilities")!;

  let best: IntentMatch | undefined;
  let bestScore = 0;
  for (const intent of candidates) {
    const s = scoreIntent(normText, tokens, intent);
    if (s > bestScore) {
      bestScore = s;
      best = { intent, confidence: s, slots };
    }
  }

  // Capabilities is the fallback when nothing scored.
  if (!best || bestScore === 0) {
    return { intent: utilCap, confidence: 1, slots };
  }

  best.confidence = Math.min(1, bestScore / 3);
  return best;
}
