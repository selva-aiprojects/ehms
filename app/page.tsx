"use client";

import Image from "next/image";
import { Users, Key, Building2, ArrowRight, Eye, EyeOff, UserCog, CreditCard, Briefcase, Hotel, Home, LayoutDashboard, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useJourney, type VerticalJourney } from "@/components/providers/JourneyProvider";

export default function LoginPage() {
  const router = useRouter();
  const { activeJourney, setJourney } = useJourney();

  // Sign In / Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user) {
          localStorage.setItem("ehms_demo_session", JSON.stringify(data.user));
        }
        const targetDashboard = activeJourney === "all" ? "/dashboard" : `/dashboard/${activeJourney}`;
        router.push(targetDashboard);
        router.refresh();
        setLoading(false);
        return;
      }
      setError(data.error || "Login failed");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F5F7FA" }}>
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: "#2C3547" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 70%, rgba(43,174,142,0.15) 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <div className="mb-10">
            <Image src="/eHMS_logo.png" alt="eHMS" width={140} height={56} className="object-contain" style={{ filter: "brightness(1.08)" }} />
          </div>
          <p className="text-xs font-medium mb-6 tracking-widest uppercase" style={{ color: "#2BAE8E" }}>
            Enterprise Hospitality Management System
          </p>
          <h1 className="text-4xl font-bold leading-tight mb-4">Unified Multi-Vertical Hospitality & Space Management</h1>
          <p className="text-lg max-w-md" style={{ color: "rgba(255,255,255,0.65)" }}>
            Hotels · Service Apartments · Rental & Tenancy · Workplace & Managed Offices
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span>Star Hotels & Resorts</span><span>·</span>
          <span>Service Apartments</span><span>·</span>
          <span>Apartment Rental</span><span>·</span>
          <span>Workplace</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/eHMS_logo.png" alt="eHMS" width={100} height={40} className="object-contain" />
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: "#1A3C5E" }}>eHMS Portal</h2>
          <p className="text-sm mb-6" style={{ color: "#64748B" }}>Access your hospitality workspace</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A2E44" }}>Business Vertical / Workspace</label>
              <div className="relative">
                <select
                  value={activeJourney}
                  onChange={(e) => setJourney(e.target.value as VerticalJourney)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm outline-none bg-white appearance-none transition-colors"
                  style={{ borderColor: "#E2E8F0" }}
                >
                  <option value="all">All Workspaces</option>
                  <option value="hotels">Hotels & Resorts</option>
                  <option value="apartments">Serviced Apartments</option>
                  <option value="rental">Apartment Rental (Long-term)</option>
                  <option value="workplace">Workplace Management</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#2BAE8E" }}>
                  {activeJourney === "all" && <LayoutDashboard className="w-4 h-4" />}
                  {activeJourney === "hotels" && <Hotel className="w-4 h-4" />}
                  {activeJourney === "apartments" && <Building2 className="w-4 h-4" />}
                  {activeJourney === "rental" && <Home className="w-4 h-4" />}
                  {activeJourney === "workplace" && <Briefcase className="w-4 h-4" />}
                </div>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: "#64748B" }}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A2E44" }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
                placeholder="you@company.com"
                onFocus={e => e.target.style.borderColor = "#2BAE8E"}
                onBlur={e => e.target.style.borderColor = "#E2E8F0"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A2E44" }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border text-sm outline-none transition-colors"
                  style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
                  placeholder="••••••••"
                  onFocus={e => e.target.style.borderColor = "#2BAE8E"}
                  onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#64748B" }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: "#2BAE8E" }} />
                <span style={{ color: "#64748B" }}>Remember me</span>
              </label>
              <button type="button" className="hover:underline" style={{ color: "#2BAE8E" }}>Forgot password?</button>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#64748B" }}>Autofill Demo Credentials</label>
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setEmail(e.target.value);
                      setPassword("Demo@1234");
                    }
                  }}
                  className="w-full pl-4 pr-10 py-2 rounded-lg border text-xs outline-none bg-slate-100 appearance-none transition-colors font-medium cursor-pointer"
                  style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
                  defaultValue=""
                >
                  <option value="">— Select a demo role to pre-fill fields —</option>
                  <option value="superadmin@ehms.demo">Super Admin</option>
                  <option value="executive@ehms.demo">Executive</option>
                  <option value="admin@ehms.demo">Property Manager</option>
                  <option value="frontdesk@ehms.demo">Front Desk</option>
                  <option value="housekeeping@ehms.demo">Housekeeping Staff</option>
                  <option value="maintenance@ehms.demo">Maintenance Staff</option>
                  <option value="hr@ehms.demo">HR Manager</option>
                  <option value="finance@ehms.demo">Finance Manager</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" style={{ color: "#64748B" }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-4 py-2.5 text-sm" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)" }}
            >
              {loading ? "Signing in\u2026" : (
                <> Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
