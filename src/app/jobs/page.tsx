import type { Metadata } from "next";

import JobsMarketplaceClient from "@/components/jobs/JobsMarketplaceClient";
import { listPublicActiveJobs } from "@/lib/jobs/repository";

export const metadata: Metadata = {
  title: "Jobs in Norway | ArbeidMatch",
  description: "Browse open jobs and use Smart Match to find your best fit.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default async function JobsPage() {
  const jobs = await listPublicActiveJobs();
  return <JobsMarketplaceClient jobs={jobs} browseOnly={false} />;
}
