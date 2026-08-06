import type { Metadata } from "next";
import Testimonials from "@/components/Testimonials";
import HomePageClient from "@/components/pages/HomePageClient";
import HomeFaqJsonLd from "@/components/seo/HomeFaqJsonLd";

export const revalidate = 60;

const TITLE = "Qualified EU/EEA Workers for Norway | ArbeidMatch";
const DESCRIPTION =
  "Staffing and recruitment for Norwegian companies: we employ qualified EU/EEA workers in construction, logistics and industry and hire them out to you, or recruit them directly into your own payroll.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA staffing and recruitment in Norway",
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

export default function Home() {
  return (
    <div className="bg-[#0D1B2A] text-white" style={{ background: "#0D1B2A", minHeight: "100vh" }}>
      <HomeFaqJsonLd />
      <HomePageClient testimonialsSlot={<Testimonials />} />
    </div>
  );
}
