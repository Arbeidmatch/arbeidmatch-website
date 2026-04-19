const SITE = "https://www.arbeidmatch.no";

const localBusiness = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "StaffingAgency"],
  "@id": `${SITE}/#localbusiness`,
  name: "ArbeidMatch Norge AS",
  url: SITE,
  image: `${SITE}/logo.png`,
  email: "post@arbeidmatch.no",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Sverre Svendsens veg 38",
    addressLocality: "Ranheim",
    addressRegion: "Trondheim",
    postalCode: "7056",
    addressCountry: "NO",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 63.45,
    longitude: 10.52,
  },
  areaServed: [
    { "@type": "City", name: "Oslo" },
    { "@type": "City", name: "Bergen" },
    { "@type": "City", name: "Trondheim" },
    { "@type": "City", name: "Stavanger" },
    { "@type": "City", name: "Kristiansand" },
  ],
  knowsAbout: [
    "Bemanning bygg",
    "Bemanning logistikk",
    "Bemanning industri",
    "Bemanning renhold",
    "Bemanning HoReCa",
    "Bemanning helse",
    "Rekruttering EU/EEA",
  ],
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "16:00",
  },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: "ArbeidMatch Norge AS",
  legalName: "ArbeidMatch Norge AS",
  url: SITE,
  logo: `${SITE}/logo.png`,
  email: "post@arbeidmatch.no",
  taxID: "935667089",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Sverre Svendsens veg 38",
    addressLocality: "Ranheim",
    addressRegion: "Trondheim",
    postalCode: "7056",
    addressCountry: "NO",
  },
  sameAs: [
    "https://www.linkedin.com/company/arbeidmatch-norge-as",
    "https://www.facebook.com/arbeidmatch",
    "https://www.google.com/maps/search/?api=1&query=ArbeidMatch+Norge+AS+Sverre+Svendsens+veg+38+Ranheim",
  ],
  areaServed: "Norway",
  knowsLanguage: ["nb", "en", "ro", "pl"],
};

export default function HomeJsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
    </>
  );
}
