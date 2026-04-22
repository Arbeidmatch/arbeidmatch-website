import type { Metadata } from "next";
import JobsMarketplaceClient from "@/components/jobs/JobsMarketplaceClient";
import { getPublicJobs } from "@/lib/jobs/repository";

export const metadata: Metadata = {
  title: "Blue-Collar Careers in Norway",
  description:
    "Discover premium blue-collar opportunities across offshore, onshore, transport, and automotive sectors in Norway.",
  openGraph: {
    title: "Blue-Collar Careers in Norway | ArbeidMatch",
    description:
      "Explore refined job opportunities from verified employers through ArbeidMatch.",
    type: "website",
  },
  alternates: {
    canonical: "/jobs",
  },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function JobsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const browseRaw = sp.browse;
  const browseValue = Array.isArray(browseRaw) ? browseRaw[0] : browseRaw;
  const browseOnly = browseValue === "1" || browseValue === "true";

  const jobs = await getPublicJobs();
  return <JobsMarketplaceClient jobs={jobs} browseOnly={browseOnly} />;
}
