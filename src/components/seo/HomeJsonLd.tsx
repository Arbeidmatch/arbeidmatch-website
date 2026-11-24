import { openingHoursSpec, orgDigits, text, type SiteNumbers } from "@/lib/numbers";

const SITE = "https://www.arbeidmatch.no";

/**
 * ORDER 302 step 6: the street address, the organisation number and the opening
 * hours are RecOS's (company_street_address, company_org_number,
 * company_opening_hours). A missing one is left out of the data, never typed here.
 */
function localBusinessOf(n: SiteNumbers) {
  const street = text(n, "company_street_address");
  const hours = openingHoursSpec(text(n, "company_opening_hours"));
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "StaffingAgency"],
    "@id": `${SITE}/#localbusiness`,
    name: "ArbeidMatch Norge AS",
    url: SITE,
    image: `${SITE}/logo.png`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      ...(street ? { streetAddress: street } : {}),
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
      "Rekruttering EU/EEA",
    ],
    ...(hours ? { openingHoursSpecification: hours } : {}),
  };
}

function organizationOf(n: SiteNumbers) {
  const street = text(n, "company_street_address");
  const taxID = orgDigits(text(n, "company_org_number"));
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}/#organization`,
    name: "ArbeidMatch Norge AS",
    legalName: "ArbeidMatch Norge AS",
    url: SITE,
    logo: `${SITE}/logo.png`,
    ...(taxID ? { taxID } : {}),
    address: {
      "@type": "PostalAddress",
      ...(street ? { streetAddress: street } : {}),
      addressLocality: "Ranheim",
      addressRegion: "Trondheim",
      postalCode: "7056",
      addressCountry: "NO",
    },
    sameAs: [
      "https://www.linkedin.com/company/arbeidmatch-norge-as",
      "https://www.facebook.com/arbeidmatch",
      ...(street ? [`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`ArbeidMatch Norge AS ${street} Ranheim`).replace(/%20/g, "+")}`] : []),
    ],
    areaServed: "Norway",
    knowsLanguage: ["nb", "en", "ro", "pl"],
  };
}

export default function HomeJsonLd({ numbers }: { numbers: SiteNumbers }) {
  const localBusiness = localBusinessOf(numbers);
  const organization = organizationOf(numbers);
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
