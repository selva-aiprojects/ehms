"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Building2, Hotel, Home, Briefcase, ChevronRight,
  Shield, Users, LayoutDashboard, BarChart3, Key,
  Globe, Server, Database, ArrowUpRight, Menu, X,
  GraduationCap, Sparkles, ChevronDown, CheckCircle, Download, Smartphone
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const observeRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => ({ ...prev, [el.dataset.section || ""]: true }));
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
  }, []);

  const linkClass = (delay: string) =>
    `opacity-0 animate-slide-up ${visibleSections["hero"] ? delay : "animation-delay-500"}`;

  return (
    <div className="landing-page min-h-screen" style={{ background: "var(--color-dark-navy)", color: "var(--color-on-dark)" }}>
      {/* ─── NAV ─── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-lg backdrop-blur-xl" : ""
        }`}
        style={scrolled ? { background: "rgba(var(--color-dark-navy-rgb),0.96)", borderBottom: "1px solid rgba(var(--color-gold-rgb),0.25)" } : { background: "transparent" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/hostsphere-logo.png" alt="HostSphere" width={220} height={52} className="object-contain" priority />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {["Product", "Platform", "Verticals", "About"].map(item => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium transition-colors duration-200 hover:opacity-100"
                  style={{ color: "rgba(var(--color-on-dark-rgb),0.7)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--color-primary)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(var(--color-on-dark-rgb),0.7)"}
                >
                  {item}
                </Link>
              ))}
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg"
                style={{ background: "var(--hs-secondary-gold)", color: "var(--hs-primary-navy)" }}
              >
                Sign In <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg"
              style={{ color: "rgba(var(--color-on-dark-rgb),0.7)" }}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            className="md:hidden px-4 pb-6 pt-2 space-y-3 animate-slide-up"
            style={{ background: "rgba(var(--color-dark-navy-rgb),0.98)", borderTop: "1px solid rgba(var(--color-primary-rgb),0.15)" }}
          >
            {["Product", "Platform", "Verticals", "About"].map(item => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium transition-colors"
                style={{ color: "rgba(var(--color-on-dark-rgb),0.7)" }}
              >
                {item}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "var(--hs-secondary-gold)", color: "var(--hs-primary-navy)" }}
            >
              Sign In <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section
        data-section="hero"
        ref={observeRef}
        className="relative min-h-screen flex items-center overflow-hidden"
      >
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background: "linear-gradient(-45deg, var(--color-dark-navy) 0%, var(--color-bg-surface) 25%, var(--color-dark-navy) 50%, var(--color-dark-navy) 75%, var(--color-bg-surface) 100%)",
            backgroundSize: "400% 400%",
          }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full animate-pulse-glow pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(var(--color-gold-rgb),0.16) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full animate-pulse-glow pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(var(--color-gold-rgb),0.08) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-6 border animate-slide-up ${visibleSections["hero"] ? "animation-delay-100" : ""}`}
                style={{ background: "rgba(var(--color-primary-rgb),0.1)", borderColor: "rgba(var(--color-primary-rgb),0.25)", color: "var(--color-primary)" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                SaaS Model Platform
              </div>

              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 opacity-0 animate-slide-up ${visibleSections["hero"] ? "animation-delay-200" : ""}`}>
                <span style={{ color: "var(--color-on-dark)" }}>Elevated hospitality,<br/>powered by </span>
                <span style={{ color: "var(--color-gold-light)" }}>HostSphere</span>
              </h1>

              <p className={`text-lg sm:text-xl mb-8 max-w-xl leading-relaxed opacity-0 animate-slide-up ${visibleSections["hero"] ? "animation-delay-300" : ""}`}
                style={{ color: "rgba(var(--color-on-dark-rgb),0.6)" }}
              >
                A unified SaaS platform powering hotels, serviced apartments,
                rental properties, and workplace management — with dedicated,
                isolated architecture for enterprise-grade security.
              </p>

              <div className={`flex flex-wrap gap-4 opacity-0 animate-slide-up ${visibleSections["hero"] ? "animation-delay-400" : ""}`}>
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{ background: "var(--hs-secondary-gold)", color: "var(--hs-primary-navy)" }}
                >
                  Get Started <ChevronRight className="w-4 h-4" />
                </Link>
                <a
                  href="/apk/ehms-mobile.apk"
                  download
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
                  style={{ border: "1px solid rgba(var(--color-primary-rgb),0.3)", color: "rgba(var(--color-on-dark-rgb),0.8)" }}
                >
                  <Download className="w-4 h-4" /> Download App
                </a>
              </div>
            </div>

            <div className={`hidden lg:flex justify-center opacity-0 animate-scale-in ${visibleSections["hero"] ? "animation-delay-300" : ""}`}>
              <div
                className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(var(--color-primary-rgb),0.08) 0%, rgba(var(--color-navy-rgb),0.15) 100%)",
                  border: "1px solid rgba(var(--color-primary-rgb),0.12)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <div className="p-8 flex flex-col justify-center h-full">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold mb-2" style={{ color: "var(--color-gold-light)" }}>HostSphere</div>
                    <div className="text-xs tracking-widest uppercase" style={{ color: "rgba(var(--color-on-dark-rgb),0.4)" }}>
                      SaaS Model Platform
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Organizations Onboarded", value: "1+" },
                      { label: "Verticals", value: "4" },
                      { label: "Tables per Organization", value: "136" },
                      { label: "API Routes", value: "100+" },
                    ].map((s) => (
                      <div key={s.label} className="flex justify-between items-center px-4 py-2 rounded-lg"
                        style={{ background: "rgba(var(--color-on-dark-rgb),0.03)" }}
                      >
                        <span className="text-xs" style={{ color: "rgba(var(--color-on-dark-rgb),0.5)" }}>{s.label}</span>
                        <span className="text-sm font-bold" style={{ color: "var(--color-gold)" }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 inset-x-0 flex justify-center opacity-0 animate-fade-in"
          style={{ animationDelay: "1.5s", animationFillMode: "forwards" }}>
          <div className="w-6 h-10 rounded-full border-2 flex justify-center pt-2"
            style={{ borderColor: "rgba(var(--color-primary-rgb),0.3)" }}>
            <div className="w-1 h-2 rounded-full animate-bounce" style={{ background: "var(--color-primary)" }} />
          </div>
        </div>
      </section>

      {/* ─── TRUSTED BY ─── */}
      <section data-section="trusted" ref={observeRef} className="py-16 lg:py-20"
        style={{ background: "rgba(var(--color-navy-rgb),0.5)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-8"
            style={{ color: "rgba(var(--color-on-dark-rgb),0.3)" }}
          >
            Trusted By Leading Hospitality Groups
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            {[
              { name: "Viswa Group of Estates", code: "VISWA", vert: "All 4 Verticals" },
              { name: "GRT Group (Coming Soon)", code: "GRT", vert: "Hotels & Resorts" },
              { name: "Raintree (Coming Soon)", code: "RAINTREE", vert: "Hotels, Apartments" },
              { name: "DLF (Coming Soon)", code: "DLF", vert: "Rental, Workplace" },
            ].map((t) => (
              <div key={t.code} className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all hover:scale-105"
                style={{
                  background: "rgba(var(--color-on-dark-rgb),0.03)",
                  border: "1px solid rgba(var(--color-on-dark-rgb),0.06)",
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(var(--color-primary-rgb),0.1)" }}
                >
                  <Building2 className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold" style={{ color: "var(--color-on-dark)" }}>{t.name}</div>
                  <div className="text-xs" style={{ color: "rgba(var(--color-on-dark-rgb),0.35)" }}>
                    <span className="font-mono" style={{ color: "var(--color-gold)" }}>{t.code}</span> &middot; {t.vert}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section data-section="stats" ref={observeRef} className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "4+", label: "Business Verticals", icon: LayoutDashboard },
              { value: "136+", label: "Database Tables / Tenant", icon: Database },
              { value: "100+", label: "API Endpoints", icon: Server },
              { value: "99.9%", label: "Platform Uptime", icon: Shield },
            ].map((stat, i) => (
              <div key={stat.label}
                className={`text-center opacity-0 animate-slide-up ${visibleSections["stats"] ? `animation-delay-${(i + 1) * 100}` : ""}`}
              >
                <stat.icon className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--color-primary)" }} />
                <div className="text-3xl lg:text-4xl font-bold mb-1" style={{ color: "var(--color-on-dark)" }}>{stat.value}</div>
                <div className="text-sm" style={{ color: "rgba(var(--color-on-dark-rgb),0.5)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT ─── */}
      <section id="product" data-section="product" ref={observeRef} className="py-20 lg:py-28"
        style={{ background: "rgba(var(--color-navy-rgb),0.3)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 border opacity-0 animate-slide-up ${visibleSections["product"] ? "animation-delay-100" : ""}`}
              style={{ background: "rgba(var(--color-gold-rgb),0.12)", borderColor: "rgba(var(--color-gold-rgb),0.28)", color: "var(--hs-secondary-gold)" }}>
              <Sparkles className="w-3.5 h-3.5" /> Powered by HostSphere
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 opacity-0 animate-slide-up ${visibleSections["product"] ? "animation-delay-200" : ""}`}
              style={{ color: "var(--color-on-dark)" }}>
              One Platform.{" "}
              <span style={{ color: "var(--color-primary)" }}>Every Vertical.</span>
            </h2>
            <p className={`text-lg opacity-0 animate-slide-up ${visibleSections["product"] ? "animation-delay-300" : ""}`}
              style={{ color: "rgba(var(--color-on-dark-rgb),0.55)" }}>
              From luxury hotels to coworking spaces — HostSphere unifies operations across
              all hospitality verticals with a single, secure, isolated architecture.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Hotel, title: "Hotels & Resorts", desc: "Star-rated hotel management with room inventory, OTA channel sync, front desk operations, and revenue optimization." },
              { icon: Building2, title: "Serviced Apartments", desc: "Extended-stay apartment management with housekeeping, amenity tracking, and corporate guest workflows." },
              { icon: Home, title: "Apartment Rental", desc: "Long-term lease management with tenant onboarding, rent collection, deposit ledger, and maintenance coordination." },
              { icon: Briefcase, title: "Workplace Services", desc: "Coworking and managed office space with desk bookings, membership plans, visitor management, and access control." },
            ].map((v, i) => (
              <div key={v.title}
                className={`group p-6 rounded-2xl transition-all duration-300 hover:scale-[1.03] opacity-0 animate-slide-up ${visibleSections["product"] ? `animation-delay-${(i + 1) * 100 + 200}` : ""}`}
                style={{ background: "rgba(var(--color-on-dark-rgb),0.03)", border: "1px solid rgba(var(--color-on-dark-rgb),0.06)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300"
                  style={{ background: "rgba(var(--color-primary-rgb),0.1)" }}>
                  <v.icon className="w-6 h-6" style={{ color: "var(--color-primary)" }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-on-dark)" }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(var(--color-on-dark-rgb),0.5)" }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLATFORM (SaaS Model Architecture) ─── */}
      <section id="platform" data-section="platform" ref={observeRef} className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-4 border opacity-0 animate-slide-up ${visibleSections["platform"] ? "animation-delay-100" : ""}`}
                style={{ background: "rgba(var(--color-gold-rgb),0.1)", borderColor: "rgba(var(--color-gold-rgb),0.25)", color: "var(--color-gold)" }}>
                <Shield className="w-3.5 h-3.5" /> SaaS Model by Design
              </div>

              <h2 className={`text-3xl sm:text-4xl font-bold mb-4 opacity-0 animate-slide-up ${visibleSections["platform"] ? "animation-delay-200" : ""}`}
                style={{ color: "var(--color-on-dark)" }}>
                Schema-Isolated{" "}
                <span style={{ color: "var(--color-gold)" }}>Organization Architecture</span>
              </h2>

              <p className={`text-base leading-relaxed mb-8 opacity-0 animate-slide-up ${visibleSections["platform"] ? "animation-delay-300" : ""}`}
                style={{ color: "rgba(var(--color-on-dark-rgb),0.55)" }}>
                Every organization gets its own dedicated PostgreSQL schema — complete data isolation
                without the operational overhead of separate databases. Each organization also
                picks which verticals to subscribe to, paying only for what they use.
              </p>

              <div className={`space-y-4 opacity-0 animate-slide-up ${visibleSections["platform"] ? "animation-delay-400" : ""}`}>
                {[
                  { icon: Shield, title: "Complete Data Isolation", desc: "Each organization operates in a dedicated, isolated PostgreSQL schema with its own tables, indexes, and sequences." },
                  { icon: Server, title: "Single Database, Infinite Organizations", desc: "All organizations connect to one managed database. New organizations are provisioned in seconds via schema cloning." },
                  { icon: Key, title: "Per-Organization Feature Selection", desc: "Organizations subscribe only to the verticals they need — Hotels, Apartments, Rental, Workplace, or any combination." },
                  { icon: Globe, title: "Lifecycle Management", desc: "Provision, suspend, or remove organizations independently. Suspended organizations block all access while preserving data." },
                ].map((f, i) => (
                  <div key={f.title} className="flex gap-4 p-4 rounded-xl"
                    style={{ background: "rgba(var(--color-on-dark-rgb),0.02)", border: "1px solid rgba(var(--color-on-dark-rgb),0.04)" }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(var(--color-gold-rgb),0.1)" }}>
                      <f.icon className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
                    </div>
                    <div>
                      <div className="font-medium text-sm mb-0.5" style={{ color: "var(--color-on-dark)" }}>{f.title}</div>
                      <div className="text-xs leading-relaxed" style={{ color: "rgba(var(--color-on-dark-rgb),0.45)" }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`hidden lg:block opacity-0 animate-slide-left ${visibleSections["platform"] ? "animation-delay-300" : ""}`}>
              <div className="rounded-2xl p-6 font-mono text-xs leading-relaxed"
                style={{ background: "rgba(var(--color-dark-navy-rgb),0.8)", border: "1px solid rgba(var(--color-primary-rgb),0.1)" }}
              >
                <div style={{ color: "rgba(var(--color-on-dark-rgb),0.3)" }}>── organization architecture ──</div>
                <br/>
                <span style={{ color: "var(--color-gold)" }}>PostgreSQL</span> Cluster<br/>
                ├── <span style={{ color: "var(--color-primary)" }}>public</span> schema<br/>
                │   ├── tenants &nbsp;&nbsp;<span style={{ color: "rgba(var(--color-on-dark-rgb),0.3)" }}>← registry + config</span><br/>
                │   └── extensions<br/>
                │<br/>
                ├── <span style={{ color: "var(--color-primary-dark)" }}>viswa</span> schema &nbsp;&nbsp;<span style={{ color: "rgba(var(--color-on-dark-rgb),0.3)" }}>← Viswa Group — all 4 verticals</span><br/>
                │<br/>
                ├── <span style={{ color: "rgba(var(--color-on-dark-rgb),0.3)" }}>grt</span> schema &nbsp;&nbsp;<span style={{ color: "rgba(var(--color-on-dark-rgb),0.2)" }}>← GRT — Hotels only</span><br/>
                │<br/>
                ├── <span style={{ color: "rgba(var(--color-on-dark-rgb),0.3)" }}>raintree</span> schema &nbsp;&nbsp;<span style={{ color: "rgba(var(--color-on-dark-rgb),0.2)" }}>← Raintree — Hotels, Apartments</span><br/>
                │<br/>
                └── <span style={{ color: "rgba(var(--color-on-dark-rgb),0.3)" }}>dlf</span> schema &nbsp;&nbsp;<span style={{ color: "rgba(var(--color-on-dark-rgb),0.2)" }}>← DLF — Rental, Workplace</span><br/>
                <br/>
                <span style={{ color: "var(--color-gold)" }}>$</span> <span style={{ color: "var(--color-on-dark)" }}>SELECT provision_tenant_schema('ABC Corp', 'ABC', 'abc');</span><br/>
                <span style={{ color: "rgba(var(--color-on-dark-rgb),0.3)" }}>  → New schema cloned from viswa template</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VERTICALS ─── */}
      <section id="verticals" data-section="verticals" ref={observeRef} className="py-20 lg:py-28"
        style={{ background: "rgba(var(--color-navy-rgb),0.3)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 opacity-0 animate-slide-up ${visibleSections["verticals"] ? "animation-delay-100" : ""}`}
              style={{ color: "var(--color-on-dark)" }}>
              Everything You Need to{" "}
              <span style={{ color: "var(--color-primary)" }}>Run Hospitality</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, title: "Front Desk", desc: "Check-in/out, room matrix, guest messaging, billing" },
              { icon: GraduationCap, title: "Housekeeping", desc: "Task workflows, linen tracking, quality inspections" },
              { icon: BarChart3, title: "Maintenance", desc: "Ticket lifecycle, AMC, assets, parts inventory" },
              { icon: Building2, title: "HR & Payroll", desc: "Attendance, shifts, leaves, payroll, compliance" },
              { icon: Database, title: "Finance & GL", desc: "Chart of accounts, journal, ledger, AP/AR, reports" },
              { icon: Shield, title: "Vendor Management", desc: "Procurement, POs, service contracts, performance" },
              { icon: Globe, title: "Channel Management", desc: "OTA sync, rate plans, inventory calendar" },
              { icon: Users, title: "Guest CRM", desc: "Profiles, preferences, loyalty, KYC" },
              { icon: LayoutDashboard, title: "Admin Suite", desc: "User roles, audit trail, backup, system settings" },
            ].map((f, i) => (
              <div key={f.title}
                className={`p-5 rounded-xl transition-all duration-200 hover:scale-[1.02] opacity-0 animate-slide-up ${visibleSections["verticals"] ? `animation-delay-${(i % 6 + 1) * 100}` : ""}`}
                style={{ background: "rgba(var(--color-on-dark-rgb),0.02)", border: "1px solid rgba(var(--color-on-dark-rgb),0.05)" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <f.icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--color-on-dark)" }}>{f.title}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(var(--color-on-dark-rgb),0.45)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background: "linear-gradient(-45deg, rgba(var(--color-primary-rgb),0.05) 0%, rgba(var(--color-navy-rgb),0.1) 50%, rgba(var(--color-primary-rgb),0.05) 100%)",
            backgroundSize: "400% 400%",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--color-on-dark)" }}>
            Ready to Transform Your{" "}
            <span style={{ color: "var(--color-primary)" }}>Hospitality Operations</span>?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: "rgba(var(--color-on-dark-rgb),0.55)" }}>
            Join forward-thinking hospitality groups already running on HostSphere.
            Experience enterprise-grade multi-tenant hospitality management with
            per-tenant feature selection.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{ background: "var(--hs-secondary-gold)", color: "var(--hs-primary-navy)" }}
            >
              Get Started <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="/apk/ehms-mobile.apk"
              download
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
              style={{ border: "1px solid rgba(var(--color-gold-rgb),0.4)", color: "var(--color-gold)" }}
            >
              <Smartphone className="w-4 h-4" /> Download Mobile App
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: "rgba(var(--color-dark-navy-rgb),0.8)", borderTop: "1px solid rgba(var(--color-on-dark-rgb),0.05)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <Image src="/hostsphere-logo.png" alt="HostSphere" width={220} height={52} className="object-contain mb-4" />
              <p className="text-xs leading-relaxed" style={{ color: "rgba(var(--color-on-dark-rgb),0.35)" }}>
                HostSphere hospitality management — powering multi-vertical,
                multi-tenant hospitality operations worldwide.
              </p>
            </div>
            {[
              { title: "Product", links: ["Platform", "Verticals", "Pricing", "Integrations"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "Compliance"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--color-on-dark)" }}>{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <Link href="#" className="text-xs transition-colors"
                        style={{ color: "rgba(var(--color-on-dark-rgb),0.35)" }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--color-primary)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(var(--color-on-dark-rgb),0.35)"}>
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 text-center text-xs" style={{ borderTop: "1px solid rgba(var(--color-on-dark-rgb),0.05)", color: "rgba(var(--color-on-dark-rgb),0.25)" }}>
            &copy; {new Date().getFullYear()} HostSphere — Luxury Hospitality Management. All rights reserved.
            <span className="mx-2">·</span>
            Multi-Tenant v2.0
            <span className="mx-2">·</span>
            Schema-Per-Tenant Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
