import type { Metadata } from "next";

import MinSideProposal from "@/components/min-side/MinSideProposal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Min side | ArbeidMatch" },
  description: "Svar på forslagene fra ArbeidMatch.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

/**
 * ORDER 210 part (b): the answer page of the proposals letter,
 * /min-side/forslag?t=<key>[&svar=much|some|not_yet]. Opening it writes
 * nothing; the press on the page does. Never indexed; the key is not sent on.
 */
export default async function MinSideProposalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  return <MinSideProposal token={one(sp.t).trim()} svar={one(sp.svar) || null} />;
}
