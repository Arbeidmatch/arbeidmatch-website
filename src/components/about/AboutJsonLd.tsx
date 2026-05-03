const schema = {
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
      email: "support@arbeidmatch.no",
      telephone: "+47-967-34-730",
      contactType: "customer service",
      availableLanguage: ["Norwegian", "English", "Romanian", "Polish"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sverre Svendsens veg 38",
      addressLocality: "Ranheim",
      postalCode: "7056",
      addressCountry: "NO",
    },
  },
};

export default function AboutJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
