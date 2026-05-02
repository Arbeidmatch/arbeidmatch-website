"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

const EXACT_ALLOW = new Set([
  "/for-candidates",
  "/contact",
  "/about",
  "/privacy",
  "/terms",
  "/dpa",
  "/for-staffing-agencies",
  "/outside-eu-eea",
]);

function pathnameShowsFooter(pathname: string): boolean {
  const p = pathname.split("?")[0] || "";

  if (p.startsWith("/request")) return false;
  if (p.startsWith("/verified")) return false;
  if (p.startsWith("/admin")) return false;
  if (p === "/download" || p.startsWith("/download/")) return false;
  if (p === "/feedback" || p.startsWith("/feedback/")) return false;
  if (p === "/become-a-partner" || p.startsWith("/become-a-partner/")) return false;
  if (p.startsWith("/dsb-")) return false;
  if (p.startsWith("/premium")) return false;

  if (p === "/") return true;
  if (EXACT_ALLOW.has(p)) return true;
  if (p.startsWith("/bemanning-")) return true;
  if (p.startsWith("/bemanningsbyrå-")) return true;

  return false;
}

export default function ConditionalFooter() {
  const pathname = usePathname() ?? "";
  if (!pathnameShowsFooter(pathname)) return null;
  return <Footer />;
}
