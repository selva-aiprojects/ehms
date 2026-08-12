"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[PWA] Service worker registration failed");
      }
    });
  }, []);

  return null;
}
