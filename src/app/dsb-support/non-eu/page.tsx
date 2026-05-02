import type { Metadata } from "next";
import { DsbGuidePage } from "@/components/dsb/DsbGuidePage";

const canonical = "https://www.arbeidmatch.no/dsb-support/non-eu";

export const metadata: Metadata = {
  title: { absolute: "DSB Authorization Guide (non-EU) | ArbeidMatch" },
  description:
    "Free guide for EU/EEA and non-EU electricians on DSB authorization in Norway. ArbeidMatch helps with the process.",
  alternates: { canonical },
  openGraph: {
    title: "DSB Authorization Guide (non-EU) | ArbeidMatch",
    description:
      "Free guide for EU/EEA and non-EU electricians on DSB authorization in Norway. ArbeidMatch helps with the process.",
    url: canonical,
    type: "website",
  },
};

export default async function DsbSupportNonEuPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <DsbGuidePage guideSlug="non-eu" token={params.token} />;
}
