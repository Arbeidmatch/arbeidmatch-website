import type { Metadata } from "next";

import ProjectAlertsClient from "@/components/prosjekter/ProjectAlertsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Prosjektvarsler | ArbeidMatch" },
  description: "Bygg- og anleggsprosjekter i hele Norge, valgt for dere.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

/**
 * A client's own page of projects, opened from our letter by its token alone.
 * In Norwegian; never indexed; the source of the projects never named.
 */
export default async function ProjectAlertsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let decoded = String(token ?? "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* keep it as it came; the route answers 404 for a malformed token */
  }
  return <ProjectAlertsClient token={decoded.trim()} />;
}
