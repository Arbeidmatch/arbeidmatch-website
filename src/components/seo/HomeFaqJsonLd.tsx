const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Kan norske bedrifter ansette arbeidere fra EU/EØS uten særskilt arbeidstillatelse?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja, personer med statsborgerskap i EU/EØS-land har rett til å bo og arbeide i Norge i kraft av fri bevegelse. Arbeidsgiver må likevel sørge for lovlig ansettelse: skriftlig arbeidsavtale, lønn i tråd med tariff/allmenngjøring der det gjelder, melding til Arbeidstilsynet ved utsendelse der kravene er oppfylt, og rutiner for ID-kontroll og HMS.",
      },
    },
    {
      "@type": "Question",
      name: "Hva bør arbeidsgiver dokumentere ved bemanning fra EU/EØS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Typisk dokumenteres arbeidsavtale, kompetansebevis eller fagbrev, identitet, skattemeldekort og eventuelle bransjekrav (for eksempel autorisasjoner). Ved utleie fra bemanningsbyrå bør avtalen klargjøre ansvar for lønn, arbeidsmiljø og oppfølging på anlegg eller i produksjon.",
      },
    },
    {
      "@type": "Question",
      name: "Gjelder norske minstelønnskrav for utenlandske arbeidere?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. Der det finnes allmenngjort minstelønn eller tariff, skal lønns- og arbeidsvilkår følge disse reglene uavhengig av arbeiderens statsborgerskap. Brudd kan gi reaksjoner fra Arbeidstilsynet og skatteetaten, og svekke omdømmet til oppdragsgiver og bemanningspartner.",
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
      name: "Hvordan reduserer vi risiko for sosial dumping og useriøs bemanning?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kartlegg reelle arbeidsforhold, kontroller at avtaler og timelister stemmer med utført arbeid, sikre opplæring i HMS og språk der det trengs, og velg samarbeidspartnere med sporbar prosess og etterprøvbar dokumentasjon. Seriøs bemanning kombinerer hastighet med etterlevelse av norsk arbeidslivsregelverk.",
      },
    },
  ],
};

export default function HomeFaqJsonLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
  );
}
