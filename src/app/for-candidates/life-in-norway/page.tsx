import type { Metadata } from "next";

import { GuideList } from "@/components/site/candidates/LifeInNorway";

const TITLE = "Life in Norway: guides for your first months | ArbeidMatch";
const DESCRIPTION = "Practical steps for people who move to Norway for work, written from official Norwegian sources.";
const URL = "https://www.arbeidmatch.no/for-candidates/life-in-norway";

export const metadata: Metadata = {
  alternates: { canonical: "/for-candidates/life-in-norway", languages: { en: URL, "x-default": URL } },
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/for-candidates/life-in-norway", locale: "en_US", siteName: "ArbeidMatch", type: "website" },
};

/** The guide list for candidates, built from the five articles that lived under /premium (ORDER 295, stage 5). */
export default function LifeInNorwayPage() {
  return <GuideList />;
}
