import type { Metadata } from "next";
import HowItWorksInteractive from "@/components/home/HowItWorksInteractive";
import Testimonials from "@/components/Testimonials";
import TikTokLiveBanner from "@/components/TikTokLiveBanner";
import HomePageClient from "@/components/pages/HomePageClient";
import HomeFaqJsonLd from "@/components/seo/HomeFaqJsonLd";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "EU/EEA Staffing for Norway | ArbeidMatch",
  description:
    "Staffing agency in Trondheim connecting qualified EU/EEA workers with Norwegian employers in construction, logistics, and industry.",
  openGraph: {
    title: "EU/EEA Staffing for Norway | ArbeidMatch",
    description:
      "Staffing agency in Trondheim connecting qualified EU/EEA workers with Norwegian employers in construction, logistics, and industry.",
    locale: "en_US",
  },
  twitter: {
    title: "EU/EEA Staffing for Norway | ArbeidMatch",
    description:
      "Staffing agency in Trondheim connecting qualified EU/EEA workers with Norwegian employers in construction, logistics, and industry.",
  },
};

export default async function Home() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">
      <HomeFaqJsonLd />
      <TikTokLiveBanner />
      <HomePageClient
        howItWorksSlot={<HowItWorksInteractive />}
        testimonialsSlot={<Testimonials />}
      />
    </div>
  );
}
