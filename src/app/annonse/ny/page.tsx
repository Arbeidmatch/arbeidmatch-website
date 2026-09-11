import type { Metadata } from "next";

import NewAdvertClient, { type AdvertPrefill } from "@/components/job-ads/NewAdvertClient";
import { pageShellClass } from "@/components/job-ads/ui";

export const metadata: Metadata = {
  title: "Publiser stillingsannonse | ArbeidMatch",
  description:
    "Skriv stillingsannonsen deres, vi kontrollerer den før dere betaler, og den publiseres på arbeidmatch.no. Betal med kort eller faktura.",
  alternates: { canonical: "/annonse/ny" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const PREFILL_KEYS = ["company", "org", "name", "email", "phone", "industry", "title", "city"] as const;

/**
 * A new paid advert. The request wizard links here with what the client already
 * told us (?company=&org=&name=&email=&phone=&industry=&title=&city=), so they
 * do not type it twice.
 */
export default async function NewAdvertPage({ searchParams }: Props) {
  const sp = await searchParams;
  const prefill: AdvertPrefill = {};
  for (const key of PREFILL_KEYS) {
    const v = sp[key];
    const value = Array.isArray(v) ? v[0] : v;
    if (typeof value === "string" && value.trim()) prefill[key] = value.trim().slice(0, 200);
  }
  return (
    <div className={pageShellClass}>
      <NewAdvertClient prefill={prefill} />
    </div>
  );
}
