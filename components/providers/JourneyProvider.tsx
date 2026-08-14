"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export type VerticalJourney = "all" | "hotels" | "apartments" | "rental" | "workplace";

const ALL_JOURNEYS: VerticalJourney[] = ["hotels", "apartments", "rental", "workplace"];

interface JourneyContextType {
  activeJourney: VerticalJourney;
  setJourney: (journey: VerticalJourney) => void;
  allowedJourneys: VerticalJourney[];
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
}

const JourneyContext = createContext<JourneyContextType>({
  activeJourney: "all",
  setJourney: () => {},
  allowedJourneys: ALL_JOURNEYS,
  selectedPropertyId: "",
  setSelectedPropertyId: () => {},
});

export const useJourney = () => useContext(JourneyContext);

function getAllowedJourneys(): VerticalJourney[] {
  try {
    const raw = localStorage.getItem("ehms_tenant_verticals");
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      const filtered = parsed.filter((v): v is VerticalJourney =>
        ALL_JOURNEYS.includes(v as VerticalJourney)
      );
      return filtered.length > 0 ? filtered : ALL_JOURNEYS;
    }
  } catch {}
  return ALL_JOURNEYS;
}

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [activeJourney, setActiveJourney] = useState<VerticalJourney>("all");
  const [allowedJourneys, setAllowedJourneys] = useState<VerticalJourney[]>(ALL_JOURNEYS);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("ehms_active_journey") as VerticalJourney;
    if (saved) setActiveJourney(saved);
    setAllowedJourneys(getAllowedJourneys());
    const savedProp = localStorage.getItem("ehms_active_property_id") || "";
    setSelectedPropertyId(savedProp);
    // Self-heal a stale persisted property id (e.g. after a re-seed regenerated
    // property UUIDs). If the stored id no longer exists, drop it so dashboards
    // fall back to all-property data instead of returning zeros.
    if (savedProp) {
      fetch("/api/properties?include_inactive=true")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const list = data.data || data.properties || [];
          if (list.length && !list.some((p: { id: string }) => p.id === savedProp)) {
            setSelectedPropertyId("");
            localStorage.removeItem("ehms_active_property_id");
          }
        })
        .catch(() => {});
    }
  }, []);

  const syncAllowed = useCallback(() => {
    setAllowedJourneys(getAllowedJourneys());
  }, []);

  useEffect(() => {
    window.addEventListener("storage", syncAllowed);
    return () => window.removeEventListener("storage", syncAllowed);
  }, [syncAllowed]);

  const setJourney = (journey: VerticalJourney) => {
    if (journey !== "all" && !allowedJourneys.includes(journey)) return;
    setActiveJourney(journey);
    localStorage.setItem("ehms_active_journey", journey);
    
    // Clear active property when switching vertical contexts to prevent context bleed
    setSelectedPropertyId("");
    localStorage.removeItem("ehms_active_property_id");

    if (pathname.startsWith("/login")) return;

    if (pathname !== "/") {
      if (journey !== "all") {
        router.push(`/dashboard/${journey}`);
      } else {
        router.push(`/dashboard`);
      }
    }
  };

  const changeProperty = (id: string) => {
    setSelectedPropertyId(id);
    localStorage.setItem("ehms_active_property_id", id);
  };

  useEffect(() => {
    let target: VerticalJourney | null = null;
    if (pathname.startsWith("/dashboard/hotels")) target = "hotels";
    else if (pathname.startsWith("/dashboard/apartments")) target = "apartments";
    else if (pathname.startsWith("/dashboard/rental")) target = "rental";
    else if (pathname.startsWith("/dashboard/workplace")) target = "workplace";

    if (target) {
      if (allowedJourneys.includes(target)) {
        setActiveJourney(target);
      } else {
        router.push("/dashboard");
      }
    }
  }, [pathname, allowedJourneys, router]);

  return (
    <JourneyContext.Provider value={{ activeJourney, setJourney, allowedJourneys, selectedPropertyId, setSelectedPropertyId: changeProperty }}>
      {children}
    </JourneyContext.Provider>
  );
}
