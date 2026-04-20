import type { Metadata } from "next";
import Link from "next/link";
import AboutJsonLd from "@/components/about/AboutJsonLd";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/about",
  "About ArbeidMatch | EU/EEA workforce for Norway",
  "ArbeidMatch connects qualified EU/EEA workers with Norwegian employers in construction, logistics, industry and more. Based in Trondheim.",
);

const values = [
  {
    title: "Compliance first",
    body: "Norwegian labor rules and documentation are built into how we work, so employers and candidates can move forward with confidence.",
  },
  {
    title: "Speed",
    body: "We streamline screening and matching so roles are filled without unnecessary delay.",
  },
  {
    title: "Transparency",
    body: "Clear expectations, honest communication, and no surprises in the hiring process.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <AboutJsonLd />
      <div className="bg-[#0D1B2A] text-white">
        <section
          className="relative overflow-hidden border-b border-[rgba(201,168,76,0.12)] py-16 md:py-24"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, #0D1B2A 55%)",
          }}
        >
          <div className="mx-auto max-w-content px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto h-[3px] w-12 rounded-full bg-[#C9A84C]" aria-hidden />
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">About ArbeidMatch</h1>
              <p className="mt-5 text-lg text-[rgba(255,255,255,0.7)]">
                We connect qualified EU/EEA workers with Norwegian employers in blue-collar industries. Fast, compliant,
                and built on trust.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-content px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-6 text-[rgba(255,255,255,0.75)] md:text-lg">
              <h2 className="text-2xl font-bold text-white md:text-3xl">Mission</h2>
              <p>
                We connect qualified EU/EEA workers with Norwegian employers in blue-collar industries. Fast,
                compliant, and built on trust.
              </p>
              <h2 className="pt-4 text-2xl font-bold text-white md:text-3xl">Who we are</h2>
              <p>
                ArbeidMatch Norge AS was founded by Mirel Manoliu. We are based in Trondheim and work with businesses
                across Norway.
              </p>
              <h2 className="pt-4 text-2xl font-bold text-white md:text-3xl">What we do</h2>
              <p>
                Recruitment and staffing for construction, logistics, industry, cleaning, hospitality, and healthcare,
                matching the right people with the right roles.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-[rgba(201,168,76,0.12)] py-14 md:py-20">
          <div className="mx-auto max-w-content px-4 md:px-6">
            <h2 className="text-center text-2xl font-bold text-white md:text-3xl">Values</h2>
            <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              {values.map((v) => (
                <article
                  key={v.title}
                  className="flex h-full flex-col rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-8"
                >
                  <h3 className="text-lg font-bold text-[#C9A84C]">{v.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[rgba(255,255,255,0.7)]">{v.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[rgba(201,168,76,0.12)] bg-[rgba(255,255,255,0.02)] py-14 md:py-20">
          <div className="mx-auto flex max-w-content flex-col items-center justify-center gap-4 px-4 text-center md:flex-row md:gap-6 md:px-6">
            <Link
              href="/request"
              className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-[10px] bg-[#C9A84C] px-8 py-3 text-sm font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
            >
              Work with us
            </Link>
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.35)] px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-[#C9A84C]"
            >
              Browse jobs
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
