import type { Metadata } from "next";
import Testimonials from "@/components/Testimonials";
import TikTokLiveBanner from "@/components/TikTokLiveBanner";
import HomePageClient from "@/components/pages/HomePageClient";
import HomeFaqJsonLd from "@/components/seo/HomeFaqJsonLd";

export const revalidate = 60;

const TITLE = "Qualified EU/EEA Workers for Norway | ArbeidMatch";
const DESCRIPTION =
  "Connect your Norwegian business with pre-screened EU/EEA workers in construction, logistics, and industry. Compliant recruitment with clear expectations.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default async function Home() {
  return (
    <div className="bg-[#0D1B2A] text-white" style={{ background: "#0D1B2A", minHeight: "100vh" }}>
      <HomeFaqJsonLd />
      <TikTokLiveBanner />
      <HomePageClient testimonialsSlot={<Testimonials />} />
    </div>
  );
}
