export const PRIORITY_COLORS = {
  critical: { bg: "rgba(229,62,62,0.1)", text: "#E53E3E", dot: "#E53E3E", badge: "red" as const },
  high: { bg: "rgba(245,166,35,0.1)", text: "#F5A623", dot: "#F5A623", badge: "amber" as const },
  medium: { bg: "rgba(100,116,139,0.1)", text: "#64748B", dot: "#64748B", badge: "gray" as const },
  low: { bg: "rgba(42,157,143,0.1)", text: "#2BAE8E", dot: "#2BAE8E", badge: "teal" as const },
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; badge: "teal" | "amber" | "red" | "gray" | "navy" }> = {
  active: { bg: "rgba(42,157,143,0.1)", text: "#2BAE8E", dot: "#2BAE8E", badge: "teal" },
  inactive: { bg: "rgba(229,62,62,0.1)", text: "#E53E3E", dot: "#E53E3E", badge: "red" },
  pending: { bg: "rgba(245,166,35,0.1)", text: "#F5A623", dot: "#F5A623", badge: "amber" },
  open: { bg: "rgba(229,62,62,0.1)", text: "#E53E3E", dot: "#E53E3E", badge: "red" },
  in_progress: { bg: "rgba(245,166,35,0.1)", text: "#F5A623", dot: "#F5A623", badge: "amber" },
  resolved: { bg: "rgba(42,157,143,0.1)", text: "#2BAE8E", dot: "#2BAE8E", badge: "teal" },
  completed: { bg: "rgba(42,157,143,0.1)", text: "#2BAE8E", dot: "#2BAE8E", badge: "teal" },
  closed: { bg: "rgba(100,116,139,0.1)", text: "#64748B", dot: "#64748B", badge: "gray" },
  cancelled: { bg: "rgba(100,116,139,0.1)", text: "#64748B", dot: "#64748B", badge: "gray" },
  vacant: { bg: "rgba(42,157,143,0.1)", text: "#2BAE8E", dot: "#2BAE8E", badge: "teal" },
  occupied: { bg: "rgba(14,36,61,0.08)", text: "#1A3C5E", dot: "#1A3C5E", badge: "navy" },
  dirty: { bg: "rgba(245,166,35,0.15)", text: "#F5A623", dot: "#F5A623", badge: "amber" },
  cleaning: { bg: "rgba(42,157,143,0.15)", text: "#2BAE8E", dot: "#2BAE8E", badge: "teal" },
  maintenance: { bg: "rgba(229,62,62,0.1)", text: "#E53E3E", dot: "#E53E3E", badge: "red" },
  reserved: { bg: "rgba(100,116,139,0.12)", text: "#64748B", dot: "#64748B", badge: "gray" },
};

export const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-IN");
}

export function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return dateStr; }
}

export function formatTime(dateStr: string): string {
  try { return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }); }
  catch { return dateStr; }
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return dateStr; }
}

export function daysUntil(dateStr: string): number {
  try { return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000); }
  catch { return 0; }
}

export function daysOverdue(dateStr: string): number {
  try { return Math.ceil((Date.now() - new Date(dateStr).getTime()) / 86400000); }
  catch { return 0; }
}

export function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  if (firstName) return firstName.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "?";
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export const EXPORT_OPTIONS = ["CSV", "Excel", "PDF"] as const;
export type ExportFormat = typeof EXPORT_OPTIONS[number];

export function generateCSV<T extends Record<string, unknown>>(data: T[], columns: { key: string; header: string }[]): string {
  const header = columns.map((c) => `"${c.header}"`).join(",");
  const rows = data.map((row) => columns.map((c) => `"${String(row[c.key] ?? "")}"`).join(","));
  return [header, ...rows].join("\n");
}

export const NOTIFICATION_PREFERENCES = [
  { key: "booking_confirm", label: "Booking Confirmations" },
  { key: "check_in_reminder", label: "Check-in Reminders" },
  { key: "maintenance_alerts", label: "Maintenance Alerts" },
  { key: "payment_received", label: "Payment Received" },
  { key: "invoice_overdue", label: "Invoice Overdue" },
  { key: "compliance_expiry", label: "Compliance Expiry" },
  { key: "system_alerts", label: "System Alerts" },
  { key: "weekly_reports", label: "Weekly Reports" },
];

export const SYSTEM_SETTINGS = [
  { key: "currency", label: "Base Currency", value: "INR (₹)", type: "select" },
  { key: "timezone", label: "Timezone", value: "Asia/Kolkata (IST)", type: "select" },
  { key: "date_format", label: "Date Format", value: "DD MMM YYYY", type: "select" },
  { key: "week_start", label: "Week Starts On", value: "Monday", type: "select" },
  { key: "tax_rate", label: "Default Tax Rate", value: "18% (GST)", type: "text" },
  { key: "auto_backup", label: "Auto Backup", value: "Enabled (Daily)", type: "toggle" },
  { key: "audit_logging", label: "Audit Logging", value: "Enabled", type: "toggle" },
  { key: "maintenance_mode", label: "Maintenance Mode", value: "Disabled", type: "toggle" },
];
