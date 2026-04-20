import type { Metadata } from "next";
import HowItWorksInteractive from "@/components/home/HowItWorksInteractive";
import Testimonials from "@/components/Testimonials";
import TikTokLiveBanner from "@/components/TikTokLiveBanner";
import HomePageClient from "@/components/pages/HomePageClient";
import HomeFaqJsonLd from "@/components/seo/HomeFaqJsonLd";

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
  return (
    <div className="bg-[#0D1B2A] text-white">
      <HomeFaqJsonLd />
      <TikTokLiveBanner />
      <HomePageClient
        howItWorksSlot={<HowItWorksInteractive />}
        testimonialsSlot={<Testimonials />}
      />
    </div>
  );
}
