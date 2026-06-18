"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, CalendarCheck, Users, BarChart2, Settings,
  Building2, Sparkles, Wrench, CreditCard, Briefcase,
  UserCog, Home, Hotel, ChevronLeft,
} from "lucide-react";
import { useState } from "react";

/* Primary nav — matching the reference screenshot */
const primaryNav = [
  { label: "Dashboard",    icon: LayoutDashboard, href: "/dashboard" },
  { label: "Reservations", icon: CalendarCheck,   href: "/dashboard/front-desk" },
  { label: "Guests",       icon: Users,           href: "/dashboard/hotels" },
  { label: "Reports",      icon: BarChart2,        href: "/dashboard/finance" },
  { label: "Settings",     icon: Settings,         href: "/dashboard/admin" },
];

/* Secondary / extended nav */
const secondaryNav = [
  { label: "Hotels & Resorts",    icon: Hotel,     href: "/dashboard/hotels" },
  { label: "Service Apartments",  icon: Building2, href: "/dashboard/apartments" },
  { label: "Rental & Tenancy",    icon: Home,      href: "/dashboard/rental" },
  { label: "Workplace",           icon: Briefcase, href: "/dashboard/workplace" },
  { label: "Housekeeping",        icon: Sparkles,  href: "/dashboard/housekeeping" },
  { label: "Maintenance",         icon: Wrench,    href: "/dashboard/maintenance" },
  { label: "Finance",             icon: CreditCard,href: "/dashboard/finance" },
  { label: "HRMS",                icon: Users,     href: "/dashboard/hr" },
  { label: "Admin",               icon: UserCog,   href: "/dashboard/admin" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const navItems = showAll
    ? [...primaryNav, ...secondaryNav]
    : primaryNav;

  return (
    <aside
      className="relative flex flex-col transition-all duration-300 select-none"
      style={{
        background: "#2C3547",
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex flex-col items-center justify-center py-6 px-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Image
          src="/eHMS_logo.png"
          alt="eHMS"
          width={collapsed ? 36 : 120}
          height={collapsed ? 36 : 80}
          className="object-contain transition-all duration-300"
          style={{ filter: "brightness(1.05)" }}
          priority
        />
      </div>

      {/* ── Nav ── */}
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
                borderLeft: active ? "3px solid #2BAE8E" : "3px solid transparent",
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

        {/* More / Less toggle */}
        {!collapsed && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-xs w-full text-left transition-all"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            <span>{showAll ? "← Less" : "More →"}</span>
          </button>
        )}
      </nav>

      {/* ── Property selector ── */}
      {!collapsed && (
        <div className="p-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <select
            className="w-full text-xs rounded-lg px-2 py-1.5 border outline-none"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              borderColor: "rgba(255,255,255,0.12)",
            }}
            defaultValue="all"
          >
            <option value="all"   style={{ color: "#1A2E44" }}>All Properties</option>
            <option value="hotel" style={{ color: "#1A2E44" }}>Oceanview Hotel</option>
            <option value="svc"   style={{ color: "#1A2E44" }}>Cityscape Serviced Apts</option>
            <option value="rent"  style={{ color: "#1A2E44" }}>Greenwood Residency</option>
            <option value="work"  style={{ color: "#1A2E44" }}>Innovate Coworking</option>
          </select>
        </div>
      )}

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110"
        style={{
          background: "#2BAE8E",
          border: "2px solid #F5F7FA",
          color: "#fff",
        }}
      >
        <ChevronLeft className={`w-3 h-3 transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </aside>
  );
}
