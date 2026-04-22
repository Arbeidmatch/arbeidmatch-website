import Link from "next/link";
import DsbApplicationChecklist from "@/components/dsb/DsbApplicationChecklist";
import DsbEmployerGuide from "@/components/dsb/DsbEmployerGuide";
import DsbPillarFromMarkdown from "@/components/dsb/DsbPillarFromMarkdown";
import DsbRequestPopup from "@/components/dsb/DsbRequestPopup";
import DsbCompleteGuide from "@/components/dsb/DsbCompleteGuide";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";
import DsbPublicOverviewBar from "@/components/dsb/DsbPublicOverviewBar";
import DsbTypeSelectorLoader from "@/app/dsb-support/DsbTypeSelectorLoader";

const GOLD = "#C9A84C";
const NAVY = "#0a1222";

/**
 * Full DSB Authorization Guide (same substance as the former /dsb-support page),
 * rendered only on /electricians-norway for a single canonical public entry point.
 */
export default function ElectriciansDsbAuthorizationGuide() {
  return (
    <div
      id="dsb-authorization-guide"
      className="scroll-mt-[calc(4rem+8px)] border-t-2 border-[rgba(201,168,76,0.35)]"
      style={{ background: `linear-gradient(180deg, ${NAVY} 0%, #0f1c30 40%, #0D1B2A 100%)` }}
    >
      <DsbTypeSelectorLoader disableAutoOpen />
      <section className="border-b border-[rgba(201,168,76,0.12)] px-4 py-10 text-white md:px-6 md:py-14" style={{ background: NAVY }}>
        <div className="mx-auto w-full max-w-content">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: GOLD }}>
            DSB Authorization Guide
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            DSB authorisation for foreign electricians in Norway: complete overview
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/75">
            Employers need reliable documentation before electrical work starts. This guide explains DSB authorisation for
            foreign electricians in practical terms, with emphasis on process, documentation, and realistic timelines.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">
            ArbeidMatch is a private recruitment and guidance company. We do not process DSB applications and we are not an
            official Norwegian authority. Official application processing and decisions are handled only by DSB.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dsb-support/eu"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-[#0f1923] transition hover:brightness-110"
              style={{ background: `linear-gradient(180deg, #e4c56a 0%, ${GOLD} 45%, #a88a3a 100%)` }}
            >
              EU/EEA paid guide & checkout
            </Link>
            <Link
              href="/dsb-support/non-eu"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[rgba(201,168,76,0.45)] bg-transparent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[rgba(201,168,76,0.08)]"
            >
              Outside EU/EEA paid guide & checkout
            </Link>
            <Link
              href="https://www.dsb.no/en/Electrical-safety/kvalifikasjoner-foretak-og-virksomhet/Apply-for-approval-as-electrical-professionals-in-Norway/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center text-sm font-semibold underline underline-offset-4"
              style={{ color: GOLD }}
            >
              Official DSB application (external)
            </Link>
            <Link href="/contact" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-white/80 underline hover:text-white">
              Contact ArbeidMatch
            </Link>
          </div>
        </div>
      </section>
      <div className="border-b border-[rgba(201,168,76,0.1)] bg-white">
        <DsbPublicOverviewBar />
      </div>
      <section className="bg-[#f4f6f9]">
        <DsbPillarFromMarkdown />
      </section>
      <SeeAlsoSection
        variant="white"
        items={[
          { href: "/for-employers", label: "For employers" },
          { href: "/for-candidates", label: "For candidates" },
          { href: "/electricians-norway", label: "Electricians in Norway (this page)" },
          { href: "/bemanningsbyrå-trondheim", label: "Bemanning Trondheim" },
        ]}
      />
      <DsbEmployerGuide />
      <DsbApplicationChecklist />
      <DsbRequestPopup />
      <DsbCompleteGuide />
    </div>
  );
}
