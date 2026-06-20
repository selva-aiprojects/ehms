"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, CalendarCheck, Users, BarChart2, Settings,
  Building2, Sparkles, Wrench, CreditCard, Briefcase,
  UserCog, Home, Hotel, ChevronLeft, Shield, Coffee, ClipboardList, Wallet, Star
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, type UserProfile } from "@/lib/auth-context";
import { hasAccess } from "@/lib/role-access";
import { useGlobalSettings } from "@/components/providers/SettingsProvider";

const ALL_NAV_ITEMS = [
  { label: "Dashboard",    icon: LayoutDashboard, href: "/dashboard", roles: ["super_admin","executive","property_manager","front_desk","housekeeping_supervisor","housekeeping_staff","maintenance_staff","maintenance_supervisor","hr_manager","hr_executive","finance_manager","finance_executive","security_staff","vendor_user","workplace_facility_manager"] },
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
  { label: "Maintenance",  icon: Wrench,          href: "/dashboard/maintenance", roles: ["super_admin","executive","maintenance_staff","maintenance_supervisor"] },
  { label: "Finance",      icon: CreditCard,      href: "/dashboard/finance", roles: ["super_admin","executive","finance_manager","finance_executive"] },
  { label: "HRMS",         icon: Users,           href: "/dashboard/hr", roles: ["super_admin","executive","hr_manager","hr_executive"] },
  { label: "Admin",        icon: UserCog,         href: "/dashboard/admin", roles: ["super_admin","executive","property_manager"] },
];

const PRIMARY_LABELS = ["Dashboard", "Command Center", "Guest Profiles", "Check-Ins", "Billing & Folio", "F&B / Pantry", "Requests", "Feedbacks", "Hotels", "Apartments", "Rental", "Workplace", "Housekeeping", "Maintenance", "Finance", "HRMS", "Admin"];

function getLocalDemoUser(): UserProfile | null {
  try { const r = localStorage.getItem("ehms_demo_session"); return r ? JSON.parse(r) : null; } catch { return null; }
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { user: authUser, loading } = useAuth();
  const [fallbackUser, setFallbackUser] = useState<UserProfile | null>(null);
  const { settings } = useGlobalSettings();

  useEffect(() => {
    const demo = getLocalDemoUser();
    if (demo) setFallbackUser(demo);
  }, []);

  const user = authUser || fallbackUser;
  const role = user?.role_name || "unknown";

  const visibleItems = ALL_NAV_ITEMS.filter((item) =>
    item.roles.includes(role) && hasAccess(role, item.href)
  );

  const primaryNav = visibleItems.filter((item) =>
    PRIMARY_LABELS.includes(item.label)
  );
  const secondaryNav = visibleItems.filter(
    (item) => !PRIMARY_LABELS.includes(item.label)
  );

  const navItems = showAll ? visibleItems : primaryNav;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className="relative flex flex-col transition-all duration-300 select-none hidden md:flex"
      style={{
        background: "#2C3547",
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
      }}
    >
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
  );
}
