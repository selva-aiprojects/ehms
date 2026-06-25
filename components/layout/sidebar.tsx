"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, CalendarCheck, Users, Clock, Calendar,
  Building2, Sparkles, Wrench, CreditCard, Briefcase,
  UserCog, Home, Hotel, ChevronLeft, Shield, Coffee, ClipboardList, Wallet, Star, BadgePercent,
  Settings, DollarSign, Layers, CheckCircle, Ticket, Package, FileText, Database,
  BookOpen, Receipt, Landmark, BarChart3, PiggyBank, ScrollText, Calculator, FolderOpen, Globe
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, type UserProfile } from "@/lib/auth-context";
import { hasAccess } from "@/lib/role-access";
import { useGlobalSettings } from "@/components/providers/SettingsProvider";
import { useJourney, type VerticalJourney } from "@/components/providers/JourneyProvider";

const ALL_NAV_ITEMS = [
  { label: "Dashboard",    icon: LayoutDashboard, href: "/dashboard", roles: ["super_admin","executive","property_manager","front_desk","housekeeping_supervisor","housekeeping_staff","maintenance_staff","maintenance_supervisor","hr_manager","hr_executive","finance_manager","finance_executive","security_staff","vendor_user","workplace_facility_manager","platform_super_admin"] },
  { label: "Command Center",icon: CalendarCheck,  href: "/dashboard/front-desk", roles: ["super_admin","executive","front_desk"] },
  { label: "Guest Profiles",icon: Users,          href: "/dashboard/front-desk/guests", roles: ["super_admin","executive","front_desk"] },
  { label: "Check-Ins",     icon: ClipboardList,  href: "/dashboard/front-desk/check-ins", roles: ["super_admin","executive","front_desk"] },
  { label: "Billing & Folio",icon: Wallet,        href: "/dashboard/front-desk/billing", roles: ["super_admin","executive","front_desk"] },
  { label: "F&B / Pantry",  icon: Coffee,         href: "/dashboard/front-desk/f-and-b", roles: ["super_admin","executive","front_desk"] },
  { label: "Requests",      icon: Wrench,         href: "/dashboard/front-desk/requests", roles: ["super_admin","executive","front_desk"] },
  { label: "Feedbacks",     icon: Star,           href: "/dashboard/front-desk/feedbacks", roles: ["super_admin","executive","front_desk"] },
  { label: "Hotels",       icon: Hotel,           href: "/dashboard/hotels", roles: ["super_admin","executive","property_manager"] },
  { label: "Apartments",   icon: Building2,       href: "/dashboard/apartments", roles: ["super_admin","executive","property_manager"] },
  { label: "Rental",       icon: Home,            href: "/dashboard/rental", roles: ["super_admin","executive","property_manager"] },
  { label: "Workplace",    icon: Briefcase,       href: "/dashboard/workplace", roles: ["super_admin","executive","property_manager","workplace_facility_manager","security_staff"] },
  { label: "Housekeeping", icon: Sparkles,        href: "/dashboard/housekeeping", roles: ["super_admin","executive","housekeeping_supervisor","housekeeping_staff"] },
  { label: "HK Tasks",     icon: ClipboardList,   href: "/dashboard/housekeeping/tasks", roles: ["super_admin","executive","housekeeping_supervisor","housekeeping_staff"] },
  { label: "Linen",        icon: Layers,          href: "/dashboard/housekeeping/linen", roles: ["super_admin","executive","housekeeping_supervisor"] },
  { label: "Inspections",  icon: CheckCircle,     href: "/dashboard/housekeeping/inspections", roles: ["super_admin","executive","housekeeping_supervisor"] },
  { label: "HK Staff",     icon: Users,           href: "/dashboard/housekeeping/staff", roles: ["super_admin","executive","housekeeping_supervisor"] },
  { label: "Maintenance",  icon: Wrench,          href: "/dashboard/maintenance", roles: ["super_admin","executive","maintenance_staff","maintenance_supervisor"] },
  { label: "Tickets",      icon: Ticket,          href: "/dashboard/maintenance/tickets", roles: ["super_admin","executive","maintenance_staff","maintenance_supervisor"] },
  { label: "Parts",        icon: Package,         href: "/dashboard/maintenance/parts", roles: ["super_admin","executive","maintenance_supervisor"] },
  { label: "Assets",       icon: Building2,       href: "/dashboard/maintenance/assets", roles: ["super_admin","executive","maintenance_supervisor"] },
  { label: "Finance",      icon: CreditCard,      href: "/dashboard/finance", roles: ["super_admin","executive","finance_manager","finance_executive"] },
  { label: "Chart of Accts",icon: BookOpen,        href: "/dashboard/finance/accounts", roles: ["super_admin","executive","finance_manager"] },
  { label: "Journal",       icon: FileText,        href: "/dashboard/finance/journal", roles: ["super_admin","executive","finance_manager"] },
  { label: "Ledger",        icon: Calculator,      href: "/dashboard/finance/ledger", roles: ["super_admin","executive","finance_manager","finance_executive"] },
  { label: "Receivables",   icon: Receipt,         href: "/dashboard/finance/receivables", roles: ["super_admin","executive","finance_manager","finance_executive"] },
  { label: "Payables",      icon: Landmark,        href: "/dashboard/finance/payables", roles: ["super_admin","executive","finance_manager"] },
  { label: "Budget",        icon: PiggyBank,       href: "/dashboard/finance/budget", roles: ["super_admin","executive","finance_manager"] },
  { label: "Tax",           icon: ScrollText,      href: "/dashboard/finance/tax", roles: ["super_admin","executive","finance_manager","finance_executive"] },
  { label: "Fixed Assets",  icon: Building2,       href: "/dashboard/finance/assets", roles: ["super_admin","executive","finance_manager"] },
  { label: "Reports",       icon: BarChart3,       href: "/dashboard/finance/reports", roles: ["super_admin","executive","finance_manager","finance_executive"] },
  { label: "Fin Settings",  icon: Settings,        href: "/dashboard/finance/settings", roles: ["super_admin","executive","finance_manager"] },
  { label: "HRMS",         icon: Users,           href: "/dashboard/hr", roles: ["super_admin","executive","hr_manager","hr_executive","employee_manager"] },
  { label: "Employees",    icon: Users,           href: "/dashboard/hr/employees", roles: ["super_admin","executive","hr_manager","hr_executive"] },
  { label: "Timesheets",   icon: Clock,           href: "/dashboard/hr/timesheet", roles: ["super_admin","executive","hr_manager","hr_executive","employee_manager"] },
  { label: "Leave",        icon: Calendar,         href: "/dashboard/hr/leave", roles: ["super_admin","executive","hr_manager","hr_executive","employee_manager"] },
  { label: "Payroll",      icon: CreditCard,      href: "/dashboard/hr/payroll", roles: ["super_admin","executive","hr_manager","hr_executive"] },
  { label: "Compliance",   icon: BadgePercent,    href: "/dashboard/hr/compliance", roles: ["super_admin","executive","hr_manager","hr_executive"] },
  { label: "Masters",      icon: Settings,         href: "/dashboard/hr/masters", roles: ["super_admin","executive","hr_manager","hr_executive"] },
  { label: "Policies",     icon: ClipboardList,    href: "/dashboard/hr/policies", roles: ["super_admin","executive","hr_manager","hr_executive"] },
  { label: "Appraisal",    icon: Star,             href: "/dashboard/hr/appraisal", roles: ["super_admin","executive","hr_manager","hr_executive"] },
  { label: "Compensation", icon: DollarSign,       href: "/dashboard/hr/compensation", roles: ["super_admin","executive","hr_manager","hr_executive"] },
  { label: "Admin",          icon: UserCog,         href: "/dashboard/admin", roles: ["super_admin","executive","property_manager"] },
  { label: "Tenants",       icon: Globe,           href: "/dashboard/admin/tenants", roles: ["super_admin","executive","platform_super_admin"] },
  { label: "Workspaces",    icon: Building2,       href: "/dashboard/admin/properties", roles: ["super_admin","executive","property_manager"] },
  { label: "Roles",         icon: Shield,          href: "/dashboard/admin/roles", roles: ["super_admin","executive"] },
  { label: "Audit Trail",   icon: FileText,        href: "/dashboard/admin/audit", roles: ["super_admin","executive"] },
  { label: "Backup",        icon: Database,        href: "/dashboard/admin/backup", roles: ["super_admin","executive"] },
  { label: "Users",         icon: Users,           href: "/dashboard/admin/users", roles: ["super_admin","executive"] },
  { label: "Vendors",       icon: Briefcase,       href: "/dashboard/vendors", roles: ["super_admin","executive","property_manager","maintenance_supervisor","maintenance_staff","finance_manager"] },
  { label: "Inventory",     icon: Package,         href: "/dashboard/inventory", roles: ["super_admin","executive","property_manager","maintenance_supervisor","housekeeping_supervisor","finance_manager"] },
  { label: "Inv Items",     icon: Package,         href: "/dashboard/inventory/items", roles: ["super_admin","executive","property_manager","maintenance_supervisor"] },
  { label: "Inv Transactions", icon: FileText,     href: "/dashboard/inventory/transactions", roles: ["super_admin","executive","property_manager","maintenance_supervisor","finance_manager"] },
];

const PRIMARY_LABELS = ["Dashboard", "Command Center", "Guest Profiles", "Check-Ins", "Billing & Folio", "F&B / Pantry", "Requests", "Feedbacks", "Hotels", "Apartments", "Rental", "Workplace", "Housekeeping", "HK Tasks", "Linen", "Inspections", "HK Staff", "Maintenance", "Tickets", "Parts", "Assets", "Finance", "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget", "Tax", "Fixed Assets", "Reports", "Fin Settings", "HRMS", "Employees", "Timesheets", "Leave", "Payroll", "Compliance", "Masters", "Policies", "Appraisal", "Compensation", "Admin", "Tenants", "Workspaces", "Roles", "Audit Trail", "Backup", "Users", "Vendors", "Inventory", "Inv Items", "Inv Transactions"];

const JOURNEY_ALLOWED_ITEMS: Record<VerticalJourney, string[]> = {
  all: [
    "Dashboard", "Command Center", "Guest Profiles", "Check-Ins", "Billing & Folio",
    "F&B / Pantry", "Requests", "Feedbacks", "Hotels", "Apartments", "Rental",
    "Workplace", "Housekeeping", "HK Tasks", "Linen", "Inspections", "HK Staff",
    "Maintenance", "Tickets", "Parts", "Assets", "Finance",
    "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget",
    "Tax", "Fixed Assets", "Reports", "Fin Settings",
    "HRMS",
    "Employees", "Timesheets", "Leave", "Payroll", "Compliance",
    "Masters", "Policies", "Appraisal", "Compensation", "Admin",
    "Workspaces", "Roles", "Audit Trail", "Backup",
    "Users", "Tenants", "Vendors", "Inventory", "Inv Items", "Inv Transactions"
  ],
  hotels: [
    "Dashboard", "Command Center", "Guest Profiles", "Check-Ins", "Billing & Folio",
    "F&B / Pantry", "Requests", "Feedbacks", "Housekeeping", "HK Tasks", "Linen",
    "Inspections", "HK Staff", "Maintenance", "Tickets", "Parts", "Assets",
    "Finance", "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget",
    "Tax", "Fixed Assets", "Reports", "Fin Settings",
    "HRMS", "Employees", "Timesheets", "Leave", "Payroll", "Compliance",
    "Masters", "Policies", "Appraisal", "Compensation", "Admin",
    "Workspaces", "Roles", "Audit Trail", "Backup",
    "Users", "Tenants", "Vendors", "Inventory", "Inv Items", "Inv Transactions"
  ],
  apartments: [
    "Dashboard", "Command Center", "Guest Profiles", "Check-Ins", "Billing & Folio",
    "F&B / Pantry", "Requests", "Feedbacks", "Housekeeping", "HK Tasks", "Linen",
    "Inspections", "HK Staff", "Maintenance", "Tickets", "Parts", "Assets",
    "Finance", "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget",
    "Tax", "Fixed Assets", "Reports", "Fin Settings",
    "HRMS", "Employees", "Timesheets", "Leave", "Payroll", "Compliance",
    "Masters", "Policies", "Appraisal", "Compensation", "Admin",
    "Workspaces", "Roles", "Audit Trail", "Backup",
    "Users", "Tenants", "Vendors", "Inventory", "Inv Items", "Inv Transactions"
  ],
  rental: [
    "Dashboard", "Rental", "Housekeeping", "HK Tasks", "Linen", "Inspections", "HK Staff",
    "Maintenance", "Tickets", "Parts", "Assets",
    "Finance", "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget",
    "Tax", "Fixed Assets", "Reports", "Fin Settings",
    "HRMS", "Employees", "Timesheets", "Leave", "Payroll", "Compliance",
    "Masters", "Policies", "Appraisal", "Compensation", "Admin",
    "Workspaces", "Roles", "Audit Trail", "Backup",
    "Users", "Vendors", "Inventory", "Inv Items", "Inv Transactions"
  ],
  workplace: [
    "Dashboard", "Workplace", "Housekeeping", "HK Tasks", "Linen", "Inspections", "HK Staff",
    "Maintenance", "Tickets", "Parts", "Assets",
    "Finance", "Chart of Accts", "Journal", "Ledger", "Receivables", "Payables", "Budget",
    "Tax", "Fixed Assets", "Reports", "Fin Settings",
    "HRMS", "Employees", "Timesheets", "Leave", "Payroll", "Compliance",
    "Masters", "Policies", "Appraisal", "Compensation", "Admin",
    "Workspaces", "Roles", "Audit Trail", "Backup",
    "Users", "Tenants", "Vendors", "Inventory", "Inv Items", "Inv Transactions"
  ]
};

function getLocalDemoUser(): UserProfile | null {
  try { const r = localStorage.getItem("ehms_demo_session"); return r ? JSON.parse(r) : null; } catch { return null; }
}

export default function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { user: authUser } = useAuth();
  const [fallbackUser, setFallbackUser] = useState<UserProfile | null>(null);
  const { settings } = useGlobalSettings();
  const { activeJourney } = useJourney();

  useEffect(() => {
    const demo = getLocalDemoUser();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (demo) setFallbackUser(demo);
  }, []);

  const user = authUser || fallbackUser;
  const role = user?.role_name || "unknown";

  const visibleItems = ALL_NAV_ITEMS.map((item) => {
    if (item.label === "Dashboard") {
      const targetHref = activeJourney === "all" ? "/dashboard" : `/dashboard/${activeJourney}`;
      if (hasAccess(role, targetHref)) {
        return { ...item, href: targetHref };
      }
    }
    return item;
  }).filter((item) => {
    if (!item.roles.includes(role) || !hasAccess(role, item.href)) return false;
    
    // Platform admin sees only their items — no journey filtering
    if (role === "platform_super_admin") return true;
    
    // Filter based on active journey mapping
    const allowedForJourney = JOURNEY_ALLOWED_ITEMS[activeJourney] || JOURNEY_ALLOWED_ITEMS.all;
    if (!allowedForJourney.includes(item.label)) return false;
    
    return true;
  });

  const primaryNav = visibleItems.filter((item) =>
    PRIMARY_LABELS.includes(item.label)
  );
  const secondaryNav = visibleItems.filter(
    (item) => !PRIMARY_LABELS.includes(item.label)
  );

  const navItems = showAll ? visibleItems : primaryNav;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

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

      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={onMobileClose}
              className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative"
              style={{
                background: active ? "rgba(255,255,255,0.10)" : "transparent",
                color: active ? "#FFFFFF" : "rgba(255,255,255,0.60)",
                borderLeft: active ? `3px solid ${settings.secondary_color}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && visibleItems.length > primaryNav.length && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-xs w-full text-left transition-all"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            <span>{showAll ? "← Less" : `More → (${secondaryNav.length})`}</span>
          </button>
        )}
      </nav>

      {user && !collapsed && (
        <div className="p-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Shield className="w-3 h-3" style={{ color: settings.secondary_color }} />
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
          background: "#2C3547",
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
          background: "#2C3547",
          width: collapsed ? 64 : 240,
          minWidth: collapsed ? 64 : 240,
        }}
      >
        {sidebarContent}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110"
          style={{
            background: settings.secondary_color,
            border: "2px solid #F5F7FA",
            color: "#fff",
          }}
        >
          <ChevronLeft className={`w-3 h-3 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>
    </>
  );
}
