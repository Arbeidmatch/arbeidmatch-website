import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { nbPageMetadata } from "@/lib/nbPageMetadata";

const DPA_TITLE = "Data Processing Agreement | ArbeidMatch";
const DPA_DESCRIPTION =
  "Standard GDPR Article 28 data processing agreement template for ArbeidMatch partners and clients.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

const dpaBase = nbPageMetadata("/dpa", DPA_TITLE, DPA_DESCRIPTION);

export const metadata: Metadata = {
  ...dpaBase,
  robots: { index: true, follow: true },
  openGraph: {
    ...dpaBase.openGraph,
    images: [OG_IMAGE],
  },
  twitter: {
    ...dpaBase.twitter,
    images: ["/og-image.png"],
  },
};

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-10 border-b border-[#C9A84C]/35 pb-2 font-display text-lg font-semibold tracking-tight text-[#C9A84C]">
      {children}
    </h2>
  );
}

export default function DpaPage() {
  return (
    <section className="bg-[#eef1f5] py-12 md:py-20">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <article
          lang="en"
          className="mx-auto max-w-[720px] space-y-4 text-[15px] leading-[1.65] text-[#0D1B2A]"
        >
          <header className="space-y-3">
            <p className="text-sm font-medium text-[#0D1B2A]/70">Last updated: 2 May 2026</p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#0D1B2A] md:text-[2rem]">
              Data Processing Agreement
            </h1>
            <p className="text-base text-[#0D1B2A]/85">Standard terms for partners and clients of ArbeidMatch Norge AS</p>
          </header>

          <p className="rounded-lg border border-[#C9A84C]/45 bg-[#C9A84C]/12 p-4 text-sm leading-relaxed text-[#0D1B2A]">
            This is a template DPA. The final binding version will be signed electronically through our partner portal.
          </p>

          <section>
            <H2>1. Parties</H2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Data Controller:</strong> Client or Partner (identified upon signature).
              </li>
              <li>
                <strong>Data Processor:</strong> ArbeidMatch Norge AS, Org.nr 935 667 089 MVA, Sverre Svendsens veg 38, 7056
                Ranheim, Trondheim, Norway.
              </li>
            </ul>
          </section>

          <section>
            <H2>2. Subject Matter and Duration</H2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Recruitment services for EU/EEA candidates to Norwegian employers.</li>
              <li>
                <strong>Duration:</strong> the term of the underlying service agreement between the parties.
              </li>
            </ul>
          </section>

          <section>
            <H2>3. Nature and Purpose of Processing</H2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Sourcing, screening, and presenting candidate profiles.</li>
              <li>Communication coordination between candidates, clients, and ArbeidMatch.</li>
              <li>Contract administration related to recruitment services.</li>
            </ul>
          </section>

          <section>
            <H2>4. Categories of Data Subjects</H2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Job candidates (EU/EEA citizens).</li>
              <li>Client representatives.</li>
            </ul>
          </section>

          <section>
            <H2>5. Categories of Personal Data</H2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Identification:</strong> name, email, phone, nationality, date of birth.
              </li>
              <li>
                <strong>Professional:</strong> CV, work history, skills, certifications, driving licence.
              </li>
              <li>
                <strong>Status:</strong> D-number, work permit status.
              </li>
              <li>
                <strong>Special categories:</strong> not processed under this agreement.
              </li>
            </ul>
          </section>

          <section>
            <H2>6. Obligations of the Processor</H2>
            <p className="mt-3">The Processor shall:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Process personal data only on documented instructions from the Controller, unless required by EU or
                Member State law.</li>
              <li>Ensure that persons authorised to process personal data are bound by confidentiality.</li>
              <li>Implement appropriate technical and organisational measures pursuant to Article 32 GDPR.</li>
              <li>
                Not engage another processor without prior general written authorisation of the Controller; maintain an
                up-to-date list of sub-processors.
              </li>
              <li>Assist the Controller by appropriate technical and organisational measures in responding to requests for
                exercising data subjects&apos; rights.</li>
              <li>Assist the Controller in ensuring compliance with obligations regarding personal data breach notification.</li>
              <li>At the choice of the Controller, delete or return all personal data after the end of the provision of
                services, and delete existing copies unless Union or Member State law requires storage.</li>
              <li>Make available to the Controller all information necessary to demonstrate compliance and allow for audits,
                including inspections.</li>
            </ul>
          </section>

          <section>
            <H2>7. Sub-Processors (current list)</H2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Supabase (database hosting), EU.</li>
              <li>Vercel (web hosting), EU/US with Standard Contractual Clauses.</li>
              <li>one.com (email), EU.</li>
              <li>Google Analytics 4 (analytics, opt-in only), US with Standard Contractual Clauses.</li>
            </ul>
          </section>

          <section>
            <H2>8. International Transfers</H2>
            <p className="mt-3">
              Personal data is transferred within the EU/EEA where possible. Transfers outside the EU/EEA are subject to an
              appropriate safeguard, including Standard Contractual Clauses adopted by the European Commission (Decision
              2021/914) where applicable.
            </p>
          </section>

          <section>
            <H2>9. Data Subject Rights</H2>
            <p className="mt-3">
              Data subjects may exercise rights under Articles 15 to 22 GDPR. The Processor assists the Controller with
              reasonable technical and organisational measures, taking into account the nature of processing.
            </p>
          </section>

          <section>
            <H2>10. Personal Data Breach</H2>
            <p className="mt-3">
              The Processor shall notify the Controller without undue delay and in any event within 48 hours of becoming
              aware of a personal data breach, with information required under Article 33 GDPR where available.
            </p>
          </section>

          <section>
            <H2>11. Data Protection Impact Assessment</H2>
            <p className="mt-3">
              Where a data protection impact assessment is required, the Processor provides reasonable assistance to the
              Controller with regard to the processing.
            </p>
          </section>

          <section>
            <H2>12. Audits and Inspections</H2>
            <p className="mt-3">
              The Controller has the right to audit the Processor&apos;s compliance with this agreement at least once per
              calendar year, subject to reasonable prior written notice and without disrupting operations beyond what is
              necessary.
            </p>
          </section>

          <section>
            <H2>13. Liability and Indemnification</H2>
            <p className="mt-3">Liability and indemnification are governed by the underlying service agreement.</p>
          </section>

          <section>
            <H2>14. Termination</H2>
            <p className="mt-3">
              Upon termination of the underlying service agreement, the Processor shall, at the Controller&apos;s choice,
              delete or return all personal data within 30 days, unless Union or Member State law requires retention.
            </p>
          </section>

          <section>
            <H2>15. Governing Law and Jurisdiction</H2>
            <p className="mt-3">
              This agreement is governed by Norwegian law. Disputes shall be submitted to Trøndelag tingrett.
            </p>
          </section>

          <section>
            <H2>16. Contact</H2>
            <p className="mt-3">
              ArbeidMatch Norge AS
              <br />
              post@arbeidmatch.no
            </p>
          </section>

          <section className="border-t border-[#0D1B2A]/15 pt-8">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0D1B2A]/60">Related legal documents</p>
            <p className="mt-3 text-[15px]">
              <Link href="/privacy" className="font-medium text-[#C9A84C] underline decoration-[#C9A84C]/50 underline-offset-2 hover:decoration-[#C9A84C]">
                Privacy Policy
              </Link>
              <span className="mx-2 text-[#0D1B2A]/40">·</span>
              <Link href="/terms" className="font-medium text-[#C9A84C] underline decoration-[#C9A84C]/50 underline-offset-2 hover:decoration-[#C9A84C]">
                Terms of Service
              </Link>
            </p>
          </section>

          <div className="pt-4">
            <Link
              href="/contact?subject=DPA"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
            >
              Request signing copy
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
