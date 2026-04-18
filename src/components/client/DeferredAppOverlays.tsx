"use client";

import dynamic from "next/dynamic";

const ContextualHelper = dynamic(() => import("@/components/ContextualHelper"), { ssr: false, loading: () => null });
const MonetizationOverlays = dynamic(() => import("@/components/monetization/MonetizationOverlays"), {
  ssr: false,
  loading: () => null,
});

/** Below-the-fold / client-only overlays — loaded without SSR (smaller initial HTML). */
export default function DeferredAppOverlays() {
  return (
    <>
      <ContextualHelper />
      <MonetizationOverlays />
    </>
  );
}
