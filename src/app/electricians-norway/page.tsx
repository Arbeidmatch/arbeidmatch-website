import Link from "next/link";
import type { Metadata } from "next";

const SITE = "https://www.arbeidmatch.no";

export const metadata: Metadata = {
  title: "Work as an Electrician in Norway | ArbeidMatch",
  description:
    "Information for qualified EU/EEA electricians who want to work in Norway, including DSB authorization, qualification recognition, and key requirements.",
  alternates: {
    canonical: `${SITE}/electricians-norway`,
  },
};

export default function ElectriciansNorwayPage() {
  return (
    <main className="bg-[#0D1B2A] text-white">
      <section className="border-b border-[rgba(201,168,76,0.15)] py-16 md:py-24">
        <div className="mx-auto w-full max-w-content px-6 text-center md:px-12 lg:px-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">EU/EEA Electricians</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-extrabold tracking-tight md:text-5xl">
            Work as an Electrician in Norway
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            Explore clear information about opportunities in Norway for qualified electricians from EU and EEA countries.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto grid w-full max-w-content gap-6 px-6 md:px-12 lg:px-20">
          <article className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-7 md:p-9">
            <h2 className="text-2xl font-bold text-white">DSB Authorization</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/75 md:text-base">
              DSB, Direktoratet for samfunnssikkerhet og beredskap, is the Norwegian authority responsible for electrical
              safety and authorization rules. For many electrician roles in Norway, DSB authorization is required before
              you can perform regulated electrical work.
            </p>
            <a
              href="https://www.dsb.no"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex text-sm font-semibold text-[#C9A84C] underline-offset-4 hover:underline"
            >
              Official source: dsb.no
            </a>
          </article>

          <article className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-7 md:p-9">
            <h2 className="text-2xl font-bold text-white">Recognition of Qualifications</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/75 md:text-base">
              Before authorization, your education and vocational background from your home country may need formal
              recognition. NOKUT provides guidance on how foreign qualifications are assessed in Norway.
            </p>
            <a
              href="https://www.nokut.no"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex text-sm font-semibold text-[#C9A84C] underline-offset-4 hover:underline"
            >
              Official source: nokut.no
            </a>
          </article>

          <article className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-7 md:p-9">
            <h2 className="text-2xl font-bold text-white">Requirements</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-white/75 md:text-base">
              <li>Recognized vocational qualification relevant to electrical work.</li>
              <li>Practical hands-on experience from real projects in your trade.</li>
              <li>Required documentation, such as certificates, ID documents, and work history records.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-7 md:p-9">
            <h2 className="text-2xl font-bold text-white">How ArbeidMatch Helps</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/75 md:text-base">
              We connect you with Norwegian employers looking for qualified electricians. Authorization costs are the
              candidate&apos;s responsibility. We guide you through each step of the process to make it as straightforward as
              possible.
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-[rgba(201,168,76,0.15)] py-14 md:py-16">
        <div className="mx-auto flex w-full max-w-content flex-col items-center gap-4 px-6 md:flex-row md:justify-center md:px-12 lg:px-20">
          <a
            href="https://jobs.arbeidmatch.no"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[10px] bg-[#C9A84C] px-8 py-3 text-sm font-bold text-[#0D1B2A] transition-colors duration-200 hover:bg-[#b8953f] md:w-auto"
          >
            Find Me a Job
          </a>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.35)] px-8 py-3 text-sm font-semibold text-[#C9A84C] transition-colors duration-200 hover:border-[rgba(201,168,76,0.6)] hover:bg-[rgba(201,168,76,0.08)] md:w-auto"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
