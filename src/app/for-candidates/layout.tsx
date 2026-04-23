import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Your Next Job in Norway | ArbeidMatch",
  description:
    "EU/EEA workers. English-speaking roles. Legal employment through an Arbeidstilsynet-authorized company.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Find Your Next Job in Norway | ArbeidMatch",
    description:
      "EU/EEA workers. English-speaking roles. Legal employment through an Arbeidstilsynet-authorized company.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your Next Job in Norway | ArbeidMatch",
    description:
      "EU/EEA workers. English-speaking roles. Legal employment through an Arbeidstilsynet-authorized company.",
  },
};

export default function ForCandidatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
