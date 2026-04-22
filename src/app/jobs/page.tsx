import type { Metadata } from "next";
import PremiumJobsBoard from "@/components/jobs/PremiumJobsBoard";

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

export default function JobsPage() {
  return <PremiumJobsBoard />;
}
