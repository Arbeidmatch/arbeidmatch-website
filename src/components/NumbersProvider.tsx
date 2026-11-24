"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SiteNumbers } from "@/lib/numbers";

/**
 * The RecOS numbers for client components (ORDER 302). The root layout reads
 * them once on the server (lib/numbers.ts) and hands them down here, so a
 * sheet or a helper in the browser prints the same value as the page around it.
 */
const NumbersContext = createContext<SiteNumbers>({});

export function NumbersProvider({ numbers, children }: { numbers: SiteNumbers; children: ReactNode }) {
  return <NumbersContext.Provider value={numbers}>{children}</NumbersContext.Provider>;
}

export function useSiteNumbers(): SiteNumbers {
  return useContext(NumbersContext);
}
