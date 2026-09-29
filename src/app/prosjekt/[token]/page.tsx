import type { Metadata } from "next";

import ProjectPresentationClient from "@/components/prosjekter/ProjectPresentationClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Prosjekt | ArbeidMatch" },
  description: "Et bygg- og anleggsprosjekt, presentert for dere av ArbeidMatch.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

/**
 * One project presented to one client, opened from our letter by its token
 * alone. In Norwegian; never indexed; the source of the project never named.
 */
export default async function ProjectPresentationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let decoded = String(token ?? "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* keep it as it came; the route answers 404 for a malformed token */
  }
  return <ProjectPresentationClient token={decoded.trim()} />;
}
