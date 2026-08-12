"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const ContextualHelper = dynamic(() => import("@/components/ContextualHelper"), { ssr: false, loading: () => null });
const MonetizationOverlays = dynamic(() => import("@/components/monetization/MonetizationOverlays"), {
  ssr: false,
  loading: () => null,
});

/** Below-the-fold / client-only overlays - loaded without SSR (smaller initial HTML). */
export default function DeferredAppOverlays() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/flislegger")) return null;

  return (
    <>
      <ContextualHelper />
      <MonetizationOverlays />
    </>
  );
}
