import type { Metadata } from "next";
import { DsbGuidePage } from "@/components/dsb/DsbGuidePage";

export const metadata: Metadata = {
  title: "DSB Guide: Non-EU Electricians",
  robots: { index: false, follow: false },
};

export default async function DsbGuideNonEuPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <DsbGuidePage guideSlug="non-eu" token={params.token} />;
}
