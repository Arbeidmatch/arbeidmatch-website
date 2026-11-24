import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import LegalHtmlLang from "@/components/legal/LegalHtmlLang";
import { LEGAL_LANGUAGES, LEGAL_LANGUAGE_LABEL, legalLanguageHref, type LegalLanguage } from "@/lib/legalPageLanguage";
import { legalPageMetadata } from "@/lib/legalPageMetadata";
import { getSiteNumbers, staffingRegisterUrl, text as numberText } from "@/lib/numbers";
import { STAFFING_REGISTER_HREF, type SitePolicy } from "@/lib/sitePolicies";

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * A sentence with [text](href) links in it; outside links open in a new tab.
 * The register link takes its address from registerUrl (built from RecOS's org
 * number, ORDER 302); with none, its words stay as plain text.
 */
export function PolicyInline({ text, registerUrl = null }: { text: string; registerUrl?: string | null }): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [, label, rawHref] = m;
    const href = rawHref === STAFFING_REGISTER_HREF ? registerUrl : rawHref;
    out.push(
      !href ? (
        label
      ) : href.startsWith("/") ? (
        <Link key={at} href={href}>
          {label}
        </Link>
      ) : (
        <a key={at} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      ),
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

export function policyDate(iso: string, language: LegalLanguage): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(language === "no" ? "nb-NO" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Oslo",
  });
}

/** Norsk / English as the two pills of the site template, plain links that work without script. */
export function PolicyLanguagePills({ path, current }: { path: string; current: LegalLanguage }) {
  return (
    <nav aria-label="Språk / Language" className="pills" style={{ marginTop: 0 }}>
      {LEGAL_LANGUAGES.map((l) => (
        <Link key={l} className="pill" href={legalLanguageHref(path, l)} hrefLang={l} lang={l} aria-current={l === current ? "true" : undefined}>
          {LEGAL_LANGUAGE_LABEL[l]}
        </Link>
      ))}
    </nav>
  );
}

/**
 * One policy written on this site (ORDER 424), on the same template as the
 * platform's documents: title and version line in the dark band, Norsk /
 * English pills, the text in one card, and the legal request form as the
 * one way to reach us.
 */
export async function SitePolicyPage({ policy, language }: { policy: SitePolicy; language: LegalLanguage }) {
  const registerUrl = staffingRegisterUrl(numberText(await getSiteNumbers(), "company_org_number"));
  const t = policy.text[language];
  const no = language === "no";
  const lang = no ? "nb" : "en";
  return (
    <div className="ams page" lang={lang}>
      <LegalHtmlLang lang={lang} />
      <section className="dark band">
        <div className="w" style={{ maxWidth: 880 }}>
          <span className="eb">{no ? "Juridisk" : "Legal"}</span>
          <h1>{t.title}</h1>
          <p className="lede">
            {no ? "Versjon" : "Version"} {policy.version} · {no ? "Sist oppdatert" : "Last updated"}: {policyDate(policy.updated, language)}
          </p>
        </div>
      </section>
      <section className="sec">
        <div className="w" style={{ maxWidth: 880 }}>
          <PolicyLanguagePills path={policy.path} current={language} />
          <article className="card ldoc" lang={lang} style={{ marginTop: 24 }}>
            <p>{t.lead}</p>
            {t.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.blocks.map((block, i) =>
                  typeof block === "string" ? (
                    <p key={i}>
                      <PolicyInline text={block} registerUrl={registerUrl} />
                    </p>
                  ) : (
                    <ul key={i}>
                      {block.list.map((item) => (
                        <li key={item}>
                          <PolicyInline text={item} registerUrl={registerUrl} />
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}
            <div className="cta" style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link className="btn gold" href={`/legal-request?lang=${language}`}>
                {no ? "Har du et juridisk spørsmål? Kontakt oss" : "Have a legal question? Contact us"}
              </Link>
              <Link className="btn ghost" href={no ? "/legal" : "/legal?lang=en"}>
                {no ? "Alle retningslinjer" : "All policies"}
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

/** The page's metadata, in the language asked for, with hreflang no / en. */
export function sitePolicyMetadata(policy: SitePolicy, language: LegalLanguage): Metadata {
  const t = policy.text;
  return legalPageMetadata(policy.path, language, {
    no: { title: `${t.no.title} | ArbeidMatch`, description: t.no.description },
    en: { title: `${t.en.title} | ArbeidMatch`, description: t.en.description },
  });
}
