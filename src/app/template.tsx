"use client";

import PageTransition from "@/components/PageTransition";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The explorer owns its camera motion; keep identical markup with reduced motion.
  if (pathname === "/prosjekter" || pathname?.startsWith("/prosjekter/")) return <>{children}</>;
  return <PageTransition>{children}</PageTransition>;
}
