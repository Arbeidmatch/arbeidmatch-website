const SITE = "https://www.arbeidmatch.no";

const breadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Hjem",
      item: `${SITE}/`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Bemanning bygg og anlegg",
      item: `${SITE}/bemanning-bygg-anlegg`,
    },
  ],
};

export default function BreadcrumbByggAnleggJsonLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
  );
}
