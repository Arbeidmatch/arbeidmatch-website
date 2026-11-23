import { STAFFING_REGISTER_URL } from "@/components/site/siteNav";
import type { LegalLanguage } from "@/lib/legalPageLanguage";

export { STAFFING_REGISTER_URL };

/**
 * The public policies written on this site, not on the platform (ORDER 424,
 * 23 November 2026): the Transparency Act statement, the AI notice, the
 * whistleblowing summary, equality, the code of conduct and the complaints
 * procedure. Privacy, terms, cookies and the DPA stay on the platform and are
 * only listed by the hub at /legal.
 *
 * Every statement here is either something ArbeidMatch does or a duty the
 * cited law puts on it, checked against the official text on lovdata.no and
 * the company's entry in Enhetsregisteret. No certification, audit or badge is
 * claimed, no supplier or tool is named, and no person is named. The AI notice
 * repeats the Privacy Notice's own words on what the language model receives
 * and does not change them (that wording belongs to ORDER 393).
 *
 * Inline links are written [text](href); a block is a paragraph or a list.
 * A change of meaning raises `version` and moves `updated`.
 */

export type PolicyBlock = string | { list: readonly string[] };
export type PolicySection = { heading: string; blocks: readonly PolicyBlock[] };
export type PolicyText = { title: string; description: string; lead: string; sections: readonly PolicySection[] };

export type SitePolicy = {
  path: string;
  version: number;
  /** ISO date of the last change of meaning. */
  updated: string;
  text: Record<LegalLanguage, PolicyText>;
};

export const COMPANY = {
  name: "ArbeidMatch Norge AS",
  orgNumber: "935 667 089",
  address: "Sverre Svendsens veg 38, 7056 Ranheim",
} as const;


/** The one contact route for every policy: the legal request form, opened on the right kind. */
export function legalRequestHref(kind: string, language: LegalLanguage): string {
  return `/legal-request?kind=${kind}&lang=${language}`;
}

const L = legalRequestHref;

const transparencyAct: SitePolicy = {
  path: "/transparency-act",
  version: 1,
  updated: "2026-11-23",
  text: {
    no: {
      title: "Åpenhetsloven",
      description: "Hvordan ArbeidMatch arbeider med menneskerettigheter og anstendige arbeidsforhold, og hvordan du ber om informasjon.",
      lead: "ArbeidMatch Norge AS leier ut og formidler arbeidskraft. Anstendige arbeidsforhold for menneskene vi rekrutterer er kjernen i det vi gjør.",
      sections: [
        {
          heading: "Gjelder loven for oss?",
          blocks: [
            "Åpenhetsloven gjelder for større virksomheter: foretak av allmenn interesse, eller foretak som på balansedagen overskrider minst to av tre terskler (salgsinntekt 70 millioner kroner, balansesum 35 millioner kroner, 50 årsverk), jf. [åpenhetsloven § 3](https://lovdata.no/lov/2021-06-18-99/§3).",
            "ArbeidMatch Norge AS har 7 ansatte registrert i Enhetsregisteret og er ikke en større virksomhet etter loven. Vi har derfor ikke plikt til aktsomhetsvurderinger eller en årlig redegjørelse etter §§ 4 og 5. Vi har ikke publisert en slik redegjørelse. Denne siden publiserer vi frivillig.",
          ],
        },
        {
          heading: "Hva vi gjør",
          blocks: [
            {
              list: [
                "Kandidater får skriftlig informasjon om stilling, arbeidssted og lønn før de takker ja.",
                "Vi er et godkjent bemanningsforetak, registrert hos Arbeidstilsynet. [Se oppføringen i registeret](" + STAFFING_REGISTER_URL + ").",
                "Ved utleie er vi bundet av reglene om likebehandling av innleide arbeidstakere i [arbeidsmiljøloven § 14-12 a](https://lovdata.no/lov/2005-06-17-62/§14-12a).",
                "Vi vurderer kandidater uten forskjellsbehandling, se [likestilling og ikke-diskriminering](/equality).",
                "Alle som jobber med eller for oss kan varsle om kritikkverdige forhold, se [varsling](/whistleblowing).",
                "Vi samarbeider bare med partnere i Europa.",
              ],
            },
          ],
        },
        {
          heading: "Be om informasjon",
          blocks: [
            "Du kan be om informasjon om hvordan vi håndterer faktiske og mulige negative konsekvenser for grunnleggende menneskerettigheter og anstendige arbeidsforhold. Bruk [skjemaet for informasjonskrav](" + L("transparency", "no") + ").",
            "Vi svarer skriftlig innen tre uker. Hvis mengden eller typen informasjon gjør det uforholdsmessig byrdefullt, svarer vi innen to måneder og sier fra innen tre uker om hvorfor og når svaret kommer. Dette er fristene i [åpenhetsloven § 7](https://lovdata.no/lov/2021-06-18-99/§7), som vi følger frivillig.",
            "Forbrukertilsynet veileder om loven: [forbrukertilsynet.no](https://www.forbrukertilsynet.no).",
          ],
        },
      ],
    },
    en: {
      title: "Transparency Act",
      description: "How ArbeidMatch works for human rights and decent working conditions, and how to request information.",
      lead: "ArbeidMatch Norge AS hires out and recruits workers. Decent working conditions for the people we recruit are the core of what we do.",
      sections: [
        {
          heading: "Does the Act apply to us?",
          blocks: [
            "The Norwegian Transparency Act (åpenhetsloven) applies to larger enterprises: public-interest entities, or enterprises that on the balance sheet date exceed at least two of three thresholds (sales revenue NOK 70 million, balance sheet total NOK 35 million, 50 full-time equivalents), see [section 3 of the Act](https://lovdata.no/lov/2021-06-18-99/§3).",
            "ArbeidMatch Norge AS has 7 employees registered in the Register of Business Enterprises and is not a larger enterprise under the Act. We are therefore not obliged to carry out due diligence or publish an annual account under sections 4 and 5, and we have not published such an account. We publish this page voluntarily.",
          ],
        },
        {
          heading: "What we do",
          blocks: [
            {
              list: [
                "Candidates receive written information about the position, workplace and pay before they accept.",
                "We are an approved staffing agency, registered with the Norwegian Labour Inspection Authority. [See our entry in the register](" + STAFFING_REGISTER_URL + ").",
                "When we hire out workers, we are bound by the equal treatment rules for hired workers in [section 14-12 a of the Working Environment Act](https://lovdata.no/lov/2005-06-17-62/§14-12a).",
                "We assess candidates without discrimination, see [equality and non-discrimination](/equality?lang=en).",
                "Anyone working with or for us can report concerns, see [whistleblowing](/whistleblowing?lang=en).",
                "We work only with partners in Europe.",
              ],
            },
          ],
        },
        {
          heading: "Request information",
          blocks: [
            "You can ask how we address actual and potential adverse impacts on fundamental human rights and decent working conditions. Use the [information request form](" + L("transparency", "en") + ").",
            "We answer in writing within three weeks. Where the amount or type of information makes that unreasonably burdensome, we answer within two months and tell you within three weeks why and when to expect it. These are the deadlines of [section 7 of the Act](https://lovdata.no/lov/2021-06-18-99/§7), which we follow voluntarily.",
            "The Norwegian Consumer Authority gives guidance on the Act: [forbrukertilsynet.no](https://www.forbrukertilsynet.no).",
          ],
        },
      ],
    },
  },
};

const ai: SitePolicy = {
  path: "/ai",
  version: 1,
  updated: "2026-11-23",
  text: {
    no: {
      title: "Kunstig intelligens hos ArbeidMatch",
      description: "Hvordan og hvorfor ArbeidMatch bruker KI, hva den får se, og rettighetene dine.",
      lead: "Vi bruker kunstig intelligens (KI) som et verktøy for de ansatte. Et menneske tar alltid avgjørelsen.",
      sections: [
        {
          heading: "Kort for kandidater",
          blocks: [
            {
              list: [
                "KI hjelper oss å lese CV-er, foreslå stillinger og skrive utkast. Den bestemmer ikke om du får en jobb.",
                "En ansatt hos ArbeidMatch vurderer deg og tar hver beslutning.",
                "Før tekst sendes til språkmodellen fjerner vi navn, kontaktopplysninger, identifikatorer og fødselsdato.",
                "Du kan spørre hvordan KI ble brukt i din sak, be om at en person vurderer saken på nytt, eller protestere mot bruken.",
              ],
            },
          ],
        },
        {
          heading: "Hva vi bruker KI til",
          blocks: [
            {
              list: [
                "Lese CV-er og dokumenter og hente ut erfaring, kompetanse og språk til profilen.",
                "Foreslå hvilke kandidater som kan passe en stilling, og hvilke stillinger som kan passe en kandidat.",
                "Skrive utkast til annonser, presentasjoner og brev, som en ansatt leser og godkjenner før noe sendes.",
                "Hjelpe ansatte å finne fram i systemet og oppsummere saker.",
                "Svare på spørsmål i chat og Messenger. Assistenten sier fra at den er KI.",
              ],
            },
          ],
        },
        {
          heading: "Et menneske bestemmer",
          blocks: [
            "Ingen kandidat blir valgt bort, presentert eller ansatt på grunnlag av KI alene. Forslagene er et utgangspunkt; en ansatt vurderer og avgjør. Vi treffer ingen avgjørelser som utelukkende bygger på automatisert behandling, slik [personvernforordningen artikkel 22](https://lovdata.no/lov/2018-06-15-38/gdpr/a22) omtaler.",
          ],
        },
        {
          heading: "Hvilke opplysninger KI får",
          blocks: [
            "Språkmodellen som hjelper de ansatte, får tekst først etter at navn, kontaktopplysninger, identifikatorer og fødselsdatoer er fjernet, slik at ingen kandidat kan identifiseres av den. Hvor den kjører, og hvem som behandler opplysninger for oss, står i [personvernerklæringen](/privacy) og i listen over underleverandører den viser til.",
          ],
        },
        {
          heading: "Rettighetene dine",
          blocks: [
            {
              list: [
                "Du kan få vite hvordan KI ble brukt i saken din.",
                "Du kan be om at en person vurderer saken på nytt uten KI-forslaget.",
                "Du kan protestere mot at KI brukes på profilen din. Da behandler en ansatt profilen manuelt; det kan ta lengre tid, men stiller deg ikke dårligere.",
              ],
            },
            "Send forespørselen gjennom [skjemaet for KI-spørsmål](" + L("ai", "no") + "). Vi svarer innen 30 dager. Du kan også klage til [Datatilsynet](https://www.datatilsynet.no).",
          ],
        },
        {
          heading: "Lagring og ansvar",
          blocks: [
            "Opplysningene i saken, også det KI har hjulpet til med, lagres og slettes etter fristene i [personvernerklæringen](/privacy).",
            "Når ArbeidMatch rekrutterer selv, er vi behandlingsansvarlig. Når en annen virksomhet rekrutterer i sitt eget arbeidsområde i plattformen vår, er den virksomheten normalt behandlingsansvarlig, og vi er databehandler etter en [databehandleravtale](/dpa).",
          ],
        },
      ],
    },
    en: {
      title: "Artificial intelligence at ArbeidMatch",
      description: "How and why ArbeidMatch uses AI, what it sees, and your rights.",
      lead: "We use artificial intelligence (AI) as a tool for our staff. A person always makes the decision.",
      sections: [
        {
          heading: "In short, for candidates",
          blocks: [
            {
              list: [
                "AI helps us read CVs, suggest jobs and write drafts. It does not decide whether you get a job.",
                "A member of ArbeidMatch staff assesses you and makes every decision.",
                "Before text is sent to the language model, we remove names, contact details, identifiers and dates of birth.",
                "You can ask how AI was used in your case, ask a person to review it again, or object to its use.",
              ],
            },
          ],
        },
        {
          heading: "What we use AI for",
          blocks: [
            {
              list: [
                "Reading CVs and documents and extracting experience, skills and languages for the profile.",
                "Suggesting which candidates may fit a job, and which jobs may fit a candidate.",
                "Drafting adverts, presentations and letters, which a member of staff reads and approves before anything is sent.",
                "Helping staff find their way in the system and summarise cases.",
                "Answering questions in chat and Messenger. The assistant says that it is AI.",
              ],
            },
          ],
        },
        {
          heading: "A person decides",
          blocks: [
            "No candidate is rejected, presented or hired on the basis of AI alone. Suggestions are a starting point; a member of staff assesses and decides. We make no decisions based solely on automated processing as described in [Article 22 GDPR](https://lovdata.no/lov/2018-06-15-38/gdpr/a22).",
          ],
        },
        {
          heading: "What information AI receives",
          blocks: [
            "The language model that assists our staff receives text only after names, contact details, identifiers and dates of birth have been removed, so no candidate is identifiable to it. Where it runs, and who processes data on our behalf, is set out in the [Privacy Notice](/privacy?lang=en) and the list of service providers it refers to.",
          ],
        },
        {
          heading: "Your rights",
          blocks: [
            {
              list: [
                "You can find out how AI was used in your case.",
                "You can ask a person to review your case again without the AI suggestion.",
                "You can object to AI being used on your profile. A member of staff then handles it manually; this may take longer, but does not put you at a disadvantage.",
              ],
            },
            "Send your request through the [AI question form](" + L("ai", "en") + "). We answer within 30 days. You may also complain to [Datatilsynet](https://www.datatilsynet.no), the Norwegian Data Protection Authority.",
          ],
        },
        {
          heading: "Retention and responsibility",
          blocks: [
            "The information in a case, including what AI helped with, is kept and deleted on the schedule in the [Privacy Notice](/privacy?lang=en).",
            "When ArbeidMatch recruits itself, we are the controller. When another organisation recruits in its own workspace on our platform, that organisation is normally the controller and we are its processor under a [data processing agreement](/dpa).",
          ],
        },
      ],
    },
  },
};

const whistleblowing: SitePolicy = {
  path: "/whistleblowing",
  version: 1,
  updated: "2026-11-23",
  text: {
    no: {
      title: "Varsling",
      description: "Slik varsler du om kritikkverdige forhold hos ArbeidMatch, og vernet du har.",
      lead: "Vi oppfordrer alle som jobber hos oss, også innleide arbeidstakere hos kundene våre, til å si fra om kritikkverdige forhold.",
      sections: [
        {
          heading: "Hva du kan varsle om",
          blocks: [
            "Kritikkverdige forhold er forhold i strid med lov, skriftlige etiske retningslinjer eller etiske normer med bred tilslutning, for eksempel fare for liv eller helse, fare for klima eller miljø, korrupsjon eller annen økonomisk kriminalitet, myndighetsmisbruk, uforsvarlig arbeidsmiljø og brudd på personopplysningssikkerheten ([arbeidsmiljøloven § 2 A-1](https://lovdata.no/lov/2005-06-17-62/§2a-1)).",
            "Innleide arbeidstakere har også rett til å varsle om forhold hos virksomheten de er leid ut til. Uenighet som bare gjelder ditt eget arbeidsforhold, er normalt ikke varsling; ta det opp med oss direkte.",
          ],
        },
        {
          heading: "Slik varsler du",
          blocks: [
            {
              list: [
                "Internt til ArbeidMatch: bruk [varslingsskjemaet](" + L("whistleblowing", "no") + "). Varselet går til selskapets ledelse og behandles fortrolig.",
                "Til tillitsvalgt, verneombud eller advokat.",
                "Til en offentlig myndighet, for eksempel [Arbeidstilsynet](https://www.arbeidstilsynet.no) eller [Datatilsynet](https://www.datatilsynet.no). Det er alltid lov ([arbeidsmiljøloven § 2 A-2](https://lovdata.no/lov/2005-06-17-62/§2a-2)).",
              ],
            },
          ],
        },
        {
          heading: "Hva vi gjør med varselet",
          blocks: [
            "Vi bekrefter at vi har mottatt varselet, undersøker forholdet innen rimelig tid og forteller deg hva vi har gjort, så langt det er mulig uten å bryte andres personvern. Bare de som må vite det for å behandle saken, får vite hvem du er.",
          ],
        },
        {
          heading: "Vern mot gjengjeldelse",
          blocks: [
            "Gjengjeldelse mot den som varsler forsvarlig, er forbudt. Det gjelder blant annet trusler, trakassering, usaklig forskjellsbehandling, advarsel, omplassering, oppsigelse og avskjed. For innleide arbeidstakere gjelder forbudet både oss og virksomheten du er leid ut til ([arbeidsmiljøloven § 2 A-4](https://lovdata.no/lov/2005-06-17-62/§2a-4)). Saker om gjengjeldelse kan bringes inn for [Diskrimineringsnemnda](https://www.diskrimineringsnemnda.no).",
          ],
        },
      ],
    },
    en: {
      title: "Whistleblowing",
      description: "How to report concerns at ArbeidMatch, and the protection you have.",
      lead: "We encourage everyone who works for us, including workers we hire out to our clients, to speak up about wrongdoing.",
      sections: [
        {
          heading: "What you can report",
          blocks: [
            "Wrongdoing means matters that breach the law, written ethical guidelines or widely accepted ethical norms, for example danger to life or health, danger to the climate or environment, corruption or other financial crime, abuse of authority, an unsafe working environment and breaches of personal data security ([Working Environment Act section 2 A-1](https://lovdata.no/lov/2005-06-17-62/§2a-1)).",
            "Hired workers may also report matters at the business they are hired out to. A disagreement that concerns only your own employment is normally not whistleblowing; raise it with us directly.",
          ],
        },
        {
          heading: "How to report",
          blocks: [
            {
              list: [
                "Internally to ArbeidMatch: use the [whistleblowing form](" + L("whistleblowing", "en") + "). The report goes to the company's management and is handled in confidence.",
                "To a union representative, safety representative or lawyer.",
                "To a public authority, for example [Arbeidstilsynet](https://www.arbeidstilsynet.no) or [Datatilsynet](https://www.datatilsynet.no). This is always permitted ([Working Environment Act section 2 A-2](https://lovdata.no/lov/2005-06-17-62/§2a-2)).",
              ],
            },
          ],
        },
        {
          heading: "What we do with a report",
          blocks: [
            "We confirm that we have received the report, look into the matter within a reasonable time and tell you what we have done, as far as we can without breaching others' privacy. Only those who need to know in order to handle the case learn who you are.",
          ],
        },
        {
          heading: "Protection against retaliation",
          blocks: [
            "Retaliation against anyone who reports in a proper way is prohibited. This includes threats, harassment, unfair discrimination, warnings, reassignment, dismissal and summary dismissal. For hired workers, the prohibition applies both to us and to the business you are hired out to ([Working Environment Act section 2 A-4](https://lovdata.no/lov/2005-06-17-62/§2a-4)). Retaliation cases can be brought before the [Anti-Discrimination Tribunal](https://www.diskrimineringsnemnda.no).",
          ],
        },
      ],
    },
  },
};

const equality: SitePolicy = {
  path: "/equality",
  version: 1,
  updated: "2026-11-23",
  text: {
    no: {
      title: "Likestilling og ikke-diskriminering",
      description: "Hvordan ArbeidMatch vurderer kandidater, og hvor du kan klage.",
      lead: "Vi vurderer kandidater etter hva stillingen krever: erfaring, kompetanse, sertifikater, språk og tilgjengelighet.",
      sections: [
        {
          heading: "Ingen diskriminering",
          blocks: [
            "Vi diskriminerer ikke på grunn av kjønn, graviditet, permisjon ved fødsel eller adopsjon, omsorgsoppgaver, etnisitet, religion, livssyn, funksjonsnedsettelse, seksuell orientering, kjønnsidentitet, kjønnsuttrykk, alder eller kombinasjoner av disse ([likestillings- og diskrimineringsloven § 6](https://lovdata.no/lov/2017-06-16-51/§6)).",
            "Vi følger samme krav når vi rekrutterer for kunder, og vi tar ikke imot oppdrag som ber oss velge bort kandidater på disse grunnlagene.",
          ],
        },
        {
          heading: "Hva vi spør om",
          blocks: [
            {
              list: [
                "Vi spør ikke om graviditet, planer om barn, religion, livssyn, etnisitet, funksjonsnedsettelse, seksuell orientering, kjønnsidentitet eller kjønnsuttrykk ([likestillings- og diskrimineringsloven § 30](https://lovdata.no/lov/2017-06-16-51/§30)).",
                "Vi spør om statsborgerskap eller arbeidstillatelse bare for å kontrollere retten til å arbeide i Norge.",
                "Språkkrav stiller vi bare når stillingen trenger det.",
              ],
            },
          ],
        },
        {
          heading: "Hvis du mener du er forskjellsbehandlet",
          blocks: [
            "Si fra til oss gjennom [klageskjemaet](" + L("complaint", "no") + "). Vi svarer innen 30 dager, se [klagebehandling](/complaints).",
            "Du kan også klage til [Diskrimineringsnemnda](https://www.diskrimineringsnemnda.no) eller få gratis veiledning fra [Likestillings- og diskrimineringsombudet](https://www.ldo.no).",
          ],
        },
      ],
    },
    en: {
      title: "Equality and non-discrimination",
      description: "How ArbeidMatch assesses candidates, and where you can complain.",
      lead: "We assess candidates on what the job requires: experience, skills, certificates, languages and availability.",
      sections: [
        {
          heading: "No discrimination",
          blocks: [
            "We do not discriminate on the grounds of gender, pregnancy, leave in connection with birth or adoption, care responsibilities, ethnicity, religion, belief, disability, sexual orientation, gender identity, gender expression, age or combinations of these ([Equality and Anti-Discrimination Act section 6](https://lovdata.no/lov/2017-06-16-51/§6)).",
            "We apply the same standard when we recruit for clients, and we do not accept assignments that ask us to exclude candidates on these grounds.",
          ],
        },
        {
          heading: "What we ask",
          blocks: [
            {
              list: [
                "We do not ask about pregnancy, plans to have children, religion, belief, ethnicity, disability, sexual orientation, gender identity or gender expression ([Equality and Anti-Discrimination Act section 30](https://lovdata.no/lov/2017-06-16-51/§30)).",
                "We ask about citizenship or work permit only to check the right to work in Norway.",
                "We set language requirements only when the job needs them.",
              ],
            },
          ],
        },
        {
          heading: "If you believe you were treated unfairly",
          blocks: [
            "Tell us through the [complaint form](" + L("complaint", "en") + "). We answer within 30 days, see [complaints](/complaints?lang=en).",
            "You can also complain to the [Anti-Discrimination Tribunal](https://www.diskrimineringsnemnda.no) or get free guidance from the [Equality and Anti-Discrimination Ombud](https://www.ldo.no).",
          ],
        },
      ],
    },
  },
};

const codeOfConduct: SitePolicy = {
  path: "/code-of-conduct",
  version: 1,
  updated: "2026-11-23",
  text: {
    no: {
      title: "Etiske retningslinjer",
      description: "Hvordan ArbeidMatch og de som jobber for oss skal opptre overfor kandidater, kunder og hverandre.",
      lead: "Disse retningslinjene gjelder alle som jobber for ArbeidMatch Norge AS.",
      sections: [
        {
          heading: "Overfor kandidater",
          blocks: [
            {
              list: [
                "Vi gir riktig informasjon om stilling, arbeidssted, lønn og vilkår før en kandidat takker ja.",
                "Vi behandler alle kandidater likt, se [likestilling og ikke-diskriminering](/equality).",
                "Vi deler ikke en navngitt profil, CV eller kontaktopplysninger uten kandidatens tillatelse, se [personvernerklæringen](/privacy).",
              ],
            },
          ],
        },
        {
          heading: "Overfor kunder",
          blocks: [
            {
              list: [
                "Vi presenterer kandidater slik de er, uten å pynte på erfaring eller kvalifikasjoner.",
                "Vi holder avtaler og priser slik de er skrevet.",
              ],
            },
          ],
        },
        {
          heading: "I alt vi gjør",
          blocks: [
            {
              list: [
                "Ingen bestikkelser, og ingen gaver som kan påvirke en beslutning.",
                "Vi følger arbeidsmiljøloven, også reglene om likebehandling av innleide arbeidstakere.",
                "Vi bruker KI som et verktøy, og et menneske bestemmer, se [KI hos ArbeidMatch](/ai).",
                "Vi beskytter personopplysninger og deler dem bare når det er lovlig.",
                "Vi samarbeider bare med partnere i Europa.",
              ],
            },
          ],
        },
        {
          heading: "Si fra",
          blocks: [
            "Brudd på disse retningslinjene kan [varsles](/whistleblowing). Andre klager tar vi gjennom [klagebehandling](/complaints).",
          ],
        },
      ],
    },
    en: {
      title: "Code of conduct",
      description: "How ArbeidMatch and the people who work for us behave towards candidates, clients and each other.",
      lead: "This code applies to everyone who works for ArbeidMatch Norge AS.",
      sections: [
        {
          heading: "Towards candidates",
          blocks: [
            {
              list: [
                "We give accurate information about the job, workplace, pay and terms before a candidate accepts.",
                "We treat all candidates equally, see [equality and non-discrimination](/equality?lang=en).",
                "We do not share a named profile, CV or contact details without the candidate's permission, see the [Privacy Notice](/privacy?lang=en).",
              ],
            },
          ],
        },
        {
          heading: "Towards clients",
          blocks: [
            {
              list: [
                "We present candidates as they are, without embellishing experience or qualifications.",
                "We keep agreements and prices as they are written.",
              ],
            },
          ],
        },
        {
          heading: "In everything we do",
          blocks: [
            {
              list: [
                "No bribes, and no gifts that could influence a decision.",
                "We follow the Working Environment Act, including the equal treatment rules for hired workers.",
                "We use AI as a tool, and a person decides, see [AI at ArbeidMatch](/ai?lang=en).",
                "We protect personal data and share it only where the law allows.",
                "We work only with partners in Europe.",
              ],
            },
          ],
        },
        {
          heading: "Speak up",
          blocks: [
            "Breaches of this code can be [reported](/whistleblowing?lang=en). Other complaints go through our [complaints procedure](/complaints?lang=en).",
          ],
        },
      ],
    },
  },
};

const complaints: SitePolicy = {
  path: "/complaints",
  version: 1,
  updated: "2026-11-23",
  text: {
    no: {
      title: "Klagebehandling",
      description: "Slik klager du til ArbeidMatch, og når du får svar.",
      lead: "Er du misfornøyd med hvordan vi har behandlet deg, som kandidat, kunde eller samarbeidspartner, vil vi vite det.",
      sections: [
        {
          heading: "Slik klager du",
          blocks: [
            "Send klagen gjennom [klageskjemaet](" + L("complaint", "no") + "). Skriv hva som skjedde, når, og hva du ønsker at vi gjør.",
          ],
        },
        {
          heading: "Når du får svar",
          blocks: [
            {
              list: [
                "Du får en kvittering på e-post når klagen er mottatt.",
                "Vi svarer skriftlig innen 30 dager. Trenger vi mer tid, sier vi fra innen samme frist om hvorfor og når svaret kommer.",
                "Informasjonskrav etter åpenhetsloven svarer vi på innen tre uker, se [åpenhetsloven](/transparency-act).",
                "Henvendelser om personopplysninger svarer vi på innen en måned, slik personvernforordningen krever.",
              ],
            },
          ],
        },
        {
          heading: "Hvis du ikke er fornøyd med svaret",
          blocks: [
            {
              list: [
                "Personvern: [Datatilsynet](https://www.datatilsynet.no).",
                "Diskriminering og gjengjeldelse ved varsling: [Diskrimineringsnemnda](https://www.diskrimineringsnemnda.no).",
                "Arbeidsforhold og bemanning: [Arbeidstilsynet](https://www.arbeidstilsynet.no).",
                "Som forbruker: [Forbrukertilsynet](https://www.forbrukertilsynet.no).",
              ],
            },
          ],
        },
      ],
    },
    en: {
      title: "Complaints",
      description: "How to complain to ArbeidMatch, and when you will get an answer.",
      lead: "If you are unhappy with how we have treated you, as a candidate, client or partner, we want to know.",
      sections: [
        {
          heading: "How to complain",
          blocks: [
            "Send your complaint through the [complaint form](" + L("complaint", "en") + "). Say what happened, when, and what you would like us to do.",
          ],
        },
        {
          heading: "When you get an answer",
          blocks: [
            {
              list: [
                "You receive a receipt by e-mail when the complaint arrives.",
                "We answer in writing within 30 days. If we need more time, we tell you within the same deadline why and when to expect the answer.",
                "Information requests under the Transparency Act are answered within three weeks, see [Transparency Act](/transparency-act?lang=en).",
                "Requests about personal data are answered within one month, as GDPR requires.",
              ],
            },
          ],
        },
        {
          heading: "If you are not satisfied with our answer",
          blocks: [
            {
              list: [
                "Privacy: [Datatilsynet](https://www.datatilsynet.no).",
                "Discrimination, and retaliation for whistleblowing: [Anti-Discrimination Tribunal](https://www.diskrimineringsnemnda.no).",
                "Working conditions and staffing: [Arbeidstilsynet](https://www.arbeidstilsynet.no).",
                "As a consumer: [Forbrukertilsynet](https://www.forbrukertilsynet.no).",
              ],
            },
          ],
        },
      ],
    },
  },
};

export const SITE_POLICIES = { transparencyAct, ai, whistleblowing, equality, codeOfConduct, complaints } as const;

export type HubEntry = { href: string; title: Record<LegalLanguage, string>; summary: Record<LegalLanguage, string> };

/** Every policy the company publishes, in the order the hub shows them. */
export const LEGAL_HUB_ENTRIES: readonly HubEntry[] = [
  { href: "/privacy", title: { no: "Personvernerklæring", en: "Privacy Notice" }, summary: { no: "Hvilke personopplysninger vi behandler, hvorfor, og rettighetene dine.", en: "What personal data we process, why, and your rights." } },
  { href: "/terms", title: { no: "Vilkår", en: "Terms" }, summary: { no: "Vilkårene for å bruke nettstedet og tjenestene våre.", en: "The terms for using our website and services." } },
  { href: "/cookies", title: { no: "Informasjonskapsler", en: "Cookies" }, summary: { no: "Hva nettstedet lagrer på enheten din.", en: "What the website stores on your device." } },
  { href: "/dpa", title: { no: "Databehandleravtale", en: "Data Processing Agreement" }, summary: { no: "Vilkårene når vi behandler opplysninger for en annen virksomhet.", en: "The terms when we process data for another organisation." } },
  ...Object.values(SITE_POLICIES).map((p) => ({
    href: p.path,
    title: { no: p.text.no.title, en: p.text.en.title },
    summary: { no: p.text.no.description, en: p.text.en.description },
  })),
];
