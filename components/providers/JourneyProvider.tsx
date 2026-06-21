"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export type VerticalJourney = "all" | "hotels" | "apartments" | "rental" | "workplace";

interface JourneyContextType {
  activeJourney: VerticalJourney;
  setJourney: (journey: VerticalJourney) => void;
}

const JourneyContext = createContext<JourneyContextType>({
  activeJourney: "all",
  setJourney: () => {},
});

export const useJourney = () => useContext(JourneyContext);

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [activeJourney, setActiveJourney] = useState<VerticalJourney>("all");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("ehms_active_journey") as VerticalJourney;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setActiveJourney(saved);
  }, []);

  const setJourney = (journey: VerticalJourney) => {
    setActiveJourney(journey);
    localStorage.setItem("ehms_active_journey", journey);
    
    // Auto-navigate to the specific journey dashboard if switching to a specific vertical
    // Skip redirect if we are on the login page (root path "/")
    if (pathname !== "/") {
      if (journey !== "all") {
        router.push(`/dashboard/${journey}`);
      } else {
        router.push(`/dashboard`);
      }
    }
  };

  // Sync context if user manually visits a vertical URL
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pathname === "/dashboard/hotels") setActiveJourney("hotels");
    else if (pathname === "/dashboard/apartments") setActiveJourney("apartments");
    else if (pathname === "/dashboard/rental") setActiveJourney("rental");
    else if (pathname === "/dashboard/workplace") setActiveJourney("workplace");
  }, [pathname]);

  return (
    <JourneyContext.Provider value={{ activeJourney, setJourney }}>
      {children}
    </JourneyContext.Provider>
  );
}
