import type { Metadata } from "next";
import Link from "next/link";

import { nbPageMetadata } from "@/lib/nbPageMetadata";

const TITLE = "Cookie Policy | ArbeidMatch";
const DESCRIPTION = "What arbeidmatch.no stores on your device: essential only, no advertising, no profiling.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | EU/EEA Recruitment Norway",
} as const;

const base = nbPageMetadata("/cookies", TITLE, DESCRIPTION);

export const metadata: Metadata = {
  ...base,
  robots: { index: true, follow: true },
  openGraph: { ...base.openGraph, title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
  twitter: { ...base.twitter, title: TITLE, description: DESCRIPTION, images: ["/og-image.png"] },
};

/**
 * The public site's own cookie declaration.
 *
 * It is short because the site is: no analytics tag, no advertising or social
 * pixel, and nothing that reads anything back off a visitor's device except the
 * one line recording that the notice was seen. The recruitment platform at
 * ats.arbeidmatch.no is a different program with sign-in cookies of its own, and
 * it publishes its own declaration; the two are linked to each other so a
 * reader is never left comparing two banners that say different things.
 *
 * Written here rather than fetched from the ATS legal editor, unlike /privacy
 * and /terms, because every line is a statement about this repository's code.
 */
export default function CookiePolicyPage() {
  return (
    <section className="min-h-[60vh] bg-white text-[#0D1B2A]">
      <div className="mx-auto w-full max-w-[720px] px-6 py-12 md:px-12">
        <article lang="en">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-[#0D1B2A]">Cookie Policy</h1>
            <p className="mt-2 text-[12px] italic text-[#0D1B2A]/60">Last updated: 23 September 2026</p>
          </header>

          <p className="mb-4 text-base leading-relaxed text-[#0D1B2A]/85">
            This site uses no advertising cookies, no social media pixels and no third-party tracking of any kind.
            Nothing here follows you to another website.
          </p>

          <h2 className="mb-3 mt-8 text-xl font-semibold text-[#0D1B2A]">What we store on your device</h2>
          <p className="mb-4 text-base leading-relaxed text-[#0D1B2A]/85">
            One item: a note in your browser&rsquo;s local storage recording that you have seen the cookie notice, so
            it is not shown on every page. It holds nothing about you, is never sent to us, and you can clear it from
            your browser at any time. We do not need your permission for it, and we ask for none.
          </p>

          <h2 className="mb-3 mt-8 text-xl font-semibold text-[#0D1B2A]">How we count visits</h2>
          <p className="mb-4 text-base leading-relaxed text-[#0D1B2A]/85">
            We do count pageviews, but without storing anything on your device. When a page loads, our own server
            turns your address and browser into a one-way hash that changes every day, and keeps only that. The
            address itself is never written down, nothing is read back off your device, and the figure cannot be
            traced to a person. There is therefore nothing here to consent to, and no cookie involved.
          </p>

          <h2 className="mb-3 mt-8 text-xl font-semibold text-[#0D1B2A]">Forms you fill in</h2>
          <p className="mb-4 text-base leading-relaxed text-[#0D1B2A]/85">
            What you type into a contact or application form is not a cookie question: it is personal data, and the{" "}
            <Link href="/privacy" className="text-[#C9A84C] underline underline-offset-2 hover:opacity-80">
              Privacy Policy
            </Link>{" "}
            says what happens to it, how long it is kept and what you can ask us to do with it.
          </p>

          <h2 className="mb-3 mt-8 text-xl font-semibold text-[#0D1B2A]">The recruitment platform</h2>
          <p className="mb-4 text-base leading-relaxed text-[#0D1B2A]/85">
            Signing in at ats.arbeidmatch.no is a separate program, and it does need cookies to keep you signed in. It
            asks there before anything beyond those runs, and lists each one in{" "}
            <a
              href="https://ats.arbeidmatch.no/cookies"
              className="text-[#C9A84C] underline underline-offset-2 hover:opacity-80"
            >
              its own cookie policy
            </a>
            .
          </p>

          <h2 className="mb-3 mt-8 text-xl font-semibold text-[#0D1B2A]">Asking us</h2>
          <p className="mb-4 text-base leading-relaxed text-[#0D1B2A]/85">
            ArbeidMatch Norge AS, org. nr. 935 667 089, Sverre Svendsens veg 38, 7056 Ranheim, Norway. Write to{" "}
            <a href="mailto:legal@arbeidmatch.no" className="text-[#C9A84C] underline underline-offset-2 hover:opacity-80">
              legal@arbeidmatch.no
            </a>
            . You may also complain to Datatilsynet, the Norwegian Data Protection Authority.
          </p>
        </article>
      </div>
    </section>
  );
}
