import type { Metadata } from "next";

import JobsComingSoonClient from "@/components/jobs/JobsComingSoonClient";

export const metadata: Metadata = {
  title: "Jobs Coming Soon",
  description: "We are preparing exciting job opportunities. Get notified when the jobs board launches.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function JobsPage() {
  return <JobsComingSoonClient />;
}
