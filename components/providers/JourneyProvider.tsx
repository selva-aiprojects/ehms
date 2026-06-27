"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export type VerticalJourney = "all" | "hotels" | "apartments" | "rental" | "workplace";

const ALL_JOURNEYS: VerticalJourney[] = ["hotels", "apartments", "rental", "workplace"];

interface JourneyContextType {
  activeJourney: VerticalJourney;
  setJourney: (journey: VerticalJourney) => void;
  allowedJourneys: VerticalJourney[];
}

const JourneyContext = createContext<JourneyContextType>({
  activeJourney: "all",
  setJourney: () => {},
  allowedJourneys: ALL_JOURNEYS,
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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("ehms_active_journey") as VerticalJourney;
    if (saved) setActiveJourney(saved);
    setAllowedJourneys(getAllowedJourneys());
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

    if (pathname.startsWith("/login")) return;

    if (pathname !== "/") {
      if (journey !== "all") {
        router.push(`/dashboard/${journey}`);
      } else {
        router.push(`/dashboard`);
      }
    }
  };

  useEffect(() => {
    if (pathname === "/dashboard/hotels") setActiveJourney("hotels");
    else if (pathname === "/dashboard/apartments") setActiveJourney("apartments");
    else if (pathname === "/dashboard/rental") setActiveJourney("rental");
    else if (pathname === "/dashboard/workplace") setActiveJourney("workplace");
  }, [pathname]);

  return (
    <JourneyContext.Provider value={{ activeJourney, setJourney, allowedJourneys }}>
      {children}
    </JourneyContext.Provider>
  );
}
