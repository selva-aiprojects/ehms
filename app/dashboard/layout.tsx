"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import { AuthProvider } from "@/lib/auth-context";
import { TenantThemeProvider } from "@/components/providers/TenantThemeProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <TenantThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuClick={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6" style={{ background: "#F5F7FA" }}>
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
      </TenantThemeProvider>
    </AuthProvider>
  );
}
