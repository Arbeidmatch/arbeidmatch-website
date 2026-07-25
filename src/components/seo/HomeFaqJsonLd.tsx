const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Hvilke fagområder leverer ArbeidMatch?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vi leverer fagarbeidere fra EU/EØS til bygg og anlegg, industri og produksjon, logistikk og lager, renhold og horeca. Vanlige roller er tømrer, maler, sveiser, elektriker, betongarbeider, stillasbygger, sjåfør og industrimekaniker.",
      },
    },
    {
      "@type": "Question",
      name: "Hvor lang tid tar det å få kvalifiserte fagarbeidere på plass?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tidsbruk varierer med rolle, dokumentasjon og sesong. ArbeidMatch jobber med strukturert sourcing og screening og kan ofte levere kandidater til presentasjon og oppstart innen korte uker når kravprofilen er tydelig og beslutningsløpene hos kunden er klare.",
      },
    },
    {
      "@type": "Question",
      name: "Hva dokumenterer dere på et oppdrag?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vi samler arbeidsavtale, lønnsbetingelser, fagbrev eller kompetansebevis, legitimasjon og relevante bransjedokumenter på selve oppdraget, sammen med registrerte timer. Da ligger alt samlet dersom noen spør senere, i stedet for spredt i e-post.",
      },
    },
    {
      "@type": "Question",
      name: "Hvordan følger dere opp folk som er ute på oppdrag?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hver kandidat har en fast kontaktperson hos oss. Timer registreres og godkjennes underveis, og vi tar kontakt med både kunde og arbeidstaker gjennom oppdraget slik at avvik fanges opp mens de fortsatt er små.",
      },
    },
    {
      "@type": "Question",
      name: "Hva trenger dere fra oss for å komme i gang?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rolle og antall, hvor og når arbeidet skal utføres, varighet, språkkrav og eventuelle sertifikater eller kurs som kreves på stedet. Med det på plass kan vi begynne å presentere kandidater.",
      },
    },
  ],
};

export default function HomeFaqJsonLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
  );
}
