import type { Metadata } from "next";
import { Suspense } from "react";
import { EligibilityAssistanceClient } from "./EligibilityAssistanceClient";
import { getWorkGuidePageMetadata } from "@/lib/eligibilityGuidePageTitle";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const regionRaw = sp.region;
  const countryRaw = sp.country;
  const region = typeof regionRaw === "string" ? regionRaw : undefined;
  const country = typeof countryRaw === "string" ? countryRaw : undefined;
  const meta = getWorkGuidePageMetadata({
    targetCountry: "",
    targetRegion: "",
    urlRegion: region ?? null,
    urlCountry: country ?? null,
  });
  return {
    title: meta.title,
    description: meta.description,
  };
}

export default function EligibilityAssistancePage() {
  return (
    <Suspense
      fallback={
        <section className="bg-surface py-12">
          <div className="mx-auto w-full max-w-2xl px-4 text-sm text-text-secondary">Loading...</div>
        </section>
      }
    >
      <EligibilityAssistanceClient />
    </Suspense>
  );
}
