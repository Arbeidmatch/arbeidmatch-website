import type { Metadata } from "next";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import TikTokLiveBanner from "@/components/TikTokLiveBanner";
import HomePageClient from "@/components/pages/HomePageClient";
import HomeFaqJsonLd from "@/components/seo/HomeFaqJsonLd";
import { getCandidateActivityStats } from "@/lib/candidateActivityStats";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Bemanning av EU/EEA-arbeidere Trondheim",
  description:
    "Bemanningsbyrå i Trondheim med rekruttering fra EU/EEA til bygg, logistikk og industri. Lovlig bemanning med utenlandske arbeidere – ta kontakt i dag.",
  openGraph: {
    title: "Bemanning av EU/EEA-arbeidere Trondheim | ArbeidMatch",
    description:
      "Bemanningsbyrå i Trondheim med rekruttering fra EU/EEA til bygg, logistikk og industri. Lovlig bemanning med utenlandske arbeidere – ta kontakt i dag.",
    locale: "nb_NO",
  },
  twitter: {
    title: "Bemanning av EU/EEA-arbeidere Trondheim | ArbeidMatch",
    description:
      "Bemanningsbyrå i Trondheim med rekruttering fra EU/EEA til bygg, logistikk og industri. Lovlig bemanning med utenlandske arbeidere – ta kontakt i dag.",
  },
};

export default async function Home() {
  const candidateActivity = await getCandidateActivityStats();

  return (
    <>
      <HomeFaqJsonLd />
      <TikTokLiveBanner />
      <HomePageClient
        candidateActivity={candidateActivity}
        howItWorksSlot={<HowItWorks />}
        testimonialsSlot={<Testimonials />}
      />
    </>
  );
}
