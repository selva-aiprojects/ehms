"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, CalendarCheck, Users, Clock, Calendar,
  Building2, Sparkles, Wrench, CreditCard, Briefcase,
  UserCog, Home, Hotel, ChevronLeft, Shield, Coffee, ClipboardList, Wallet, Star, BadgePercent,
  Settings, DollarSign, Layers, CheckCircle, Ticket, Package, FileText, Database,
  BookOpen, Receipt, Landmark, BarChart3, PiggyBank, ScrollText, Calculator, FolderOpen, Globe,
  ChevronDown, Palette,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, type UserProfile } from "@/lib/auth-context";
import { hasAccess } from "@/lib/role-access";
import { useGlobalSettings } from "@/components/providers/SettingsProvider";
import { useJourney, type VerticalJourney } from "@/components/providers/JourneyProvider";

const ALL_NAV_ITEMS = [
  { label: "Dashboard",    icon: LayoutDashboard, href: "/dashboard", roles: ["super_admin","executive","property_manager","front_desk","housekeeping_supervisor","housekeeping_staff","maintenance_staff","maintenance_supervisor","hr_manager","hr_executive","finance_manager","finance_executive","security_staff","vendor_user","workplace_facility_manager","platform_super_admin"] },
  { label: "Command Center",icon: CalendarCheck,  href: "/dashboard/front-desk", roles: ["super_admin","executive","property_manager","front_desk"] },
  { label: "Guest Profiles",icon: Users,          href: "/dashboard/front-desk/guests", roles: ["super_admin","executive","property_manager","front_desk"] },
  { label: "Check-Ins",     icon: ClipboardList,  href: "/dashboard/front-desk/check-ins", roles: ["super_admin","executive","property_manager","front_desk"] },
  { label: "Billing & Folio",icon: Wallet,        href: "/dashboard/front-desk/billing", roles: ["super_admin","executive","property_manager","front_desk"] },
  { label: "F&B / Pantry",  icon: Coffee,         href: "/dashboard/front-desk/f-and-b", roles: ["super_admin","executive","property_manager","front_desk"] },
  { label: "Requests",      icon: Wrench,         href: "/dashboard/front-desk/requests", roles: ["super_admin","executive","property_manager","front_desk"] },
  { label: "Feedbacks",     icon: Star,           href: "/dashboard/front-desk/feedbacks", roles: ["super_admin","executive","property_manager","front_desk"] },
  { label: "Hotels",       icon: Hotel,           href: "/dashboard/hotels", roles: ["super_admin","executive","property_manager"] },
  { label: "Apartments",   icon: Building2,       href: "/dashboard/apartments", roles: ["super_admin","executive","property_manager"] },
  { label: "Rental",       icon: Home,            href: "/dashboard/rental", roles: ["super_admin","executive","property_manager"] },
  { label: "Workplace",    icon: Briefcase,       href: "/dashboard/workplace", roles: ["super_admin","executive","property_manager","workplace_facility_manager","security_staff"] },
  { label: "Housekeeping", icon: Sparkles,        href: "/dashboard/housekeeping", roles: ["super_admin","executive","property_manager","housekeeping_supervisor","housekeeping_staff"] },
  { label: "HK Tasks",     icon: ClipboardList,   href: "/dashboard/housekeeping/tasks", roles: ["super_admin","executive","property_manager","housekeeping_supervisor","housekeeping_staff"] },
  { label: "Linen",        icon: Layers,          href: "/dashboard/housekeeping/linen", roles: ["super_admin","executive","property_manager","housekeeping_supervisor"] },
  { label: "Inspections",  icon: CheckCircle,     href: "/dashboard/housekeeping/inspections", roles: ["super_admin","executive","property_manager","housekeeping_supervisor"] },
  { label: "HK Staff",     icon: Users,           href: "/dashboard/housekeeping/staff", roles: ["super_admin","executive","property_manager","housekeeping_supervisor"] },
  { label: "Maintenance",  icon: Wrench,          href: "/dashboard/maintenance", roles: ["super_admin","executive","property_manager","maintenance_staff","maintenance_supervisor"] },
  { label: "Tickets",      icon: Ticket,          href: "/dashboard/maintenance/tickets", roles: ["super_admin","executive","property_manager","maintenance_staff","maintenance_supervisor"] },
  { label: "Parts",        icon: Package,         href: "/dashboard/maintenance/parts", roles: ["super_admin","executive","property_manager","maintenance_supervisor"] },
  { label: "Assets",       icon: Building2,       href: "/dashboard/maintenance/assets", roles: ["super_admin","executive","property_manager","maintenance_supervisor"] },
  { label: "Finance",      icon: CreditCard,      href: "/dashboard/finance", roles: ["super_admin","executive","property_manager","finance_manager","finance_executive"] },
  { label: "Chart of Accts",icon: BookOpen,        href: "/dashboard/finance/accounts", roles: ["super_admin","executive","property_manager","finance_manager"] },
  { label: "Journal",       icon: FileText,        href: "/dashboard/finance/journal", roles: ["super_admin","executive","property_manager","finance_manager"] },
  { label: "Ledger",        icon: Calculator,      href: "/dashboard/finance/ledger", roles: ["super_admin","executive","property_manager","finance_manager","finance_executive"] },
  { label: "Receivables",   icon: Receipt,         href: "/dashboard/finance/receivables", roles: ["super_admin","executive","property_manager","finance_manager","finance_executive"] },
  { label: "Payables",      icon: Landmark,        href: "/dashboard/finance/payables", roles: ["super_admin","executive","property_manager","finance_manager"] },
  { label: "Budget",        icon: PiggyBank,       href: "/dashboard/finance/budget", roles: ["super_admin","executive","property_manager","finance_manager"] },
  { label: "Tax",           icon: ScrollText,      href: "/dashboard/finance/tax", roles: ["super_admin","executive","property_manager","finance_manager","finance_executive"] },
  { label: "Fixed Assets",  icon: Building2,       href: "/dashboard/finance/assets", roles: ["super_admin","executive","property_manager","finance_manager"] },
  { label: "Reports",       icon: BarChart3,       href: "/dashboard/finance/reports", roles: ["super_admin","executive","property_manager","finance_manager","finance_executive"] },
  { label: "Fin Settings",  icon: Settings,        href: "/dashboard/finance/settings", roles: ["super_admin","executive","property_manager","finance_manager"] },
  { label: "HRMS",         icon: Users,           href: "/dashboard/hr", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive","employee_manager"] },
  { label: "Employees",    icon: Users,           href: "/dashboard/hr/employees", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive"] },
  { label: "Timesheets",   icon: Clock,           href: "/dashboard/hr/timesheet", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive","employee_manager"] },
  { label: "Leave",        icon: Calendar,         href: "/dashboard/hr/leave", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive","employee_manager"] },
  { label: "Payroll",      icon: CreditCard,      href: "/dashboard/hr/payroll", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive"] },
  { label: "Compliance",   icon: BadgePercent,    href: "/dashboard/hr/compliance", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive"] },
  { label: "Masters",      icon: Settings,         href: "/dashboard/hr/masters", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive"] },
  { label: "Policies",     icon: ClipboardList,    href: "/dashboard/hr/policies", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive"] },
  { label: "Appraisal",    icon: Star,             href: "/dashboard/hr/appraisal", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive"] },
  { label: "Compensation", icon: DollarSign,       href: "/dashboard/hr/compensation", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive"] },
  { label: "Admin",          icon: UserCog,         href: "/dashboard/admin", roles: ["super_admin","executive","property_manager"] },
  { label: "Tenants",       icon: Globe,           href: "/dashboard/admin/tenants", roles: ["super_admin","executive","platform_super_admin"] },
  { label: "Workspaces",    icon: Building2,       href: "/dashboard/admin/properties", roles: ["super_admin","executive","property_manager"] },
  { label: "Roles",         icon: Shield,          href: "/dashboard/admin/roles", roles: ["super_admin","executive"] },
  { label: "Audit Trail",   icon: FileText,        href: "/dashboard/admin/audit", roles: ["super_admin","executive"] },
  { label: "Backup",        icon: Database,        href: "/dashboard/admin/backup", roles: ["super_admin","executive"] },
  { label: "Users",         icon: Users,           href: "/dashboard/admin/users", roles: ["super_admin","executive","property_manager","housekeeping_supervisor","maintenance_supervisor"] },
  { label: "Procurement",      icon: ClipboardList, href: "/dashboard/procurement", roles: ["super_admin","executive","property_manager","maintenance_supervisor","finance_manager"] },
  { label: "Vendors",          icon: Briefcase,   href: "/dashboard/vendors", roles: ["super_admin","executive","property_manager","maintenance_supervisor","maintenance_staff","finance_manager"] },
  { label: "Purchase Orders",  icon: FileText,    href: "/dashboard/procurement/purchase-orders", roles: ["super_admin","executive","property_manager","maintenance_supervisor","finance_manager"] },
  { label: "Goods Receipt",    icon: ClipboardList, href: "/dashboard/procurement/grn", roles: ["super_admin","executive","property_manager","maintenance_supervisor","finance_manager"] },
  { label: "Inventory",        icon: Package,     href: "/dashboard/inventory", roles: ["super_admin","executive","property_manager","maintenance_supervisor","housekeeping_supervisor","finance_manager"] },
  { label: "Inv Items",        icon: Package,     href: "/dashboard/inventory/items", roles: ["super_admin","executive","property_manager","maintenance_supervisor"] },
  { label: "Inv Transactions", icon: FileText,    href: "/dashboard/inventory/transactions", roles: ["super_admin","executive","property_manager","maintenance_supervisor","finance_manager"] },
  { label: "Warehouses",       icon: Building2,   href: "/dashboard/inventory/warehouses", roles: ["super_admin","executive","property_manager","maintenance_supervisor"] },
  { label: "Inv Categories",   icon: Layers,      href: "/dashboard/inventory/categories", roles: ["super_admin","executive","property_manager","maintenance_supervisor"] },
  { label: "Vendor Orders",    icon: FileText,    href: "/dashboard/vendors/orders", roles: ["super_admin","executive","property_manager","maintenance_supervisor","finance_manager"] },
  { label: "Vendor Services",  icon: Wrench,      href: "/dashboard/vendors/services", roles: ["super_admin","executive","property_manager","maintenance_supervisor","finance_manager"] },
  { label: "Shifts",           icon: Clock,         href: "/dashboard/hr/shifts", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive","employee_manager"] },
  { label: "HR Settings",      icon: Settings,      href: "/dashboard/hr/settings", roles: ["super_admin","executive","property_manager","hr_manager","hr_executive"] },
  { label: "Settings",         icon: Settings,      href: "/dashboard/admin/settings", roles: ["super_admin","executive","property_manager"] },
  { label: "Branding",         icon: Palette,       href: "/dashboard/settings/branding", roles: ["super_admin","executive","property_manager"] },
  { label: "Master Data",      icon: Database,      href: "/dashboard/admin/masters", roles: ["super_admin","executive","property_manager"] },
  { label: "Sessions",         icon: Clock,         href: "/dashboard/admin/sessions", roles: ["super_admin","executive"] },
  { label: "Compliance",       icon: Shield,        href: "/dashboard/admin/compliance", roles: ["super_admin","executive"] },
  { label: "Support Tickets",  icon: Ticket,         href: "/dashboard/admin/tickets", roles: ["super_admin","executive","platform_super_admin"] },
  { label: "Broadcasts",       icon: Sparkles,       href: "/dashboard/admin/broadcasts", roles: ["super_admin","executive","platform_super_admin"] },
  { label: "My Tickets",       icon: Ticket,         href: "/dashboard/tickets", roles: ["super_admin","executive","property_manager","front_desk","housekeeping_supervisor","housekeeping_staff","maintenance_staff","maintenance_supervisor","hr_manager","hr_executive","finance_manager","finance_executive","security_staff","vendor_user","workplace_facility_manager"] },
  { label: "Leases",           icon: FileText,      href: "/dashboard/rental/leases", roles: ["super_admin","executive","property_manager"] },
  { label: "Rent Invoices",    icon: Receipt,       href: "/dashboard/rental/invoices", roles: ["super_admin","executive","property_manager","finance_manager"] },
  { label: "Deposits",         icon: DollarSign,    href: "/dashboard/rental/deposits", roles: ["super_admin","executive","property_manager","finance_manager"] },
  { label: "Memberships",      icon: Briefcase,     href: "/dashboard/workplace/memberships", roles: ["super_admin","executive","property_manager","workplace_facility_manager"] },
  { label: "Visitors",         icon: Users,         href: "/dashboard/workplace/visitors", roles: ["super_admin","executive","property_manager","workplace_facility_manager","security_staff"] },
  { label: "Reconciliation",   icon: DollarSign,    href: "/dashboard/finance/reconciliation", roles: ["super_admin","executive","property_manager","finance_manager","finance_executive"] },
];

const NAV_GROUPS = [
  { label: "Front Desk & Guests",   icon: CalendarCheck, items: ["Dashboard","Command Center","Guest Profiles","Check-Ins","Billing & Folio","F&B / Pantry","Requests","Feedbacks"] },
  { label: "Properties & Verticals", icon: Building2,    items: ["Hotels","Apartments","Rental","Leases","Rent Invoices","Deposits","Workplace","Memberships","Visitors"] },
  { label: "Housekeeping",           icon: Sparkles,     items: ["Housekeeping","HK Tasks","Linen","Inspections","HK Staff"] },
  { label: "Maintenance",            icon: Wrench,       items: ["Maintenance","Tickets","Parts","Assets"] },
  { label: "Finance & Accounts",     icon: CreditCard,   items: ["Finance","Chart of Accts","Journal","Ledger","Receivables","Payables","Budget","Tax","Fixed Assets","Reports","Fin Settings","Reconciliation"] },
  { label: "Human Resources",        icon: Users,        items: ["HRMS","Employees","Timesheets","Leave","Payroll","Compliance","Masters","Policies","Appraisal","Compensation","Shifts","HR Settings"] },
  { label: "Administration",         icon: Shield,       items: ["Admin","Tenants","Workspaces","Roles","Audit Trail","Backup","Users","Settings","Branding","Master Data","Sessions","Compliance","Support Tickets","Broadcasts","My Tickets"] },
  { label: "Procurement",           icon: ClipboardList, items: ["Procurement","Vendors","Vendor Orders","Vendor Services","Purchase Orders","Goods Receipt"] },
  { label: "Inventory",             icon: Package,       items: ["Inventory","Inv Items","Inv Transactions","Warehouses","Inv Categories"] },
];

const JOURNEY_ALLOWED_ITEMS: Record<VerticalJourney, string[]> = {
  all: [
    "Dashboard", "Command Center", "Guest Profiles", "Check-Ins", "Billing & Folio",
    "F&B / Pantry", "Requests", "Feedbacks", "Hotels", "Apartments", "Rental",
    "Leases", "Rent Invoices", "Deposits",
    "Workplace", "Housekeeping", "HK Tasks", "Linen", "Inspections", "HK Staff",
    "Maintenance", "Tickets", "Parts", "Assets", "Finance",
    "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget",
    "Tax", "Fixed Assets", "Reports", "Fin Settings",
    "HRMS",
    "Employees", "Timesheets", "Leave", "Payroll", "Compliance",
    "Masters", "Policies", "Appraisal", "Compensation", "Shifts", "HR Settings", "Admin",
    "Workspaces", "Roles", "Audit Trail", "Backup",
    "Users", "Tenants", "Settings", "Branding", "Master Data", "Sessions", "Compliance",
    "Procurement", "Vendors", "Vendor Orders", "Vendor Services", "Purchase Orders", "Goods Receipt",
    "Inventory", "Inv Items", "Inv Transactions", "Warehouses", "Inv Categories",
    "Memberships", "Visitors", "Reconciliation",
    "Support Tickets", "Broadcasts", "My Tickets"
  ],
  hotels: [
    "Dashboard", "Command Center", "Guest Profiles", "Check-Ins", "Billing & Folio",
    "F&B / Pantry", "Requests", "Feedbacks", "Hotels",
    "Housekeeping", "HK Tasks", "Linen", "Inspections", "HK Staff",
    "Maintenance", "Tickets", "Parts", "Assets",
    "Finance", "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget",
    "Tax", "Fixed Assets", "Reports", "Fin Settings", "Reconciliation",
    "HRMS", "Employees", "Timesheets", "Leave", "Payroll", "Compliance",
    "Masters", "Policies", "Appraisal", "Compensation", "Shifts", "HR Settings",
    "Admin", "Workspaces", "Roles", "Audit Trail", "Backup",
    "Users", "Tenants", "Settings", "Branding", "Master Data", "Sessions", "Compliance",
    "Procurement", "Vendors", "Vendor Orders", "Vendor Services", "Purchase Orders", "Goods Receipt",
    "Inventory", "Inv Items", "Inv Transactions", "Warehouses", "Inv Categories",
    "Support Tickets", "Broadcasts", "My Tickets"
  ],
  apartments: [
    "Dashboard", "Command Center", "Guest Profiles", "Check-Ins", "Billing & Folio",
    "F&B / Pantry", "Requests", "Feedbacks", "Apartments",
    "Housekeeping", "HK Tasks", "Linen", "Inspections", "HK Staff",
    "Maintenance", "Tickets", "Parts", "Assets",
    "Finance", "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget",
    "Tax", "Fixed Assets", "Reports", "Fin Settings", "Reconciliation",
    "HRMS", "Employees", "Timesheets", "Leave", "Payroll", "Compliance",
    "Masters", "Policies", "Appraisal", "Compensation", "Shifts", "HR Settings",
    "Admin", "Workspaces", "Roles", "Audit Trail", "Backup",
    "Users", "Tenants", "Settings", "Branding", "Master Data",
    "Procurement", "Vendors", "Vendor Orders", "Vendor Services", "Purchase Orders", "Goods Receipt",
    "Inventory", "Inv Items", "Inv Transactions", "Warehouses", "Inv Categories",
    "Support Tickets", "Broadcasts", "My Tickets"
  ],
  rental: [
    "Dashboard", "Rental", "Leases", "Rent Invoices", "Deposits",
    "Housekeeping", "HK Tasks", "Linen", "Inspections", "HK Staff",
    "Maintenance", "Tickets", "Parts", "Assets",
    "Finance", "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget",
    "Tax", "Fixed Assets", "Reports", "Fin Settings", "Reconciliation",
    "HRMS", "Employees", "Timesheets", "Leave", "Payroll", "Compliance",
    "Masters", "Policies", "Appraisal", "Compensation", "Shifts", "HR Settings",
    "Admin", "Workspaces", "Roles", "Audit Trail", "Backup",
    "Users", "Settings", "Branding", "Master Data",
    "Procurement", "Vendors", "Purchase Orders", "Goods Receipt",
    "Inventory", "Inv Items", "Inv Transactions",
    "Support Tickets", "Broadcasts", "My Tickets"
  ],
  workplace: [
    "Dashboard", "Workplace",
    "Housekeeping", "HK Tasks", "Linen", "Inspections", "HK Staff",
    "Maintenance", "Tickets", "Parts", "Assets",
    "Finance", "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget",
    "Tax", "Fixed Assets", "Reports", "Fin Settings", "Reconciliation",
    "HRMS", "Employees", "Timesheets", "Leave", "Payroll", "Compliance",
    "Masters", "Policies", "Appraisal", "Compensation", "Shifts", "HR Settings",
    "Admin", "Workspaces", "Roles", "Audit Trail", "Backup",
    "Users", "Tenants", "Settings", "Branding", "Master Data", "Sessions", "Compliance",
    "Procurement", "Vendors", "Vendor Orders", "Vendor Services", "Purchase Orders", "Goods Receipt",
    "Inventory", "Inv Items", "Inv Transactions", "Warehouses", "Inv Categories",
    "Memberships", "Visitors",
    "Support Tickets", "Broadcasts", "My Tickets"
  ]
};

const navItemMap = new Map(ALL_NAV_ITEMS.map((item) => [item.label, item]));

function getLocalDemoUser(): UserProfile | null {
  try { const r = localStorage.getItem("ehms_demo_session"); return r ? JSON.parse(r) : null; } catch { return null; }
}

export default function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(NAV_GROUPS.map((g) => g.label)));
  const { user: authUser } = useAuth();
  const [fallbackUser, setFallbackUser] = useState<UserProfile | null>(null);
  const { settings } = useGlobalSettings();
  const { activeJourney } = useJourney();

  useEffect(() => {
    const demo = getLocalDemoUser();
    if (demo) setFallbackUser(demo);
  }, []);

  const user = authUser || fallbackUser;
  const role = user?.role_name || "unknown";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const visibleItemSet = new Set(ALL_NAV_ITEMS.map((item) => {
    if (item.label === "Dashboard") {
      const targetHref = activeJourney === "all" ? "/dashboard" : `/dashboard/${activeJourney}`;
      if (hasAccess(role, targetHref)) return { ...item, href: targetHref };
    }
    return item;
  }).filter((item) => {
    if (!item.roles.includes(role) || !hasAccess(role, item.href)) return false;
    if (role === "platform_super_admin") return true;
    const allowedForJourney = JOURNEY_ALLOWED_ITEMS[activeJourney] || JOURNEY_ALLOWED_ITEMS.all;
    if (!allowedForJourney.includes(item.label)) return false;
    return true;
  }).map((item) => item.label));

  function itemIsVisible(label: string): boolean {
    return visibleItemSet.has(label);
  }

  function renderItem(label: string) {
    const def = navItemMap.get(label);
    if (!def) return null;
    const href = label === "Dashboard"
      ? (activeJourney === "all" ? "/dashboard" : `/dashboard/${activeJourney}`)
      : def.href;
    const active = isActive(href);
    return (
      <Link
        key={href + label}
        href={href}
        onClick={onMobileClose}
        className="flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative"
        style={{
          background: active ? "rgba(255,255,255,0.10)" : "transparent",
          color: active ? "#FFFFFF" : "rgba(255,255,255,0.60)",
          borderLeft: active ? "3px solid var(--tenant-sidebar-active, #2BAE8E)" : "3px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = "transparent";
        }}
      >
        <def.icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  const sidebarContent = (
    <>
      <div
        className="flex flex-col items-center justify-center py-6 px-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        {settings.logo_url && (
          <Image
            src={settings.logo_url}
            alt={settings.company_name || "eHMS"}
            width={collapsed ? 36 : 120}
            height={collapsed ? 36 : 80}
            className="object-contain transition-all duration-300"
            style={{ filter: "brightness(1.05)" }}
            priority
          />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {collapsed ? (
          ALL_NAV_ITEMS.filter((item) => itemIsVisible(item.label)).map((item) => {
            const href = item.label === "Dashboard"
              ? (activeJourney === "all" ? "/dashboard" : `/dashboard/${activeJourney}`)
              : item.href;
            const active = isActive(href);
            return (
              <Link
                key={href + item.label}
                href={href}
                onClick={onMobileClose}
                className="flex items-center justify-center mx-1 p-2 rounded-lg text-sm font-medium transition-all relative"
                style={{
                  background: active ? "rgba(255,255,255,0.10)" : "transparent",
                  color: active ? "#FFFFFF" : "rgba(255,255,255,0.60)",
                }}
                title={item.label}
              >
                <item.icon className="w-4 h-4 shrink-0" />
              </Link>
            );
          })
        ) : (
          NAV_GROUPS.map((group) => {
            const visible = group.items.filter(itemIsVisible);
            if (visible.length === 0) return null;
            const open = expandedGroups.has(group.label);
            return (
              <div key={group.label} className="space-y-0.5">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center gap-2 w-full mx-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  <group.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{group.label}</span>
                  <ChevronDown
                    className={`w-3 h-3 ml-auto shrink-0 transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
                  />
                </button>
                {open && visible.map((label) => renderItem(label))}
              </div>
            );
          })
        )}
      </nav>

      {user && !collapsed && (
        <div className="p-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Shield className="w-3 h-3" style={{ color: "var(--color-primary, #2BAE8E)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {user.email}
            </span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={onMobileClose}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 flex flex-col transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--color-sidebar, #2C3547)",
          width: 280,
          height: "100dvh",
        }}
      >
        <div className="flex items-center justify-end p-3">
          <button onClick={onMobileClose} className="p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="relative flex-col transition-all duration-300 select-none hidden md:flex"
        style={{
          background: "var(--color-sidebar, #2C3547)",
          width: collapsed ? 64 : 240,
          minWidth: collapsed ? 64 : 240,
        }}
      >
        {sidebarContent}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110"
          style={{
            background: "var(--color-primary, #2BAE8E)",
            border: "2px solid var(--color-light, #F5F7FA)",
            color: "#fff",
          }}
        >
          <ChevronLeft className={`w-3 h-3 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>
    </>
  );
}
