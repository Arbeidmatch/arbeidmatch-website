import type { Metadata } from "next";
import ContactRouter from "@/components/site/contact/ContactRouter";
import { getSiteNumbers, replySentence } from "@/lib/numbers";

const TITLE = "Kontakt oss | ArbeidMatch";
const DESCRIPTION_LEAD = "Har dere spørsmål, eller er dere klare til å finne arbeidskraft til bedriften? Kontakt ArbeidMatch.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | Rekruttering fra EU/EØS til Norge",
} as const;

/** ORDER 302: the reply promise in the description is RecOS's; without it the description ends at the lead. */
export async function generateMetadata(): Promise<Metadata> {
  const reply = replySentence(await getSiteNumbers(), "no");
  const DESCRIPTION = reply ? `${DESCRIPTION_LEAD} ${reply}` : DESCRIPTION_LEAD;
  return {
    alternates: { canonical: "/contact", languages: { "nb-NO": "https://www.arbeidmatch.no/contact", "x-default": "https://www.arbeidmatch.no/contact" } },
    title: { absolute: TITLE },
    description: DESCRIPTION,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      locale: "nb_NO",
      siteName: "ArbeidMatch",
      type: "website",
      url: "/contact",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: ["/og-image.png"],
    },
  };
}

/** Kontakt as a router, from the mockup approved on 15 November 2026 (ORDER 295, stage 2). */
export default function ContactPage() {
  return <ContactRouter />;
}
