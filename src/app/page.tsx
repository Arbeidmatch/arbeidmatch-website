import type { Metadata } from "next";
import CandidateActivityBanner from "@/components/CandidateActivityBanner";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import TikTokLiveBanner from "@/components/TikTokLiveBanner";
import HomePageClient from "@/components/pages/HomePageClient";
import { getCandidateActivityStats } from "@/lib/candidateActivityStats";

/** Refresh candidate activity strip periodically (server-rendered, cached). */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "EU/EEA Recruitment for Norwegian Employers",
  description:
    "ArbeidMatch connects Norwegian employers with qualified EU/EEA workers. Fast matching, full compliance, blue-collar specialists.",
};

export default async function Home() {
  const candidateActivity = await getCandidateActivityStats();

  return (
    <>
      <TikTokLiveBanner />
      <HomePageClient
        candidateActivity={candidateActivity}
        bannerSlot={<CandidateActivityBanner stats={candidateActivity} />}
        howItWorksSlot={<HowItWorks />}
        testimonialsSlot={<Testimonials />}
      />
    </>
  );
}
