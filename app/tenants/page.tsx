"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, Database, Shield, Server,
  Plus, Globe, ChevronRight, X, Loader2, CheckCircle,
  AlertCircle, Sparkles, ArrowLeft, Hotel, Home, Briefcase, Ban,
  UserCog, Lock, Eye, EyeOff, Trash2, CreditCard, DollarSign, User
} from "lucide-react";
import { useState, useEffect } from "react";

type VerticalKey = "hotels" | "apartments" | "rental" | "workplace";

const VERTICAL_META: Record<VerticalKey, { label: string; icon: typeof Building2 }> = {
  hotels: { label: "Hotels & Resorts", icon: Hotel },
  apartments: { label: "Serviced Apartments", icon: Building2 },
  rental: { label: "Apartment Rental", icon: Home },
  workplace: { label: "Workplace", icon: Briefcase },
};

const ALL_VERTICAL_KEYS = Object.keys(VERTICAL_META) as VerticalKey[];

interface Tenant {
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

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProvision, setShowProvision] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [form, setForm] = useState({
    name: "", code: "", schema: "",
    workspaces: [{ type: "" as VerticalKey | "", name: "", is_primary: true }],
    primary_contact_name: "",
    payment_mode: "monthly",
    subscription_charges_type: "Monthly",
    price: 0,
  });
  const [scrolled, setScrolled] = useState(false);

  // Platform admin auth
  const [platformAuthed, setPlatformAuthed] = useState(false);
  const [platformEmail, setPlatformEmail] = useState("");
  const [platformChecking, setPlatformChecking] = useState(true);

  // Platform login modal
  const [showPlatformLogin, setShowPlatformLogin] = useState(false);
  const [plEmail, setPlEmail] = useState("");
  const [plPassword, setPlPassword] = useState("");
  const [plShowPwd, setPlShowPwd] = useState(false);
  const [plLoading, setPlLoading] = useState(false);
  const [plError, setPlError] = useState<string | null>(null);

  // Check if platform admin is already authenticated
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.is_platform_admin) {
          setPlatformAuthed(true);
          setPlatformEmail(data.user.email);
        }
      })
      .catch(() => {})
      .finally(() => setPlatformChecking(false));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((r) => r.json())
      .then((data) => {
        if (data.tenants) setTenants(data.tenants);
        else setError(data.error || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  function updateWorkspace(index: number, field: string, value: string | boolean) {
    setForm((prev) => {
      const ws = [...prev.workspaces];
      ws[index] = { ...ws[index], [field]: value };
      return { ...prev, workspaces: ws };
    });
  }

  function addWorkspace() {
    setForm((prev) => ({
      ...prev,
      workspaces: [...prev.workspaces, { type: "" as VerticalKey | "", name: "", is_primary: false }],
    }));
  }

  function removeWorkspace(index: number) {
    setForm((prev) => {
      const ws = prev.workspaces.filter((_, i) => i !== index);
      if (ws.length > 0 && !ws.some((w) => w.is_primary)) {
        ws[0].is_primary = true;
      }
      return { ...prev, workspaces: ws };
    });
  }

  function setPrimary(index: number) {
    setForm((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((w, i) => ({ ...w, is_primary: i === index })),
    }));
  }

  function openProvision() {
    if (!platformAuthed) {
      setShowPlatformLogin(true);
    } else {
      setShowProvision(true);
    }
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
        setPlatformAuthed(true);
        setPlatformEmail(data.user.email);
        setShowPlatformLogin(false);
        setShowProvision(true);
      } else {
        setPlError(data.error || "Login failed");
      }
    } catch {
      setPlError("Network error");
    }
    setPlLoading(false);
  }

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setProvisioning(true);
    setProvisionResult(null);
    try {
    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        code: form.code,
        schema: form.schema,
        workspaces: form.workspaces.map((w) => ({ type: w.type, name: w.name, is_primary: w.is_primary })),
        primary_contact_name: form.primary_contact_name || undefined,
        payment_mode: form.payment_mode,
        subscription_charges_type: form.subscription_charges_type,
        price: form.price > 0 ? form.price : undefined,
      }),
    });
      const data = await res.json();
      if (res.ok) {
        setProvisionResult({ ok: true, msg: `"${form.name}" provisioned successfully! Redirecting...` });
        setTimeout(() => router.push(`/login?tenant=${form.code}`), 1500);
      } else {
        setProvisionResult({ ok: false, msg: data.error || "Provisioning failed" });
      }
    } catch {
      setProvisionResult({ ok: false, msg: "Network error. Please try again." });
    }
    setProvisioning(false);
  }

  function getTenantVerticals(tenant: Tenant): VerticalKey[] {
    const config = tenant.config || {};
    const v = config.verticals as VerticalKey[] | undefined;
    return v && v.length > 0 ? v : ALL_VERTICAL_KEYS;
  }

  function isSuspended(tenant: Tenant): boolean {
    const config = tenant.config || {};
    return config.suspended === true;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-dark-navy)", color: "var(--color-light)" }}>
      {/* NAV */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-lg backdrop-blur-xl" : ""
        }`}
        style={scrolled
          ? { background: "rgba(11,26,46,0.92)", borderBottom: "1px solid rgba(43,174,142,0.15)" }
          : { background: "transparent" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/eHMS_logo.png" alt="eHMS" width={100} height={40} className="object-contain brightness-110" priority />
            </Link>
            <div className="flex items-center gap-3">
              {platformAuthed && (
                <span className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(212,168,83,0.1)", color: "var(--color-gold)", border: "1px solid rgba(212,168,83,0.2)" }}
                >
                  <UserCog className="w-3 h-3" /> Platform: {platformEmail}
                </span>
              )}
              <Link href="/" className="flex items-center gap-1.5 text-sm font-medium transition-colors"
                style={{ color: "rgba(245,247,250,0.6)" }}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
        <div className="absolute inset-0 animate-gradient"
          style={{ background: "linear-gradient(-45deg, #0B1A2E 0%, #0F2438 25%, #1A3C5E 50%, #0B1A2E 75%, #0F2438 100%)", backgroundSize: "400% 400%" }}
        />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full animate-pulse-glow pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(43,174,142,0.1) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-5 border"
            style={{ background: "rgba(43,174,142,0.1)", borderColor: "rgba(43,174,142,0.25)", color: "#2BAE8E" }}>
            <Database className="w-3.5 h-3.5" /> Multi-Tenant Shard Selection
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Choose Your <span style={{ color: "#2BAE8E" }}>Organization</span>
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(245,247,250,0.6)" }}>
            Each organization runs on an isolated platform shard with its own data,
            users, and subscribed features. Select yours below.
          </p>
        </div>
      </section>

      {/* TENANT GRID */}
      <section className="relative z-10 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#2BAE8E" }} />
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center gap-2 py-20 text-sm" style={{ color: "#E53E3E" }}>
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {!loading && !error && tenants.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tenants.map((tenant, i) => {
                const verts = getTenantVerticals(tenant);
                const suspended = isSuspended(tenant);
                return (
                  <div key={tenant.id}
                    className={`group relative rounded-2xl p-6 transition-all duration-200 ${
                      suspended ? "opacity-50 pointer-events-none" : "hover:scale-[1.02] hover:shadow-xl"
                    }`}
                    style={{
                      background: "linear-gradient(135deg, rgba(43,174,142,0.06) 0%, rgba(26,60,94,0.12) 100%)",
                      border: `1px solid ${suspended ? "rgba(229,62,62,0.2)" : "rgba(43,174,142,0.12)"}`,
                      animation: `slide-up 0.5s ease-out ${i * 0.1}s both`,
                    }}
                  >
                    {suspended && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold"
                        style={{ background: "rgba(229,62,62,0.15)", color: "#E53E3E" }}>
                        <Ban className="w-3 h-3" /> Suspended
                      </div>
                    )}
                    {!suspended && (
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/login?tenant=${tenant.code}`}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: "rgba(43,174,142,0.15)" }}>
                            <ChevronRight className="w-4 h-4" style={{ color: "#2BAE8E" }} />
                          </div>
                        </Link>
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(43,174,142,0.12)" }}>
                      <Building2 className="w-6 h-6" style={{ color: "#2BAE8E" }} />
                    </div>
                    <h3 className="text-lg font-bold mb-1">{tenant.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                        style={{ background: "rgba(43,174,142,0.1)", color: "#2BAE8E", border: "1px solid rgba(43,174,142,0.2)" }}>
                        {tenant.code}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {verts.map((v) => {
                        const meta = VERTICAL_META[v];
                        if (!meta) return null;
                        const Icon = meta.icon;
                        return (
                          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: "rgba(43,174,142,0.08)", color: "rgba(43,174,142,0.8)", border: "1px solid rgba(43,174,142,0.12)" }}>
                            <Icon className="w-3 h-3" /> {meta.label}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-xs" style={{ color: "rgba(245,247,250,0.35)" }}>
                      Created {new Date(tenant.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                    {!suspended && (
                      <Link href={`/login?tenant=${tenant.code}`}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                        style={{ color: "#2BAE8E" }}>
                        Select Organization <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                    {!suspended && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                        style={{ background: "linear-gradient(90deg, transparent, #2BAE8E, transparent)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Platform Admin Provision */}
          <div className="mt-12 text-center">
            {platformChecking ? (
              <Loader2 className="w-5 h-5 mx-auto animate-spin" style={{ color: "#2BAE8E" }} />
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-xs font-semibold tracking-widest uppercase mb-3"
                    style={{ color: "rgba(245,247,250,0.25)" }}>
                    Platform Administration
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                    <UserCog className="w-4 h-4" style={{ color: "rgba(212,168,83,0.4)" }} />
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                  </div>
                </div>

                <button
                  onClick={openProvision}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)", color: "#FFFFFF" }}
                >
                  <Plus className="w-4 h-4" />
                  {platformAuthed ? "Provision New Shard" : "Platform Admin — Sign In to Provision"}
                </button>
                <p className="mt-2 text-xs" style={{ color: "rgba(245,247,250,0.35)" }}>
                  {platformAuthed
                    ? "Creates an isolated PostgreSQL schema with selected platform features."
                    : "Authenticate as eHMS platform superadmin to create and manage tenant shards."}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* PLATFORM LOGIN MODAL */}
      {showPlatformLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="relative w-full max-w-sm rounded-2xl p-8 animate-slide-up"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(212,168,83,0.15)" }}>
            <button onClick={() => setShowPlatformLogin(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(245,247,250,0.4)" }}>
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(212,168,83,0.12)" }}>
                <UserCog className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Platform Admin</h3>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2"
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

      {/* PROVISION MODAL */}
      {showProvision && platformAuthed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="relative w-full max-w-md rounded-2xl p-8 animate-slide-up"
            style={{ background: "var(--color-bg-surface)", border: "1px solid rgba(43,174,142,0.15)" }}>
            <button onClick={() => { setShowProvision(false); setProvisionResult(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(245,247,250,0.4)" }}>
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(43,174,142,0.12)" }}>
                <Globe className="w-5 h-5" style={{ color: "#2BAE8E" }} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Provision New Shard</h3>
                <p className="text-xs" style={{ color: "rgba(245,247,250,0.5)" }}>
                  Platform admin &middot; {platformEmail}
                </p>
              </div>
            </div>

            <form onSubmit={handleProvision} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <input type="text" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Organization Name" className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                style={{ borderColor: "rgba(43,174,142,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }} />

              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={form.code} required onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="Code (e.g. ABC)" className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors font-mono uppercase"
                  style={{ borderColor: "rgba(43,174,142,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }} />
                <input type="text" value={form.schema} required onChange={(e) => setForm({ ...form, schema: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                  placeholder="Schema (e.g. abc)" className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors font-mono"
                  style={{ borderColor: "rgba(43,174,142,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(245,247,250,0.7)" }}>
                  <User className="w-3.5 h-3.5 inline mr-1" /> Primary Contact Name
                </label>
                <input type="text" value={form.primary_contact_name} onChange={(e) => setForm({ ...form, primary_contact_name: e.target.value })}
                  placeholder="e.g. John Doe" className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  style={{ borderColor: "rgba(43,174,142,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: "rgba(245,247,250,0.7)" }}>
                    Workspaces
                  </label>
                  <button type="button" onClick={addWorkspace}
                    className="text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded transition-colors"
                    style={{ color: "#2BAE8E" }}>
                    <Plus className="w-3 h-3" /> Add Workspace
                  </button>
                </div>
                {form.workspaces.map((ws, idx) => (
                  <div key={idx} className="flex items-start gap-2 mb-2 p-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex-1 space-y-2">
                      <select value={ws.type} required
                        onChange={(e) => updateWorkspace(idx, "type", e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none transition-colors"
                        style={{ borderColor: "rgba(43,174,142,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }}>
                        <option value="" disabled>Select type</option>
                        {ALL_VERTICAL_KEYS.map((vk) => (
                          <option key={vk} value={vk}>{VERTICAL_META[vk].label}</option>
                        ))}
                      </select>
                      <input type="text" value={ws.name} required
                        onChange={(e) => updateWorkspace(idx, "name", e.target.value)}
                        placeholder="Workspace name" className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none transition-colors"
                        style={{ borderColor: "rgba(43,174,142,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }} />
                    </div>
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button type="button" onClick={() => setPrimary(idx)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${ws.is_primary ? "border-[#2BAE8E]" : "border-gray-500"}`}>
                        {ws.is_primary && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#2BAE8E" }} />}
                      </button>
                      <span className="text-[9px] font-medium" style={{ color: "rgba(245,247,250,0.4)" }}>Primary</span>
                      {form.workspaces.length > 1 && (
                        <button type="button" onClick={() => removeWorkspace(idx)}
                          className="p-1 rounded transition-colors hover:bg-red-500/10"
                          style={{ color: "#E53E3E" }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "rgba(245,247,250,0.7)" }}>
                    <CreditCard className="w-3 h-3 inline mr-1" /> Payment
                  </label>
                  <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none transition-colors"
                    style={{ borderColor: "rgba(43,174,142,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "rgba(245,247,250,0.7)" }}>
                    <DollarSign className="w-3 h-3 inline mr-1" /> Charges
                  </label>
                  <select value={form.subscription_charges_type} onChange={(e) => setForm({ ...form, subscription_charges_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none transition-colors"
                    style={{ borderColor: "rgba(43,174,142,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }}>
                    <option value="Free">Free</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Per-User">Per-User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "rgba(245,247,250,0.7)" }}>
                    Price (₹)
                  </label>
                  <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none transition-colors"
                    style={{ borderColor: "rgba(43,174,142,0.2)", background: "rgba(11,26,46,0.5)", color: "var(--color-light)" }} />
                </div>
              </div>

              {provisionResult && (
                <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
                  style={{ background: provisionResult.ok ? "rgba(43,174,142,0.1)" : "rgba(229,62,62,0.08)", color: provisionResult.ok ? "#2BAE8E" : "#E53E3E", border: `1px solid ${provisionResult.ok ? "rgba(43,174,142,0.2)" : "rgba(229,62,62,0.2)"}` }}>
                  {provisionResult.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {provisionResult.msg}
                </div>
              )}

              <button type="submit" disabled={provisioning || form.workspaces.length === 0 || form.workspaces.some((w) => !w.type || !w.name)}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)" }}>
                {provisioning ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning...</> : <><Globe className="w-4 h-4" /> Create Tenant Shard</>}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="relative z-10 border-t py-6"
        style={{ borderColor: "rgba(43,174,142,0.08)", color: "rgba(245,247,250,0.3)" }}>
        <div className="max-w-5xl mx-auto px-4 text-center text-xs">
          &copy; {new Date().getFullYear()} eHMS &mdash; Enterprise Hospitality Management System
        </div>
      </footer>
    </div>
  );
}
