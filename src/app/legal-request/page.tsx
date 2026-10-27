import type { Metadata } from "next";

import LegalHtmlLang from "@/components/legal/LegalHtmlLang";
import { LegalLanguageSwitch } from "@/components/legal/LegalLanguageSwitch";
import { parseLegalLanguage } from "@/lib/legalPageLanguage";
import { legalPageMetadata } from "@/lib/legalPageMetadata";
import LegalRequestForm from "./LegalRequestForm";

const PATH = "/legal-request";

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return legalPageMetadata(PATH, parseLegalLanguage((await searchParams).lang), {
    no: {
      title: "Juridisk henvendelse | ArbeidMatch",
      description: "Send en henvendelse om personvern eller en juridisk sak til ArbeidMatch Norge AS.",
    },
    en: {
      title: "Legal Request | ArbeidMatch",
      description: "Submit a GDPR rights request or legal inquiry to ArbeidMatch Norge AS.",
    },
  });
}

export default async function LegalRequestPage({ searchParams }: Props) {
  const language = parseLegalLanguage((await searchParams).lang);
  return (
    <section className="min-h-[60vh] bg-white text-[#0D1B2A]">
      <LegalHtmlLang lang={language === "no" ? "nb" : "en"} />
      <div className="mx-auto w-full max-w-[640px] px-6 py-12 md:px-12">
        <LegalLanguageSwitch path={PATH} current={language} />
        {/* Keyed by language so the first request type follows the switch. */}
        <LegalRequestForm key={language} language={language} />
      </div>
    </section>
  );
}
