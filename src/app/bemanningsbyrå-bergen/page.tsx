import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Staffing Bergen - Maritime and Construction",
  description:
    "Staffing in Bergen for shipyard, logistics, and construction operations. EU/EEA recruitment with verified documentation.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-bergen" },
};

export default function BemanningsbyraBergenPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Location page</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bergen staffing where maritime operations and city development meet
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Bergen combines maritime logistics, marine technology, and complex construction projects. ArbeidMatch supports
            staffing in Bergen with verified EU/EEA experience, safety-aware screening, and predictable onboarding.
          </p>
          <p>
            We clarify certifications, language expectations, and practical role fit early. Contact us through a staffing{" "}
            <Link href="/request" className="font-medium text-gold hover:underline">
              request
            </Link>{" "}
            or read more for{" "}
            <Link href="/for-employers" className="font-medium text-gold hover:underline">
              employers
            </Link>
            .
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-[#C9A84C]">
          <h2 className="text-lg font-semibold text-navy">Typical roles in the Bergen region</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Maritime welders and surface preparation teams</li>
            <li>Scaffolding and setup crews for infrastructure and industry</li>
            <li>Warehouse and terminal workers for port and road logistics</li>
            <li>Construction trades for dense urban development projects</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Maritime understanding", "Candidates are matched to shipyard, port, and logistics realities."],
            ["Documentation quality", "We prioritize clean documentation flow for procurement and audits."],
            ["Local + national reach", "Regional insight combined with EU/EEA sourcing capabilities."],
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
            Do you cover the full Vestland area? Yes - we assess projects nationally while screening for local context.
          </p>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Construction" },
            { href: "/bemanning-horeca", label: "HoReCa" },
            { href: "/for-employers", label: "For employers" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Contact us for staffing in Bergen - we start with your project constraints and deliver clear candidate profiles.
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
            For employers
          </Link>
        </div>
      </div>
    </article>
  );
}
