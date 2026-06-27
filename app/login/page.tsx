"use client";

import Image from "next/image";
import {
  Building2, ArrowRight, Eye, EyeOff, ChevronDown,
  Hotel, Home, LayoutDashboard, Briefcase, Server,
  ArrowLeft, Ban, CheckCircle, Loader2, Database,
  UserCog, Lock, X, AlertCircle, Globe, Plus
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useJourney, type VerticalJourney } from "@/components/providers/JourneyProvider";
import Link from "next/link";

type VerticalKey = "hotels" | "apartments" | "rental" | "workplace";

const VERTICAL_META: Record<VerticalKey, { label: string; icon: typeof Building2 }> = {
  hotels: { label: "Hotels & Resorts", icon: Hotel },
  apartments: { label: "Serviced Apartments", icon: Building2 },
  rental: { label: "Apartment Rental", icon: Home },
  workplace: { label: "Workplace", icon: Briefcase },
};

const ALL_VERTICAL_KEYS = Object.keys(VERTICAL_META) as VerticalKey[];

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-dark-navy)" }}>
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
  domain: string | null;
  contact_email: string | null;
  is_active: boolean;
  config: Record<string, unknown> | null;
  created_at: string;
}

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
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantsError, setTenantsError] = useState<string | null>(null);

  // Platform admin modal
  const [showPlatformLogin, setShowPlatformLogin] = useState(false);
  const [plEmail, setPlEmail] = useState("");
  const [plPassword, setPlPassword] = useState("");
  const [plShowPwd, setPlShowPwd] = useState(false);
  const [plLoading, setPlLoading] = useState(false);
  const [plError, setPlError] = useState<string | null>(null);

  const tenantCode = searchParams.get("tenant");

  // Fetch all tenants on mount
  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((r) => r.json())
      .then((data) => {
        if (data.tenants) setTenants(data.tenants);
        else setTenantsError(data.error || "Failed to load tenants");
      })
      .catch(() => setTenantsError("Network error"))
      .finally(() => setTenantLoading(false));
  }, []);

  // Resolve a single tenant by code using direct lookup
  useEffect(() => {
    if (!tenantCode) {
      setTenant(null);
      setTenantLoading(false);
      return;
    }

    setTenantLoading(true);
    fetch(`/api/admin/tenants/verify?code=${encodeURIComponent(tenantCode)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tenant) {
          const t = data.tenant;
          setTenant({
            id: t.id,
            name: t.name,
            code: t.code,
            schema_name: t.schema_name,
            logo_url: null,
            domain: null,
            contact_email: null,
            is_active: t.is_active,
            config: {
              suspended: t.suspended,
              verticals: t.verticals,
              workspaces: t.workspaces,
              contact_email: t.contact_email,
            },
            created_at: t.created_at,
          });
        } else {
          setTenant(null);
        }
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
          if (data.tenant?.code !== tenantCode) {
            setError(`Tenant mismatch: server returned "${data.tenant?.code}" but expected "${tenantCode}". Please try again.`);
            setLoading(false);
            return;
          }
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

  function selectTenant(code: string) {
    localStorage.removeItem("ehms_demo_session");
    localStorage.removeItem("ehms_tenant_verticals");
    localStorage.removeItem("ehms_tenant_name");
    router.push(`/login?tenant=${code}`);
  }

  function getTenantVerticals(t: TenantInfo): VerticalKey[] {
    const config = t.config || {};
    const v = config.verticals as VerticalKey[] | undefined;
    return v && v.length > 0 ? v : ALL_VERTICAL_KEYS;
  }

  function getTenantWorkspaces(t: TenantInfo): { type: VerticalKey; name: string; is_primary: boolean }[] {
    const config = t.config || {};
    const ws = config.workspaces as { type: VerticalKey; name: string; is_primary: boolean }[] | undefined;
    if (!ws || ws.length === 0) return [];
    return ws.map((w) => {
      const meta = VERTICAL_META[w.type as VerticalKey];
      return {
        ...w,
        name: (w.name && w.name !== w.type) ? w.name : (meta?.label || w.type),
      };
    });
  }

  async function handlePlatformLogin(e: React.FormEvent) {
    e.preventDefault();
    setPlLoading(true);
    setPlError(null);
    try {
      const res = await fetch("/api/auth/platform-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: plEmail.trim(), password: plPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard/admin/tenants");
        router.refresh();
      } else {
        setPlError(data.error || "Login failed");
      }
    } catch {
      setPlError("Network error");
    }
    setPlLoading(false);
  }

  function isSuspended(t: TenantInfo): boolean {
    const config = t.config || {};
    return config.suspended === true;
  }

  // ── Shard selection screen ──
  if (!tenantCode) {
    return (
      <>
        <div className="min-h-screen flex flex-col" style={{ background: "var(--color-dark-navy)" }}>
          {/* Mini nav */}
          <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <Link href="/">
              <Image src="/eHMS_logo.png" alt="eHMS" width={100} height={40} className="object-contain brightness-110" priority />
            </Link>
            <Link href="/" className="text-sm font-medium transition-colors" style={{ color: "rgba(245,247,250,0.5)" }}
              onMouseEnter={e => e.currentTarget.style.color = "#2BAE8E"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(245,247,250,0.5)"}>
              ← Back to Home
            </Link>
          </nav>

          <div className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-3xl">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 border"
                  style={{ background: "rgba(43,174,142,0.1)", borderColor: "rgba(43,174,142,0.25)", color: "#2BAE8E" }}>
                  <Database className="w-3.5 h-3.5" /> Multi-Tenant Shard Selection
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "#F5F7FA" }}>
                  Select Your Organization
                </h1>
                <p className="text-sm" style={{ color: "rgba(245,247,250,0.5)" }}>
                  Choose an organization shard to sign in. Each shard has isolated data and subscribed features.
                </p>
              </div>

              {tenantLoading && (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#2BAE8E" }} />
                </div>
              )}

              {tenantsError && (
                <div className="text-center py-16">
                  <Server className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(229,62,62,0.4)" }} />
                  <p className="text-sm" style={{ color: "#E53E3E" }}>{tenantsError}</p>
                </div>
              )}

              {!tenantLoading && !tenantsError && tenants.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tenants.map((t, i) => {
                    const verts = getTenantVerticals(t);
                    const suspendedFlag = isSuspended(t);
                    return (
                      <button
                        key={t.id}
                        onClick={() => !suspendedFlag && selectTenant(t.code)}
                        disabled={suspendedFlag}
                        className={`group relative text-left rounded-2xl p-5 transition-all duration-200 cursor-pointer ${
                          suspendedFlag ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.02] hover:shadow-xl"
                        }`}
                        style={{
                          background: "linear-gradient(135deg, rgba(43,174,142,0.06) 0%, rgba(26,60,94,0.12) 100%)",
                          border: `1px solid ${suspendedFlag ? "rgba(229,62,62,0.2)" : "rgba(43,174,142,0.12)"}`,
                          animation: `slide-up 0.4s ease-out ${i * 0.08}s both`,
                        }}
                      >
                        {suspendedFlag && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: "rgba(229,62,62,0.15)", color: "#E53E3E" }}>
                            <Ban className="w-3 h-3" /> Suspended
                          </div>
                        )}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                          style={{ background: "rgba(43,174,142,0.12)" }}>
                          <Building2 className="w-5 h-5" style={{ color: "#2BAE8E" }} />
                        </div>
                        <h3 className="text-base font-bold mb-0.5" style={{ color: "#F5F7FA" }}>{t.name}</h3>
                        <span className="inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded mb-3"
                          style={{ background: "rgba(43,174,142,0.1)", color: "#2BAE8E", border: "1px solid rgba(43,174,142,0.2)" }}>
                          {t.code}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(getTenantWorkspaces(t).length > 0 ? getTenantWorkspaces(t) : verts.map(v => ({ type: v, name: VERTICAL_META[v]?.label || v, is_primary: false }))).map((ws) => {
                            const meta = VERTICAL_META[ws.type as VerticalKey];
                            const Icon = meta?.icon || Building2;
                            return (
                              <span key={ws.type + ws.name}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium"
                                style={{ background: ws.is_primary ? "rgba(43,174,142,0.1)" : "rgba(43,174,142,0.06)", color: ws.is_primary ? "#2BAE8E" : "rgba(43,174,142,0.7)", border: `1px solid ${ws.is_primary ? "rgba(43,174,142,0.2)" : "rgba(43,174,142,0.1)"}` }}>
                                <Icon className="w-2.5 h-2.5" /> {ws.name}
                              </span>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {!tenantLoading && !tenantsError && tenants.length === 0 && (
                <div className="text-center py-16">
                  <Server className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(245,247,250,0.1)" }} />
                  <p className="text-sm" style={{ color: "rgba(245,247,250,0.4)" }}>No organizations found.</p>
                </div>
              )}

              {/* Platform Admin divider */}
              {!tenantLoading && (
                <div className="mt-12 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                    <UserCog className="w-4 h-4" style={{ color: "rgba(212,168,83,0.4)" }} />
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                  </div>
                  <button
                    onClick={() => setShowPlatformLogin(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 cursor-pointer"
                    style={{ border: "1px solid rgba(212,168,83,0.2)", color: "var(--color-gold)" }}
                  >
                    <Lock className="w-4 h-4" /> Platform Admin Sign In
                  </button>
                  <p className="mt-2 text-xs" style={{ color: "rgba(245,247,250,0.3)" }}>
                    Authenticate as eHMS platform superadmin to manage tenant shards
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Platform Login Modal */}
        {showPlatformLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div className="relative w-full max-w-sm rounded-2xl p-8 animate-slide-up"
              style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(212,168,83,0.15)" }}>
              <button onClick={() => setShowPlatformLogin(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: "rgba(245,247,250,0.4)" }}>
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(212,168,83,0.12)" }}>
                  <UserCog className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "#F5F7FA" }}>Platform Admin</h3>
                  <p className="text-xs" style={{ color: "rgba(245,247,250,0.5)" }}>
                    Sign in to manage eHMS tenant shards
                  </p>
                </div>
              </div>

              <form onSubmit={handlePlatformLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "rgba(245,247,250,0.7)" }}>
                    Platform Email
                  </label>
                  <input type="email" value={plEmail} required
                    onChange={(e) => setPlEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                    style={{ borderColor: "rgba(212,168,83,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }}
                    placeholder="admin@ehms.co" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "rgba(245,247,250,0.7)" }}>
                    Password
                  </label>
                  <div className="relative">
                    <input type={plShowPwd ? "text" : "password"} value={plPassword} required
                      onChange={(e) => setPlPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border text-sm outline-none transition-colors"
                      style={{ borderColor: "rgba(212,168,83,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }}
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setPlShowPwd(!plShowPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: "rgba(245,247,250,0.4)" }}>
                      {plShowPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {plError && (
                  <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
                    style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
                    <AlertCircle className="w-4 h-4 shrink-0" /> {plError}
                  </div>
                )}

                <button type="submit" disabled={plLoading}
                  className="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #D4A853 0%, #C49A3C 100%)" }}>
                  {plLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <><Lock className="w-4 h-4" /> Platform Sign In</>}
                </button>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── Loading / Error / Suspended states ──
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
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)", color: "#FFFFFF" }}
          >
            <ArrowLeft className="w-4 h-4" /> Browse Organizations
          </button>
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
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)", color: "#FFFFFF" }}
          >
            <ArrowLeft className="w-4 h-4" /> Browse Organizations
          </button>
        </div>
      </div>
    );
  }

  // ── Login form (tenant selected) ──
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

          {/* Tenant badge — click to switch shard */}
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium mb-4 transition-colors hover:opacity-80 cursor-pointer"
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
          </button>

          {/* Workspace badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(getTenantWorkspaces(tenant).length > 0 ? getTenantWorkspaces(tenant) : tenantVerticals.map(v => ({ type: v, name: VERTICAL_META[v]?.label || v, is_primary: false }))).map((ws) => {
              const meta = VERTICAL_META[ws.type as VerticalKey];
              const Icon = meta?.icon || Building2;
              return (
                <span key={ws.type + ws.name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    background: ws.is_primary ? "rgba(43,174,142,0.1)" : "rgba(43,174,142,0.06)",
                    color: ws.is_primary ? "#2BAE8E" : "rgba(43,174,142,0.7)",
                    border: `1px solid ${ws.is_primary ? "rgba(43,174,142,0.2)" : "rgba(43,174,142,0.1)"}`,
                  }}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {ws.name}
                </span>
              );
            })}
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
                  {(getTenantWorkspaces(tenant).length > 0
                    ? getTenantWorkspaces(tenant)
                    : allowedJourneys.map(j => ({ type: j as VerticalKey, name: VERTICAL_META[j as VerticalKey]?.label || j, is_primary: false }))
                  ).map((ws) => (
                    <option key={ws.type} value={ws.type}>{ws.name}</option>
                  ))}
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "#64748B" }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: "#2BAE8E" }} />
                <span style={{ color: "#64748B" }}>Remember me</span>
              </label>
              <button type="button" className="hover:underline cursor-pointer" style={{ color: "#2BAE8E" }}>Forgot password?</button>
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
                border: "1px solid rgba(229,62,62,0.2)",
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
