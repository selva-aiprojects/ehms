"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface TenantBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_color: string;
  logo_url: string;
  company_name: string;
}

const DEFAULT_BRANDING: TenantBranding = {
  primary_color: "#2BAE8E",
  secondary_color: "#1A3C5E",
  accent_color: "#D4A853",
  sidebar_color: "#2C3547",
  logo_url: "/eHMS_logo.png",
  company_name: "eHMS",
};

interface TenantThemeContextType {
  branding: TenantBranding;
  loading: boolean;
  refresh: () => Promise<void>;
}

const TenantThemeContext = createContext<TenantThemeContextType>({
  branding: DEFAULT_BRANDING,
  loading: true,
  refresh: async () => {},
});

export function useTenantTheme() {
  return useContext(TenantThemeContext);
}

function applyVariables(b: TenantBranding) {
  const root = document.documentElement;
  root.style.setProperty("--tenant-primary", b.primary_color);
  root.style.setProperty("--tenant-primary-dark", darken(b.primary_color, 0.1));
  root.style.setProperty("--tenant-secondary", b.secondary_color);
  root.style.setProperty("--tenant-accent", b.accent_color);
  root.style.setProperty("--tenant-sidebar", b.sidebar_color);
  root.style.setProperty("--tenant-sidebar-hover", hexToRgba(b.sidebar_color, 0.15));
  root.style.setProperty("--tenant-sidebar-active", b.primary_color);
  root.style.setProperty("--color-primary", b.primary_color);
  root.style.setProperty("--color-primary-dark", darken(b.primary_color, 0.1));
  root.style.setProperty("--color-sidebar", b.sidebar_color);
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.min(255, (num & 255) * (1 - amount)));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    try {
      const res = await fetch("/api/tenant/branding");
      if (!res.ok) {
        if (res.status === 401 || res.status === 400) {
          setLoading(false);
          return;
        }
        throw new Error("Failed to load");
      }
      const data = await res.json();
      if (data.branding) {
        const b: TenantBranding = { ...DEFAULT_BRANDING, ...data.branding };
        setBranding(b);
        applyVariables(b);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  return (
    <TenantThemeContext.Provider value={{ branding, loading, refresh: fetchBranding }}>
      {children}
    </TenantThemeContext.Provider>
  );
}
