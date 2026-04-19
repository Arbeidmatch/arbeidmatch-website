"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import ScrollProgressCTA from "./ScrollProgressCTA";

const ExitIntentPopup = dynamic(() => import("./ExitIntentPopup"), { ssr: false });
const StickyBottomBanner = dynamic(() => import("./StickyBottomBanner"), { ssr: false });

/**
 * Monetization / passive conversion layer (Nordic Precision UI).
 *
 * AFFILIATE / PARTNER DISCLOSURE (placeholder - hidden until partners go live):
 * When we display paid partner placements, sponsored tools, or affiliate links,
 * render a clear disclosure near those modules, e.g.:
 * "ArbeidMatch may earn a commission when you use partner links. This does not
 * affect your price. We only recommend services we believe are relevant to EU/EEA
 * workers and Norwegian employers."
 * Toggle visibility via a feature flag or env when partner content ships.
 */

export default function MonetizationOverlays() {
  const pathname = usePathname() || "";

  const exitIntentEnabled = pathname === "/for-candidates" || pathname === "/dsb-support";

  const stickyBannerEnabled = pathname !== "/dsb-support" && !pathname.startsWith("/dsb-guide");

  const scrollCtaEnabled = pathname === "/for-candidates" || pathname === "/for-employers";

  return (
    <>
      {exitIntentEnabled && <ExitIntentPopup enabled />}
      {stickyBannerEnabled && <StickyBottomBanner enabled />}
      {scrollCtaEnabled && <ScrollProgressCTA pathname={pathname} />}
    </>
  );
}
