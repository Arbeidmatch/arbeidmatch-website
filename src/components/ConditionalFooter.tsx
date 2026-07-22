"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

const EXACT_ALLOW = new Set([
  "/",
  "/for-candidates",
  "/contact",
  "/about",
  "/blog",
  "/recruiter-network",
  "/privacy",
  "/terms",
  "/dpa",
  "/bemanning-helse",
]);

function pathnameShowsFooter(pathname: string): boolean {
  const p = pathname.split("?")[0] || "";

  // Employer flow pages - footer completely unmounted
  if (p.startsWith("/request")) return false;
  if (p.startsWith("/score")) return false;
  if (p.startsWith("/verified")) return false;
  if (p.startsWith("/apply")) return false;

  // Admin and utility pages
  if (p.startsWith("/admin")) return false;
  if (p === "/download" || p.startsWith("/download/")) return false;
  if (p === "/feedback" || p.startsWith("/feedback/")) return false;
  if (p === "/become-a-partner" || p.startsWith("/become-a-partner/")) return false;
  if (p.startsWith("/dsb-")) return false;
  if (p.startsWith("/premium")) return false;

  // Exact allowlist pages
  if (EXACT_ALLOW.has(p)) return true;

  return false;
}

export default function ConditionalFooter() {
  const pathname = usePathname() ?? "";
  if (!pathnameShowsFooter(pathname)) return null;
  return <Footer />;
}
