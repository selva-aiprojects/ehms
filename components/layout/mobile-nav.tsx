"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, CalendarCheck, Sparkles, Wrench, CreditCard } from "lucide-react";

const mobileItems = [
  { label: "Home",      icon: LayoutDashboard, href: "/dashboard" },
  { label: "Front Desk", icon: CalendarCheck,  href: "/dashboard/front-desk" },
  { label: "Housekeep", icon: Sparkles,        href: "/dashboard/housekeeping" },
  { label: "Maint.",    icon: Wrench,          href: "/dashboard/maintenance" },
  { label: "Finance",   icon: CreditCard,      href: "/dashboard/finance" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white border-t px-2"
      style={{
        borderColor: "var(--color-border)",
        height: "calc(4rem + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {mobileItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 py-1 px-2 min-w-0"
          >
            <item.icon
              className="w-5 h-5"
              style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
            />
            <span
              className="text-[10px] font-medium truncate max-w-full"
              style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
