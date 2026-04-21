import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Staffing Agency Trondheim - EU/EEA Workforce",
  description:
    "Staffing in Trondheim for construction, industry, and logistics. EU/EEA recruitment with documented candidate quality.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-trondheim" },
};

export default function BemanningsbyraTrondheimPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Location page</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Trondheim staffing for projects across technology, construction, and operations
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            The Trondheim region combines marine industry, city development, and industrial growth. ArbeidMatch is based
            in Ranheim and supports Trondheim staffing with close follow-up, clear screening, and practical role matching.
          </p>
          <p>
            Typical assignments include construction, logistics, and production. Learn about{" "}
            <Link href="/dsb-support" className="font-medium text-gold hover:underline">
              DSB authorization
            </Link>{" "}
            where relevant, or send a staffing{" "}
            <Link href="/request" className="font-medium text-gold hover:underline">
              request
            </Link>
            .
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-[#C9A84C]">
          <h2 className="text-lg font-semibold text-navy">Typical roles in the region</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Concrete and carpentry support for residential and commercial projects</li>
            <li>Industrial operators for process and packaging lines</li>
            <li>Warehouse and forklift teams for logistics hubs</li>
            <li>Scaffolding and setup crews for infrastructure contractors</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Local presence", "Fast coordination with hiring teams and project leads in Mid-Norway."],
            ["Safety expectations", "Structured screening aligned with strict safety requirements."],
            ["Contract clarity", "Clear delivery scope so HR and site management stay aligned."],
          ].map(([t, b]) => (
            <article
              key={t}
              className="rounded-xl border border-border bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#C9A84C]"
              style={{ padding: "28px 24px" }}
            >
              <h3 className="text-base font-semibold text-navy">{t}</h3>
              <p className="mt-2 text-sm text-text-secondary">{b}</p>
            </article>
          ))}
        </section>
        <section className="mx-auto mt-10 max-w-[800px] px-0 md:px-4">
          <h2 className="am-h3 font-semibold text-navy">Quick FAQ</h2>
          <p className="mt-3 text-sm text-text-secondary">
            How fast can staffing start? It depends on role and market availability, and we set realistic timelines early.
          </p>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Construction" },
            { href: "/bemanning-logistikk", label: "Logistics" },
            { href: "/bemanning-industri", label: "Industry" },
            { href: "/about", label: "About ArbeidMatch" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Contact us for staffing in Trondheim - we start from your requirements and deliver profiles prepared for local
          working conditions.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[48px] w-full items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Send request
          </Link>
          <Link
            href="/for-employers"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy sm:w-auto"
          >
            Learn more for employers
          </Link>
        </div>
      </div>
    </article>
  );
}
