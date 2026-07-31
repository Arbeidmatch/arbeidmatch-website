import type { Metadata } from "next";
import Link from "next/link";
import { CvPreview } from "@/app/cv-gen/_components/CvPreview";
import { GuideShot } from "@/app/cv/_components/GuideShot";
import { SAMPLE_CV } from "@/lib/cv/fixtures/sample-cv";
import { COMMON_MISTAKES, FAQ, GUIDE_BLOCKS, NORWEGIAN_SPECIFICS } from "@/lib/cv/guide-content";
import { TEMPLATE_IDS, TEMPLATE_META } from "@/lib/cv/schema";

export const metadata: Metadata = {
  title: "Free CV builder for jobs in Norway",
  description:
    "Build a CV in English that Norwegian employers and their systems can actually read. Free, about 15 minutes, and the PDF comes out ATS ready.",
  alternates: { canonical: "https://www.arbeidmatch.no/cv" },
  openGraph: {
    title: "Free CV builder for jobs in Norway",
    description:
      "Build a CV in English that Norwegian employers and their systems can actually read. Free and ATS ready.",
    url: "https://www.arbeidmatch.no/cv",
    type: "website",
  },
};

const BADGE_COLOUR: Record<string, string> = {
  best: "#1D9E75",
  good: "#C9A84C",
  acceptable: "#B26A00",
};

const BADGE_LABEL: Record<string, string> = {
  best: "Best for ATS",
  good: "Good",
  acceptable: "Acceptable",
};

function Cta({ variant = "primary" }: { variant?: "primary" | "light" }) {
  return (
    <Link
      href="/cv-gen"
      className={
        variant === "primary"
          ? "inline-block rounded bg-[#C9A84C] px-6 py-3.5 font-bold text-[#0D1B2A] transition-colors hover:bg-[#B8913A] focus:outline-none focus:ring-2 focus:ring-white"
          : "inline-block rounded border border-[#0D1B2A] px-6 py-3.5 font-bold text-[#0D1B2A] transition-colors hover:bg-[#0D1B2A] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
      }
    >
      Build my CV
    </Link>
  );
}

export default function CvGuidePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to write a CV for jobs in Norway",
    description:
      "Write a CV in English that Norwegian employers and their recruitment software can read in full.",
    totalTime: "PT15M",
    step: GUIDE_BLOCKS.map((block, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: block.title,
      text: block.whatToWrite,
      url: `https://www.arbeidmatch.no/cv#${block.id}`,
    })),
  };

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <section className="bg-[#0D1B2A] px-4 py-16 text-white">
        <div className="mx-auto max-w-content">
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Build a CV in English that Norwegian employers and their systems can actually read.
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-[#C2CAD3]">
            Free, about 15 minutes, and the PDF that comes out is built to survive the software
            that reads it before any person does. Five layouts, a guided form, and a live check
            that tells you what an employer will actually see.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta />
            <a
              href="#guide"
              className="inline-block rounded border border-white/40 px-6 py-3.5 font-bold text-white transition-colors hover:border-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            >
              Read the guide first
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-content">
          <h2 className="text-2xl font-bold text-[#0D1B2A] sm:text-3xl">
            Why English, and why the format matters
          </h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <p className="text-[16px] leading-relaxed text-[#55616D]">
              Most Norwegian staffing and recruitment companies put every CV they receive through
              parsing software before a person opens it. That software pulls out your name, your
              contact details, your job titles, your dates and your skills, and files them.
              Whatever it fails to pull out does not exist as far as the search is concerned.
            </p>
            <p className="text-[16px] leading-relaxed text-[#55616D]">
              A decorative CV can lose half its content in that step. Text inside images
              disappears entirely. Columns and text boxes shuffle the reading order, so your job
              title ends up separated from the dates that belong to it. Letter spacing on a
              heading turns SUMMARY into S U M M A R Y, which matches nothing. Every layout here
              is built and tested against that.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F6F8] px-4 py-14">
        <div className="mx-auto max-w-content">
          <h2 className="text-2xl font-bold text-[#0D1B2A] sm:text-3xl">The five layouts</h2>
          <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-[#55616D]">
            All five carry the same information in the same order. They differ in how it looks.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATE_IDS.map((id) => {
              const meta = TEMPLATE_META[id];
              return (
                <article key={id} className="rounded border border-[#E2E5EA] bg-white p-4">
                  <div className="overflow-hidden border border-[#E2E5EA]">
                    <CvPreview doc={{ ...SAMPLE_CV, templateId: id }} scale={0.62} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <h3 className="font-bold text-[#0D1B2A]">{meta.name}</h3>
                    <span
                      className="rounded px-2 py-0.5 text-[11px] font-bold text-white"
                      style={{ backgroundColor: BADGE_COLOUR[meta.badge] }}
                    >
                      {BADGE_LABEL[meta.badge]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-snug text-[#55616D]">{meta.bestFor}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="guide" className="px-4 py-14">
        <div className="mx-auto max-w-content">
          <h2 className="text-2xl font-bold text-[#0D1B2A] sm:text-3xl">Section by section</h2>
          <div className="mt-8 space-y-10">
            {GUIDE_BLOCKS.map((block) => (
              <article key={block.id} id={block.id} className="scroll-mt-24">
                <h3 className="text-xl font-bold text-[#0D1B2A]">{block.title}</h3>
                <p className="mt-2 max-w-3xl text-[16px] leading-relaxed text-[#55616D]">
                  {block.whatToWrite}
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded border border-[#1D9E75]/40 bg-[#F1FAF6] p-4">
                    <p className="text-[13px] font-bold uppercase tracking-wide text-[#177A5B]">
                      Write this
                    </p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[#0D1B2A]">{block.good}</p>
                  </div>
                  <div className="rounded border border-[#B03A2E]/30 bg-[#FDF3F2] p-4">
                    <p className="text-[13px] font-bold uppercase tracking-wide text-[#B03A2E]">
                      Not this
                    </p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-[#7A2B22]">{block.bad}</p>
                  </div>
                </div>
                {block.shot ? <GuideShot shot={block.shot} alt={`${block.title} step in the CV builder`} /> : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F6F8] px-4 py-14">
        <div className="mx-auto max-w-content">
          <h2 className="text-2xl font-bold text-[#0D1B2A] sm:text-3xl">What is specific to Norway</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {NORWEGIAN_SPECIFICS.map((item) => (
              <article key={item.title} className="rounded border border-[#E2E5EA] bg-white p-5">
                <h3 className="font-bold text-[#0D1B2A]">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#55616D]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-content">
          <h2 className="text-2xl font-bold text-[#0D1B2A] sm:text-3xl">The mistakes that cost interviews</h2>
          <ul className="mt-6 divide-y divide-[#E2E5EA] border-y border-[#E2E5EA]">
            {COMMON_MISTAKES.map((item) => (
              <li key={item.mistake} className="grid gap-1 py-4 md:grid-cols-[240px_1fr] md:gap-6">
                <p className="font-bold text-[#0D1B2A]">{item.mistake}</p>
                <p className="text-[15px] leading-relaxed text-[#55616D]">{item.why}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#F5F6F8] px-4 py-14">
        <div className="mx-auto max-w-content">
          <h2 className="text-2xl font-bold text-[#0D1B2A] sm:text-3xl">Your data, in plain words</h2>
          <div className="mt-5 max-w-3xl space-y-4 text-[16px] leading-relaxed text-[#55616D]">
            <p>
              While you fill the form, everything stays in your browser. Nothing is sent to us,
              nothing is saved on our side, and no analytics event carries what you typed.
            </p>
            <p>
              When you press download, we ask for two confirmations: that you accept the privacy
              policy, and that you agree we create a work profile for you so we can match you with
              jobs. Then we send a six digit code to your email and you type it back. That code is
              the moment your data first reaches us, and the record of your consent.
            </p>
            <p>
              If you decline, or close the window, everything is deleted from your browser and
              nothing was ever stored. If you consent, the email with your CV also carries a link
              where you can see everything we hold, export it as a file, or delete all of it.
            </p>
            <p>
              We do not send your CV to an employer automatically. That takes a separate, explicit
              step from you.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-[15px] font-semibold">
            <Link href="/privacy" className="text-[#0D1B2A] underline">
              Full privacy policy
            </Link>
            <Link href="/terms" className="text-[#0D1B2A] underline">
              Terms of use
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-content">
          <h2 className="text-2xl font-bold text-[#0D1B2A] sm:text-3xl">Questions</h2>
          <div className="mt-6 divide-y divide-[#E2E5EA] border-y border-[#E2E5EA]">
            {FAQ.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="cursor-pointer list-none font-bold text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]">
                  {item.question}
                </summary>
                <p className="mt-2 text-[15px] leading-relaxed text-[#55616D]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0D1B2A] px-4 py-16 text-center text-white">
        <div className="mx-auto max-w-content">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready when you are</h2>
          <p className="mx-auto mt-3 max-w-xl text-[16px] leading-relaxed text-[#C2CAD3]">
            Fifteen minutes, no account, and a PDF an employer can read from the first line to the
            last.
          </p>
          <div className="mt-7">
            <Cta />
          </div>
        </div>
      </section>
    </main>
  );
}
