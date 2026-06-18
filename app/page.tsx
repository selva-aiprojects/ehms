"use client";

import Image from "next/image";
import { Users, Key, Building2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex" style={{ background: "#F5F7FA" }}>
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: "#2C3547" }}
      >
        {/* Subtle background gradient accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 70%, rgba(43,174,142,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative z-10">
          {/* eHMS Logo */}
          <div className="mb-10">
            <Image
              src="/eHMS_logo.png"
              alt="eHMS — Enterprise Hospitality Management System"
              width={140}
              height={56}
              className="object-contain"
              style={{ filter: "brightness(1.08)" }}
            />
          </div>
          <p className="text-xs font-medium mb-6 tracking-widest uppercase" style={{ color: "#2BAE8E" }}>
            Enterprise Hospitality Management System
          </p>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Unified Multi-Vertical Hospitality & Space Management
          </h1>
          <p className="text-lg max-w-md" style={{ color: "rgba(255,255,255,0.65)" }}>
            Hotels · Service Apartments · Rental & Tenancy · Workplace & Managed Offices
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span>Star Hotels & Resorts</span>
          <span>·</span>
          <span>Service Apartments</span>
          <span>·</span>
          <span>Apartment Rental</span>
          <span>·</span>
          <span>Workplace</span>
        </div>
      </div>

      {/* Right Panel — Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/eHMS_logo.png"
              alt="eHMS"
              width={100}
              height={40}
              className="object-contain"
            />
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: "#1A3C5E" }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: "#64748B" }}>Sign in to your account</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A2E44" }}>Email</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
                placeholder="you@company.com"
                onFocus={(e) => e.target.style.borderColor = "#2BAE8E"}
                onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A2E44" }}>Password</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
                placeholder="••••••••"
                onFocus={(e) => e.target.style.borderColor = "#2BAE8E"}
                onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" style={{ accentColor: "#2BAE8E" }} />
                <span style={{ color: "#64748B" }}>Remember me</span>
              </label>
              <button className="hover:underline" style={{ color: "#2BAE8E" }}>Forgot password?</button>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)" }}
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Demo Quick Login Links */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid #E2E8F0" }}>
            <p className="text-xs font-medium mb-3 text-center" style={{ color: "#64748B" }}>DEMO QUICK LOGIN</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Super Admin", icon: Users, href: "/dashboard" },
                { label: "Front Desk", icon: Key, href: "/dashboard/front-desk" },
                { label: "Housekeeping", icon: Building2, href: "/dashboard/housekeeping" },
                { label: "Maintenance", icon: Building2, href: "/dashboard/maintenance" },
              ].map(({ label, icon: Icon, href }) => (
                <button
                  key={label}
                  onClick={() => router.push(href)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: "#F5F7FA", color: "#1A3C5E" }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
