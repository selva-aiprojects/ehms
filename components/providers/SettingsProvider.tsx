"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useSystemSettings } from "@/lib/hooks";

interface Settings {
  company_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  currency_symbol: string;
  timezone: string;
}

const defaultSettings: Settings = {
  company_name: "HostSphere",
  logo_url: "/hostsphere-logo.png",
  primary_color: "var(--color-gold)",
  secondary_color: "var(--color-navy)",
  currency_symbol: "₹",
  timezone: "Asia/Kolkata"
};

const SettingsContext = createContext<{ settings: Settings; isLoading: boolean }>({
  settings: defaultSettings,
  isLoading: true,
});

export const useGlobalSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { settings, isLoading } = useSystemSettings();
  const [activeSettings, setActiveSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    if (settings) {
      setActiveSettings(settings);
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings: activeSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}
