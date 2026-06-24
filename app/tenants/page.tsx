"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, Database, Shield, ArrowRight, Server,
  Plus, Globe, ChevronRight, X, Loader2, CheckCircle,
  AlertCircle, Sparkles, ArrowLeft
} from "lucide-react";
import { useState, useEffect } from "react";

interface Tenant {
  id: string;
  name: string;
  code: string;
  schema_name: string;
  logo_url: string | null;
  domain: string | null;
  contact_email: string | null;
  is_active: boolean;
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
  const [form, setForm] = useState({ name: "", code: "", schema: "" });
  const [scrolled, setScrolled] = useState(false);

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

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setProvisioning(true);
    setProvisionResult(null);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <div className="min-h-screen" style={{ background: "#0B1A2E", color: "#F5F7FA" }}>
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
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: "rgba(245,247,250,0.6)" }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background: "linear-gradient(-45deg, #0B1A2E 0%, #0F2438 25%, #1A3C5E 50%, #0B1A2E 75%, #0F2438 100%)",
            backgroundSize: "400% 400%",
          }}
        />
        <div
          className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full animate-pulse-glow pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(43,174,142,0.1) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-5 border"
            style={{ background: "rgba(43,174,142,0.1)", borderColor: "rgba(43,174,142,0.25)", color: "#2BAE8E" }}
          >
            <Database className="w-3.5 h-3.5" />
            Multi-Tenant Shard Selection
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Choose Your <span style={{ color: "#2BAE8E" }}>Workspace</span>
          </h1>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: "rgba(245,247,250,0.6)" }}
          >
            Each shard is an isolated tenant with its own database schema, users,
            and data. Select your organization below to proceed.
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
            <div className="flex items-center justify-center gap-2 py-20 text-sm"
              style={{ color: "#E53E3E" }}
            >
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {!loading && !error && tenants.length === 0 && (
            <div className="text-center py-20">
              <Server className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(245,247,250,0.2)" }} />
              <p className="text-lg font-medium mb-1">No tenants found</p>
              <p className="text-sm" style={{ color: "rgba(245,247,250,0.5)" }}>
                Provision your first shard to get started.
              </p>
            </div>
          )}

          {!loading && !error && tenants.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tenants.map((tenant, i) => (
                <Link
                  key={tenant.id}
                  href={`/login?tenant=${tenant.code}`}
                  className="group relative rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(43,174,142,0.06) 0%, rgba(26,60,94,0.12) 100%)",
                    border: "1px solid rgba(43,174,142,0.12)",
                    animation: `slide-up 0.5s ease-out ${i * 0.1}s both`,
                  }}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(43,174,142,0.15)" }}
                    >
                      <ArrowRight className="w-4 h-4" style={{ color: "#2BAE8E" }} />
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(43,174,142,0.12)" }}
                  >
                    <Building2 className="w-6 h-6" style={{ color: "#2BAE8E" }} />
                  </div>

                  <h3 className="text-lg font-bold mb-1 group-hover:opacity-90 transition-opacity">
                    {tenant.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                      style={{
                        background: "rgba(43,174,142,0.1)",
                        color: "#2BAE8E",
                        border: "1px solid rgba(43,174,142,0.2)",
                      }}
                    >
                      {tenant.code}
                    </span>
                    <span className="text-xs font-mono" style={{ color: "rgba(245,247,250,0.35)" }}>
                      schema: {tenant.schema_name}
                    </span>
                  </div>

                  <p className="text-xs" style={{ color: "rgba(245,247,250,0.4)" }}>
                    Created {new Date(tenant.created_at).toLocaleDateString("en-IN", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </p>

                  {/* Shimmer line */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                    style={{
                      background: "linear-gradient(90deg, transparent, #2BAE8E, transparent)",
                    }}
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Provision CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowProvision(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)",
                color: "#FFFFFF",
                opacity: provisioning ? 0.6 : 1,
              }}
            >
              <Plus className="w-4 h-4" />
              Provision New Shard
            </button>
            <p className="mt-2 text-xs" style={{ color: "rgba(245,247,250,0.35)" }}>
              Superadmin access required. Creates an isolated PostgreSQL schema.
            </p>
          </div>
        </div>
      </section>

      {/* PROVISION MODAL */}
      {showProvision && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl p-8 animate-slide-up"
            style={{
              background: "#0F2438",
              border: "1px solid rgba(43,174,142,0.15)",
            }}
          >
            <button
              onClick={() => { setShowProvision(false); setProvisionResult(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(245,247,250,0.4)" }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(43,174,142,0.12)" }}
              >
                <Globe className="w-5 h-5" style={{ color: "#2BAE8E" }} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Provision New Shard</h3>
                <p className="text-xs" style={{ color: "rgba(245,247,250,0.5)" }}>
                  Creates a new isolated tenant schema
                </p>
              </div>
            </div>

            <form onSubmit={handleProvision} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(245,247,250,0.7)" }}>
                  Tenant Name
                </label>
                <input
                  value={form.name} required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  style={{
                    borderColor: "rgba(43,174,142,0.2)",
                    background: "rgba(11,26,46,0.5)",
                    color: "#F5F7FA",
                  }}
                  placeholder="e.g. ABC Hospitality Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(245,247,250,0.7)" }}>
                  Tenant Code <span className="text-xs opacity-50">(uppercase, 2-11 chars)</span>
                </label>
                <input
                  value={form.code} required
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors font-mono uppercase"
                  style={{
                    borderColor: "rgba(43,174,142,0.2)",
                    background: "rgba(11,26,46,0.5)",
                    color: "#F5F7FA",
                  }}
                  placeholder="e.g. ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "rgba(245,247,250,0.7)" }}>
                  Schema Name <span className="text-xs opacity-50">(lowercase, 3-63 chars)</span>
                </label>
                <input
                  value={form.schema} required
                  onChange={(e) => setForm({ ...form, schema: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors font-mono"
                  style={{
                    borderColor: "rgba(43,174,142,0.2)",
                    background: "rgba(11,26,46,0.5)",
                    color: "#F5F7FA",
                  }}
                  placeholder="e.g. abc"
                />
              </div>

              {provisionResult && (
                <div
                  className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
                  style={{
                    background: provisionResult.ok
                      ? "rgba(43,174,142,0.1)"
                      : "rgba(229,62,62,0.08)",
                    color: provisionResult.ok ? "#2BAE8E" : "#E53E3E",
                    border: `1px solid ${provisionResult.ok ? "rgba(43,174,142,0.2)" : "rgba(229,62,62,0.2)"}`,
                  }}
                >
                  {provisionResult.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {provisionResult.msg}
                </div>
              )}

              <button
                type="submit" disabled={provisioning}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)" }}
              >
                {provisioning ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning...</>
                ) : (
                  <><Globe className="w-4 h-4" /> Create Tenant Shard</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 border-t py-6"
        style={{ borderColor: "rgba(43,174,142,0.08)", color: "rgba(245,247,250,0.3)" }}
      >
        <div className="max-w-5xl mx-auto px-4 text-center text-xs">
          &copy; {new Date().getFullYear()} eHMS &mdash; Enterprise Hospitality Management System &middot; Multi-Tenant v2.0
        </div>
      </footer>
    </div>
  );
}
