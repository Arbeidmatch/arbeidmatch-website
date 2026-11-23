import type { Metadata } from "next";
import Link from "next/link";

import LegalHtmlLang from "@/components/legal/LegalHtmlLang";
import { PolicyLanguagePills } from "@/components/legal/SitePolicyPage";
import { parseLegalLanguage } from "@/lib/legalPageLanguage";
import { legalPageMetadata } from "@/lib/legalPageMetadata";
import { COMPANY, LEGAL_HUB_ENTRIES, STAFFING_REGISTER_URL, legalRequestHref } from "@/lib/sitePolicies";

const PATH = "/legal";

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return legalPageMetadata(PATH, parseLegalLanguage((await searchParams).lang), {
    no: {
      title: "Juridisk og retningslinjer | ArbeidMatch",
      description: "Alle retningslinjene til ArbeidMatch Norge AS på ett sted, og én vei for spørsmål og klager.",
    },
    en: {
      title: "Legal and policies | ArbeidMatch",
      description: "Every policy of ArbeidMatch Norge AS in one place, and one route for questions and complaints.",
    },
  });
}

/**
 * The legal hub (ORDER 424): every policy the company publishes, the company's
 * official details with the register entry, and the legal request form as the
 * one contact route, opened on the kind the reader picks.
 */
export default async function LegalHubPage({ searchParams }: Props) {
  const language = parseLegalLanguage((await searchParams).lang);
  const no = language === "no";
  const lang = no ? "nb" : "en";
  const q = no ? "" : "?lang=en";
  const routes = [
    { kind: "complaint", label: no ? "Klage" : "Complaint" },
    { kind: "transparency", label: no ? "Informasjonskrav (åpenhetsloven)" : "Transparency Act request" },
    { kind: "ai", label: no ? "Spørsmål om KI" : "Question about AI" },
    { kind: "whistleblowing", label: no ? "Varsling" : "Whistleblowing" },
  ];
  return (
    <div className="ams page" lang={lang}>
      <LegalHtmlLang lang={lang} />
      <section className="dark band">
        <div className="w" style={{ maxWidth: 880 }}>
          <span className="eb">{no ? "Juridisk" : "Legal"}</span>
          <h1>{no ? "Juridisk og retningslinjer" : "Legal and policies"}</h1>
          <p className="lede">
            {COMPANY.name} · Org.nr {COMPANY.orgNumber} · {COMPANY.address}
          </p>
        </div>
      </section>
      <section className="sec">
        <div className="w" style={{ maxWidth: 880 }}>
          <PolicyLanguagePills path={PATH} current={language} />
          <article className="card ldoc" lang={lang} style={{ marginTop: 24 }}>
            <h2 style={{ marginTop: 0 }}>{no ? "Retningslinjer" : "Policies"}</h2>
            <ul>
              {LEGAL_HUB_ENTRIES.map((entry) => (
                <li key={entry.href}>
                  <Link href={`${entry.href}${entry.href === "/dpa" ? "" : q}`}>{entry.title[language]}</Link>
                  {" - "}
                  {entry.summary[language]}
                </li>
              ))}
            </ul>
            <h2>{no ? "Godkjent bemanningsforetak" : "Approved staffing agency"}</h2>
            <p>
              {no
                ? "ArbeidMatch Norge AS er registrert i Arbeidstilsynets register over godkjente bemanningsforetak. "
                : "ArbeidMatch Norge AS is listed in the Norwegian Labour Inspection Authority's register of approved staffing agencies. "}
              <a href={STAFFING_REGISTER_URL} target="_blank" rel="noopener noreferrer">
                {no ? "Se oppføringen i registeret" : "See our entry in the register"}
              </a>
              .
            </p>
            <h2>{no ? "Kontakt oss" : "Contact us"}</h2>
            <p>
              {no
                ? "Spørsmål, klager, informasjonskrav, spørsmål om KI og varsler sendes gjennom ett skjema. Velg hva det gjelder:"
                : "Questions, complaints, information requests, questions about AI and whistleblowing reports all go through one form. Choose what it is about:"}
            </p>
            <div className="cta" style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 12 }}>
              {routes.map((r) => (
                <Link key={r.kind} className="btn ghost" href={legalRequestHref(r.kind, language)}>
                  {r.label}
                </Link>
              ))}
              <Link className="btn gold" href={`/legal-request?lang=${language}`}>
                {no ? "Annen juridisk henvendelse" : "Other legal request"}
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
