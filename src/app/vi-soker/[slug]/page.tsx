import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { advertBlocks, fetchGeneralAdvert, type Block, type GeneralAdvert } from "@/lib/general-adverts-fetch";

/**
 * ArbeidMatch's own standing advert for one trade and county (ORDER 253).
 *
 * HIS WORDS, 9 November 2026: "un anunt general ca suntem in cautare continua
 * de meseriasi skilled, unde oamenii vor fi dirijati ca sa se inregistreze in
 * platforma pentru a putea aplica la joburi prin noi". The advert names no
 * firm and promises no job at one; the demand lines are the NAV feed's numbers
 * as the ATS counted them when it was approved. The one action is
 * registration, through the department's invitation link, which carries the
 * advert so the registration is counted on it.
 *
 * Norwegian first, then English, as two separated panels (his rule of
 * 4 October 2026 for every advert page). The ATS reads this page back and
 * looks for data-general-advert-id before it asks to post the advert on
 * Facebook, so the marker must stay on the article.
 */

const SITE = "https://www.arbeidmatch.no";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const advert = await fetchGeneralAdvert(slug);
  if (!advert) return { title: "Not found", robots: { index: false } };
  return {
    title: advert.titleNo,
    description: `${advert.titleEn}. ArbeidMatch recruits continuously for clients in our network in ${advert.countyName}. Register once and apply for jobs through us.`,
    alternates: { canonical: `/vi-soker/${advert.slug}` },
    robots: advert.isTest ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title: advert.titleNo, description: advert.titleEn, type: "website" },
  };
}

/** JobPosting for the advert: only what the advert says; no salary, no employer but ArbeidMatch. */
function jsonLd(a: GeneralAdvert): string {
  const posted = a.refreshedAt.slice(0, 10);
  const valid = new Date(Date.parse(a.refreshedAt) + 30 * 86_400_000).toISOString().slice(0, 10);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${SITE}/vi-soker/${a.slug}#advert`,
    title: a.titleEn,
    url: `${SITE}/vi-soker/${a.slug}`,
    identifier: { "@type": "PropertyValue", name: "ArbeidMatch", value: a.id },
    description: `${a.bodyNo}\n\n${a.bodyEn}`,
    datePosted: posted,
    validThrough: valid,
    hiringOrganization: { "@type": "Organization", name: "ArbeidMatch Norge AS", sameAs: SITE },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressRegion: a.countyName, addressCountry: "NO" } },
    directApply: false,
    // Escaped whole, after stringify: no field can close the script tag.
  }).replace(/</g, "\\u003c");
}

/** A paragraph with its address made a link: the registration line carries the department's link. */
function Linked({ text }: { text: string }) {
  const parts = text.split(/(https:\/\/\S+)/);
  return (
    <>
      {parts.map((part, i) =>
        /^https:\/\//.test(part) ? (
          <a key={i} href={part} className="break-all font-semibold underline decoration-gold underline-offset-4">
            {part.replace(/^https:\/\/(www\.)?/, "").split("?")[0]}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="am-prose">
      {blocks.map((b, i) =>
        b.kind === "h" ? (
          <h2 key={i}>{b.text.charAt(0) + b.text.slice(1).toLowerCase()}</h2>
        ) : b.kind === "ul" ? (
          <ul key={i}>
            {b.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Linked text={b.text} />
          </p>
        ),
      )}
    </div>
  );
}

export default async function GeneralAdvertPage({ params }: Props) {
  const { slug } = await params;
  const advert = await fetchGeneralAdvert(slug);
  if (!advert) notFound();
  return (
    <article data-general-advert-id={advert.id}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(advert) }} />
      <header className="bg-navy">
        <div className="mx-auto w-full max-w-content px-5 py-8 md:px-12 md:py-14 lg:px-20">
          <nav aria-label="Breadcrumb" className="text-sm text-white/70">
            <Link href="/jobs" className="transition hover:text-gold">
              Open jobs
            </Link>
          </nav>
          <h1 className="am-h-advert mt-3 max-w-[900px] font-extrabold text-white">{advert.titleNo}</h1>
          <p className="mt-2 text-white/80">{advert.titleEn}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <a href="#norsk" className="text-white/80 underline decoration-gold underline-offset-4">
              Norsk versjon
            </a>
            <a href="#english" className="text-white/80 underline decoration-gold underline-offset-4">
              English version
            </a>
          </div>
          <a
            href={advert.registerUrl}
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gold px-6 font-semibold text-navy"
          >
            Registrer deg · Register
          </a>
        </div>
      </header>
      <div className="bg-white">
        <div className="mx-auto grid w-full max-w-content gap-6 px-5 py-8 md:px-12 lg:grid-cols-2 lg:px-20">
          <section id="norsk" lang="nb" aria-label="Norsk versjon" className="rounded-xl border border-border p-5 text-navy">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">Norsk versjon</p>
            <Blocks blocks={advertBlocks(advert.bodyNo)} />
          </section>
          <section id="english" lang="en" aria-label="English version" className="rounded-xl border border-border p-5 text-navy">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">English version</p>
            <Blocks blocks={advertBlocks(advert.bodyEn)} />
          </section>
        </div>
        <div className="mx-auto w-full max-w-content px-5 pb-10 md:px-12 lg:px-20">
          <a href={advert.registerUrl} className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-navy px-6 font-semibold text-white sm:w-auto">
            Registrer deg hos ArbeidMatch · Register with ArbeidMatch
          </a>
        </div>
      </div>
    </article>
  );
}
