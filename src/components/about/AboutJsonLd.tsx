import { getSiteNumbers, text } from "@/lib/numbers";
import { SUPPORT_PAGE_URL } from "@/lib/supportPage";

const schema = (street: string | null) => ({
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About ArbeidMatch Norge AS",
  url: "https://www.arbeidmatch.no/about",
  description:
    "ArbeidMatch connects qualified EU/EEA workers with Norwegian employers in construction, logistics, industry and more. Based in Trondheim, Norway.",
  publisher: {
    "@type": "Organization",
    name: "ArbeidMatch Norge AS",
    url: "https://www.arbeidmatch.no",
    foundingDate: "2025-05-08",
    foundingLocation: {
      "@type": "Place",
      name: "Trondheim, Norway",
    },
    contactPoint: {
      "@type": "ContactPoint",
      // Questions go to the support page, never a phone (the owner, 6 October 2026).
      url: SUPPORT_PAGE_URL,
      contactType: "customer service",
      availableLanguage: ["Norwegian", "English", "Romanian", "Polish"],
    },
    address: {
      "@type": "PostalAddress",
      // ORDER 302: the street is RecOS's; without it the address goes without one.
      ...(street ? { streetAddress: street } : {}),
      addressLocality: "Ranheim",
      postalCode: "7056",
      addressCountry: "NO",
    },
  },
});

export default async function AboutJsonLd() {
  const street = text(await getSiteNumbers(), "company_street_address");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema(street)) }}
    />
  );
}
