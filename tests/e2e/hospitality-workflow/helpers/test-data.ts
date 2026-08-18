/**
 * Random test data + date helpers for the hospitality workflow.
 */

const FIRST_NAMES = ["Arjun", "Priya", "Rohan", "Meera", "Kabir", "Ananya", "Vikram", "Divya", "Ishaan", "Sneha", "Aditya", "Ritika", "Farhan", "Naina", "Dev"];
const LAST_NAMES = ["Sharma", "Patel", "Iyer", "Reddy", "Nair", "Mehta", "Khan", "Gupta", "Das", "Menon", "Chopra", "Bose", "Shetty", "Kapoor", "Rao"];
const ITEM_NAMES = ["Bathroom Amenities Kit", "Mini Bar Snacks", "Premium Bed Linen", "Water Bottles Pack", "Room Slippers", "Coffee Pods Box", "Shampoo Dispensers", "Turndown Chocolates"];
const TICKET_TITLES = [
  "AC not cooling in room",
  "Water leakage in bathroom",
  "TV remote not working",
  "Room door lock jamming",
  "Geyser not heating",
  "WiFi signal weak",
  "Toilet flush broken",
  "Window curtain rod loose",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function daysFromNowISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** [start, end] ISO strings for the previous calendar month. */
export function previousMonthRange(): [string, string] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return [fmt(start), fmt(end)];
}

export function randomFirstName(): string {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
}

export function randomLastName(): string {
  return LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
}

export function randomGuestEmail(first: string, last: string): string {
  return `${first.toLowerCase()}.${last.toLowerCase()}.${stamp()}@e2e.test`;
}

export function randomPhone(): string {
  return `9${Math.floor(Math.random() * 8) + 1}${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
}

export function randomEmployeeName(): string {
  return `${randomFirstName()} ${randomLastName()}`;
}

export function randomEmployeeEmail(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".")}.${stamp()}@e2e.test`;
}

export function randomSalary(): number {
  return 30000 + Math.floor(Math.random() * 20) * 2500;
}

export function randomItemName(): string {
  return `${ITEM_NAMES[Math.floor(Math.random() * ITEM_NAMES.length)]} ${stamp()}`;
}

export function randomTicketTitle(): string {
  return `${TICKET_TITLES[Math.floor(Math.random() * TICKET_TITLES.length)]} (${stamp()})`;
}

/** Extract a numeric value from a currency/raw string. */
export function extractNumber(raw: string | number): number {
  if (typeof raw === "number") return raw;
  const m = String(raw).replace(/[,₹\s]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

/** ₹ currency formatter used for assertions. */
export function formatINR(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}
