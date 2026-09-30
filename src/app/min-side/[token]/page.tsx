import type { Metadata } from "next";

import MinSideClient from "@/components/min-side/MinSideClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Min side | ArbeidMatch" },
  description: "Firmaets opplysninger, kontaktpersoner, prosjektvarsler, tilbud og signerte dokumenter hos ArbeidMatch.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

/**
 * A client's own page, opened by the key their login link gave them. In
 * Norwegian; never indexed; the address is not sent on when they follow a link.
 */
export default async function MinSidePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let decoded = String(token ?? "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* keep it as it came; the route answers 404 for a malformed token */
  }
  return <MinSideClient token={decoded.trim()} />;
}
