"use client";

import Image from "next/image";
import { Building2, ArrowRight, Eye, EyeOff, ChevronDown, Hotel, Home, LayoutDashboard, Briefcase, Server, ArrowLeft, Ban, CheckCircle } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useJourney, type VerticalJourney } from "@/components/providers/JourneyProvider";
import Link from "next/link";

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F7FA" }}>
        <div className="w-8 h-8 border-4 border-[#2BAE8E] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

interface TenantInfo {
  id: string;
  name: string;
  code: string;
  schema_name: string;
  logo_url: string | null;
  config: Record<string, unknown> | null;
}

const VERTICAL_LABELS: Record<string, string> = {
  hotels: "Hotels & Resorts",
  apartments: "Serviced Apartments",
  rental: "Apartment Rental",
  workplace: "Workplace",
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeJourney, setJourney, allowedJourneys } = useJourney();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [remember, setRemember] = useState(false);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);

  const tenantCode = searchParams.get("tenant");

  useEffect(() => {
    if (!tenantCode) {
      setTenantLoading(false);
      return;
    }

    fetch(`/api/admin/tenants`)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.tenants || []).find(
          (t: TenantInfo) => t.code === tenantCode
        );
        setTenant(found || null);
      })
      .catch(() => setTenant(null))
      .finally(() => setTenantLoading(false));
  }, [tenantCode]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuspended(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          tenant_code: tenantCode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user) {
          localStorage.setItem("ehms_demo_session", JSON.stringify(data.user));
          localStorage.setItem("ehms_tenant_verticals", JSON.stringify(data.user.tenant_verticals || []));
          localStorage.setItem("ehms_tenant_name", data.tenant?.name || "");
        }
        const targetDashboard = activeJourney === "all" ? "/dashboard" : `/dashboard/${activeJourney}`;
        router.push(targetDashboard);
        router.refresh();
        setLoading(false);
        return;
      }
      if (data.suspended) {
        setSuspended(true);
      }
      setError(data.error || "Login failed");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  function getTenantVerticals(t: TenantInfo): string[] {
    const config = t.config || {};
    const v = config.verticals as string[] | undefined;
    return v && v.length > 0 ? v : ["hotels", "apartments", "rental", "workplace"];
  }

  function isSuspended(t: TenantInfo): boolean {
    const config = t.config || {};
    return config.suspended === true;
  }

  if (!tenantCode) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-dark-navy)" }}>
        <div className="text-center max-w-sm">
          <Server className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(245,247,250,0.15)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "#F5F7FA" }}>No Organization Selected</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(245,247,250,0.5)" }}>
            Please select an organization shard before signing in.
          </p>
          <Link
            href="/tenants"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)", color: "#FFFFFF" }}
          >
            <ArrowLeft className="w-4 h-4" /> Browse Organizations
          </Link>
        </div>
      </div>
    );
  }

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-dark-navy)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2BAE8E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm" style={{ color: "rgba(245,247,250,0.5)" }}>Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-dark-navy)" }}>
        <div className="text-center max-w-sm">
          <Server className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(245,247,250,0.15)" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "#F5F7FA" }}>Organization Not Found</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(245,247,250,0.5)" }}>
            No organization with code &quot;{tenantCode}&quot; exists.
          </p>
          <Link
            href="/tenants"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)", color: "#FFFFFF" }}
          >
            <ArrowLeft className="w-4 h-4" /> Browse Organizations
          </Link>
        </div>
      </div>
    );
  }

  const tenantVerticals = getTenantVerticals(tenant);
  const tenantSuspended = isSuspended(tenant);

  if (tenantSuspended) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-dark-navy)" }}>
        <div className="text-center max-w-sm">
          <Ban className="w-12 h-12 mx-auto mb-4" style={{ color: "#E53E3E" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "#F5F7FA" }}>Account Suspended</h2>
          <p className="text-sm mb-2" style={{ color: "rgba(245,247,250,0.6)" }}>
            <strong>{tenant.name}</strong> has been suspended.
          </p>
          <p className="text-sm mb-6" style={{ color: "rgba(245,247,250,0.5)" }}>
            Contact your platform administrator for assistance.
          </p>
          <Link
            href="/tenants"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)", color: "#FFFFFF" }}
          >
            <ArrowLeft className="w-4 h-4" /> Browse Organizations
          </Link>
        </div>
      </div>
    );
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

          {/* Tenant badge */}
          <Link
            href="/tenants"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium mb-4 transition-colors hover:opacity-80"
            style={{
              background: "rgba(43,174,142,0.08)",
              color: "#2BAE8E",
              border: "1px solid rgba(43,174,142,0.15)",
            }}
          >
            <Server className="w-3.5 h-3.5" />
            {tenant.name}
            <span className="font-mono opacity-60">({tenant.code})</span>
            <ArrowLeft className="w-3 h-3 opacity-60" />
          </Link>

          {/* Subscribed verticals */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tenantVerticals.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                style={{
                  background: "rgba(43,174,142,0.06)",
                  color: "rgba(43,174,142,0.7)",
                  border: "1px solid rgba(43,174,142,0.1)",
                }}
              >
                <CheckCircle className="w-2.5 h-2.5" />
                {VERTICAL_LABELS[v] || v}
              </span>
            ))}
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
                  {allowedJourneys.includes("hotels") && <option value="hotels">Hotels & Resorts</option>}
                  {allowedJourneys.includes("apartments") && <option value="apartments">Serviced Apartments</option>}
                  {allowedJourneys.includes("rental") && <option value="rental">Apartment Rental (Long-term)</option>}
                  {allowedJourneys.includes("workplace") && <option value="workplace">Workplace Management</option>}
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
              <div className="rounded-lg px-4 py-2.5 text-sm" style={{
                background: suspended ? "rgba(229,62,62,0.08)" : "rgba(229,62,62,0.08)",
                color: "#E53E3E",
                border: `1px solid rgba(229,62,62,0.2)`,
              }}>
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
