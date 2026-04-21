import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Staffing Stavanger - Energy and Industry",
  description:
    "Staffing in Stavanger for energy, industry, and logistics projects. EU/EEA recruitment with documented worker profiles.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-stavanger" },
};

export default function BemanningsbyraStavangerPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Location page</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Stavanger staffing where safety requirements and project pace must align
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Rogaland is a high-activity region for energy, supplier industry, and maritime operations. We deliver
            Stavanger staffing with clear pre-screening for training, access requirements, and role fit.
          </p>
          <p>
            We recruit from the EU/EEA for regulated environments and project-based teams. Reach out through a staffing{" "}
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
          <h2 className="text-lg font-semibold text-navy">In-demand roles in Rogaland</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Industrial and maintenance support workers with documented experience</li>
            <li>Welding and mechanical support for workshops and modular construction</li>
            <li>Logistics and forklift roles linked to port and transport operations</li>
            <li>Construction trades for residential and commercial projects</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Safety requirements", "Candidates are matched to documentation and safety expectations."],
            ["Operational follow-up", "Fast coordination once procurement and safety scope are agreed."],
            ["Realistic promises", "Delivery depends on market conditions and role complexity."],
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
            Do you cover offshore roles? It depends on required training and authorizations, which we verify first.
          </p>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-industri", label: "Industry & production" },
            { href: "/bemanning-logistikk", label: "Logistics" },
            { href: "/for-employers", label: "For employers" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Contact us for staffing in Stavanger - we align safety requirements with realistic recruitment delivery.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[48px] w-full items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Clarify staffing needs
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center text-sm font-semibold text-gold underline sm:w-auto"
          >
            Contact us
          </Link>
        </div>
      </div>
    </article>
  );
}
