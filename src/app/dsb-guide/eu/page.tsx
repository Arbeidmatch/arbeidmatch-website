import type { Metadata } from "next";
import { DsbGuidePage } from "@/components/dsb/DsbGuidePage";

export const metadata: Metadata = {
  title: "DSB Guide — EU/EEA Electricians",
  robots: { index: false, follow: false },
};

export default async function DsbGuideEuPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <DsbGuidePage guideSlug="eu" token={params.token} />;
}
