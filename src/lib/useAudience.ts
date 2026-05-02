"use client";

import { useEffect, useState } from "react";

import type { AmAudience } from "@/lib/navMoreMenu";

const STORAGE_KEY = "am_audience";

export type Audience = AmAudience;

function readFromStorage(): AmAudience | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "employer" || raw === "candidate" || raw === "browsing") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Reads `am_audience` from localStorage after hydration. Returns `null` during SSR
 * and before the first client effect (treat as permissive default in UI).
 */
export function useAudience(): AmAudience | null {
  const [hydrated, setHydrated] = useState(false);
  const [audience, setAudience] = useState<AmAudience | null>(null);

  useEffect(() => {
    setAudience(readFromStorage());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        setAudience(readFromStorage());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!hydrated) return null;
  return audience;
}
