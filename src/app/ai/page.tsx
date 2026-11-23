import type { Metadata } from "next";

import { SitePolicyPage, sitePolicyMetadata } from "@/components/legal/SitePolicyPage";
import { parseLegalLanguage } from "@/lib/legalPageLanguage";
import { SITE_POLICIES } from "@/lib/sitePolicies";

// The text lives in src/lib/sitePolicies.ts (ORDER 424).
const POLICY = SITE_POLICIES.ai;

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return sitePolicyMetadata(POLICY, parseLegalLanguage((await searchParams).lang));
}

export default async function AiPage({ searchParams }: Props) {
  return <SitePolicyPage policy={POLICY} language={parseLegalLanguage((await searchParams).lang)} />;
}
