import type { Metadata } from "next";

import PremiumBrowsePage from "@/components/premium/PremiumBrowsePage";

export const metadata: Metadata = {
  title: { absolute: "Browse Premium Guides | ArbeidMatch" },
  robots: { index: false, follow: false },
};

export default function PremiumBrowseRoute() {
  return <PremiumBrowsePage />;
}
