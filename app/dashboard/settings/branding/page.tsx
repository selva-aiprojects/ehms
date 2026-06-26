"use client";

import { useState, useEffect } from "react";
import { useTenantTheme, type TenantBranding } from "@/components/providers/TenantThemeProvider";
import { Check, RotateCcw, Image, Palette, Eye, Save, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";

const COLOR_PRESETS = [
  "#2BAE8E", "#1A3C5E", "#D4A853", "#4DB88A", "#0B1A2E",
  "#E53E3E", "#F5A623", "#6366F1", "#8B5CF6", "#EC4899",
  "#06B6D4", "#10B981", "#F59E0B", "#6B7280", "#374151",
];

function isValidHex(c: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(c);
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastColor(hex: string) {
  return luminance(hex) > 0.5 ? "#1A2E44" : "#FFFFFF";
}

interface BrandingForm {
  primary_color: string;
  sidebar_color: string;
  accent_color: string;
  logo_url: string;
  company_name: string;
}

export default function BrandingSettingsPage() {
  const { branding, loading, refresh } = useTenantTheme();

  const [form, setForm] = useState<BrandingForm>({
    primary_color: branding.primary_color,
    sidebar_color: branding.sidebar_color,
    accent_color: branding.accent_color,
    logo_url: branding.logo_url,
    company_name: branding.company_name,
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewSidebar, setPreviewSidebar] = useState(false);

  useEffect(() => {
    if (!loading) {
      setForm({
        primary_color: branding.primary_color,
        sidebar_color: branding.sidebar_color,
        accent_color: branding.accent_color,
        logo_url: branding.logo_url,
        company_name: branding.company_name,
      });
    }
  }, [loading, branding]);

  const activeItemBg = `rgba(${Object.values(hexToRgb(form.primary_color)).join(", ")}, 0.15)`;

  function update<K extends keyof BrandingForm>(key: K, val: BrandingForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  }

  function applyPreview() {
    const root = document.documentElement;
    root.style.setProperty("--tenant-primary", form.primary_color);
    root.style.setProperty("--tenant-primary-dark", form.primary_color);
    root.style.setProperty("--tenant-sidebar", form.sidebar_color);
    root.style.setProperty("--tenant-sidebar-active", form.primary_color);
    root.style.setProperty("--tenant-accent", form.accent_color);
    root.style.setProperty("--color-primary", form.primary_color);
    root.style.setProperty("--color-sidebar", form.sidebar_color);
    toast.success("Preview applied", { duration: 1500 });
  }

  function resetPreview() {
    const root = document.documentElement;
    const def = branding;
    root.style.setProperty("--tenant-primary", def.primary_color);
    root.style.setProperty("--tenant-primary-dark", def.primary_color);
    root.style.setProperty("--tenant-sidebar", def.sidebar_color);
    root.style.setProperty("--tenant-sidebar-active", def.primary_color);
    root.style.setProperty("--tenant-accent", def.accent_color);
    root.style.setProperty("--color-primary", def.primary_color);
    root.style.setProperty("--color-sidebar", def.sidebar_color);
    setForm({
      primary_color: def.primary_color,
      sidebar_color: def.sidebar_color,
      accent_color: def.accent_color,
      logo_url: def.logo_url,
      company_name: def.company_name,
    });
    setDirty(false);
    toast.success("Reset to saved values");
  }

  async function handleSave() {
    if (!isValidHex(form.primary_color) || !isValidHex(form.sidebar_color) || !isValidHex(form.accent_color)) {
      toast.error("All colors must be valid hex values (e.g. #2BAE8E)");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/tenant/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      await refresh();
      setDirty(false);
      toast.success("Branding saved successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>{label}</label>
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ border: "2px solid #E2E8F0" }}>
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
            />
            <div className="w-full h-full" style={{ background: value }} />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none transition-colors"
            style={{ background: "#F5F7FA", border: "1px solid #E2E8F0", color: "#1A2E44" }}
            placeholder="#000000"
          />
          <div className="flex gap-1">
            {COLOR_PRESETS.slice(0, 5).map((c) => (
              <button
                key={c}
                onClick={() => onChange(c)}
                className="w-5 h-5 rounded-full border transition-transform hover:scale-125"
                style={{ background: c, borderColor: c === value ? "#1A2E44" : "#E2E8F0" }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#64748B" }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1A2E44" }}>Branding & Theme</h1>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          Customize the look and feel of your tenant workspace. Changes are instantly applied as a preview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brand Identity */}
          <div className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-4 h-4" style={{ color: "#2BAE8E" }} />
              <h2 className="text-base font-semibold" style={{ color: "#1A2E44" }}>Brand Identity</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => update("company_name", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                  style={{ background: "#F5F7FA", border: "1px solid #E2E8F0", color: "#1A2E44" }}
                  placeholder="Your Company"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
                  Logo URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.logo_url}
                    onChange={(e) => update("logo_url", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: "#F5F7FA", border: "1px solid #E2E8F0", color: "#1A2E44" }}
                    placeholder="/eHMS_logo.png"
                  />
                  {form.logo_url && (
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#F5F7FA", border: "1px solid #E2E8F0" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.logo_url} alt="logo preview" className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4" style={{ color: "#2BAE8E" }} />
              <h2 className="text-base font-semibold" style={{ color: "#1A2E44" }}>Color Palette</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ColorField label="Primary Accent" value={form.primary_color} onChange={(v) => update("primary_color", v)} />
              <ColorField label="Sidebar Background" value={form.sidebar_color} onChange={(v) => update("sidebar_color", v)} />
              <ColorField label="Gold / Accent" value={form.accent_color} onChange={(v) => update("accent_color", v)} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: dirty ? "#2BAE8E" : "#94A3B8" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={resetPreview}
              disabled={!dirty}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
              style={{ color: "#64748B", border: "1px solid #E2E8F0" }}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={applyPreview}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ml-auto"
              style={{ color: "#1A3C5E", border: "1px solid #E2E8F0" }}
            >
              <Eye className="w-4 h-4" />
              Apply Preview
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="rounded-xl overflow-hidden sticky top-6" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ background: "#F5F7FA", color: "#64748B", borderBottom: "1px solid #E2E8F0" }}>
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </div>
            <div style={{ background: form.sidebar_color }}>
              {/* Mini sidebar preview */}
              <div className="p-3 space-y-2">
                {/* Logo area */}
                <div className="flex items-center justify-center py-4 px-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2">
                    {form.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logo_url} alt="" className="h-8 w-auto object-contain" style={{ filter: "brightness(1.05)" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    {!form.logo_url && (
                      <span className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{form.company_name || "eHMS"}</span>
                    )}
                  </div>
                </div>
                {/* Nav items */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative" style={{ background: activeItemBg, color: "#FFFFFF", borderLeft: `3px solid ${form.primary_color}` }}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative" style={{ background: "transparent", color: "rgba(255,255,255,0.6)" }}>
                  <Users className="w-4 h-4" />
                  <span>Users</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative" style={{ background: "transparent", color: "rgba(255,255,255,0.6)" }}>
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </div>
              </div>
              {/* Bottom user area */}
              <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Shield className="w-3 h-3" style={{ color: form.primary_color }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>admin@company.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick swatches */}
          <div className="rounded-xl p-4 mt-4" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#64748B" }}>Quick Palettes</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { primary: "#2BAE8E", sidebar: "#2C3547", accent: "#D4A853", name: "eHMS Default" },
                { primary: "#6366F1", sidebar: "#1E1B4B", accent: "#F59E0B", name: "Indigo" },
                { primary: "#EC4899", sidebar: "#2D1B2E", accent: "#06B6D4", name: "Pink" },
                { primary: "#10B981", sidebar: "#064E3B", accent: "#F59E0B", name: "Emerald" },
                { primary: "#F59E0B", sidebar: "#1C1917", accent: "#EC4899", name: "Amber" },
                { primary: "#06B6D4", sidebar: "#0F172A", accent: "#F43F5E", name: "Cyan" },
              ].map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    update("primary_color", p.primary);
                    update("sidebar_color", p.sidebar);
                    update("accent_color", p.accent);
                  }}
                  className="p-2 rounded-lg transition-all hover:scale-105 text-[10px] font-medium text-center"
                  style={{ background: p.sidebar, color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
                  title={p.name}
                >
                  <div className="flex gap-0.5 justify-center mb-1">
                    <div className="w-3 h-3 rounded-sm" style={{ background: p.primary }} />
                    <div className="w-3 h-3 rounded-sm" style={{ background: p.accent }} />
                  </div>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutDashboard(props: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>; }
function Users(props: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function Settings(props: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>; }
function Shield(props: { className?: string; style?: React.CSSProperties }) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} style={props.style}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>; }
