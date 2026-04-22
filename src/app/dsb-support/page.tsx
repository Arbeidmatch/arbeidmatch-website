import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

/** Public DSB guide content lives on /electricians-norway#dsb-authorization-guide */
export default function DsbSupportPage() {
  permanentRedirect("/electricians-norway?section=dsb");
}
