import Link from "next/link";

import { LEGAL_LANGUAGES, LEGAL_LANGUAGE_LABEL, legalLanguageHref, type LegalLanguage } from "@/lib/legalPageLanguage";

/** Norsk / English as two plain links: no script, so it works before anything has loaded. */
export function LegalLanguageSwitch({ path, current }: { path: string; current: LegalLanguage }) {
  return (
    <nav aria-label="Språk / Language" className="mb-6 flex items-center gap-1 text-[14px]">
      {LEGAL_LANGUAGES.map((lang) => (
        <Link
          key={lang}
          href={legalLanguageHref(path, lang)}
          hrefLang={lang}
          lang={lang}
          aria-current={lang === current ? "true" : undefined}
          className={`inline-flex min-h-[44px] items-center rounded-[4px] px-3 font-semibold ${
            lang === current ? "bg-[#C9A84C]/20 text-[#0D1B2A]" : "text-[#0D1B2A]/60 hover:text-[#0D1B2A]"
          }`}
        >
          {LEGAL_LANGUAGE_LABEL[lang]}
        </Link>
      ))}
    </nav>
  );
}
