import type { Metadata } from "next";
import LiveStatsSection from "@/components/home/LiveStatsSection";
import Testimonials from "@/components/Testimonials";
import HomePageClient from "@/components/pages/HomePageClient";
import HomeFaqJsonLd from "@/components/seo/HomeFaqJsonLd";

async function fetchLiveStatsForHome(): Promise<{
  candidates: number;
  industries: number;
  roles: number;
}> {
  try {
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://127.0.0.1:3000");
    const res = await fetch(`${origin}/api/live-stats`, { next: { revalidate: 300 } });
    if (!res.ok) return { candidates: 0, industries: 0, roles: 0 };
    const data = (await res.json()) as Record<string, unknown>;
    return {
      candidates: typeof data.candidates === "number" && Number.isFinite(data.candidates) ? data.candidates : 0,
      industries: typeof data.industries === "number" && Number.isFinite(data.industries) ? data.industries : 0,
      roles: typeof data.roles === "number" && Number.isFinite(data.roles) ? data.roles : 0,
    };
  } catch {
    return { candidates: 0, industries: 0, roles: 0 };
  }
}

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
  const liveStats = await fetchLiveStatsForHome();

  return (
    <div className="bg-[#0D1B2A] text-white" style={{ background: "#0D1B2A", minHeight: "100vh" }}>
      <HomeFaqJsonLd />
      <HomePageClient
        testimonialsSlot={<Testimonials />}
        liveStatsSlot={<LiveStatsSection candidates={liveStats.candidates} industries={liveStats.industries} roles={liveStats.roles} />}
      />
    </div>
  );
}
