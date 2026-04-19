import Link from "next/link";
import type { Metadata } from "next";
import BlogComingSoonCapture from "@/components/blog/BlogComingSoonCapture";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/blog",
  "Blogg – arbeidsgiverguider | ArbeidMatch",
  "Praktiske artikler for norske arbeidsgivere og EU/EEA-arbeidstakere om rekruttering, compliance og norsk arbeidsrett.",
);

export default function BlogIndexPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <h1 className="text-3xl font-extrabold text-navy md:text-4xl">Blogg</h1>
        <p className="mt-4 max-w-2xl text-text-secondary">
          Practical articles for Norwegian employers and EU/EEA workers on recruitment, compliance, and Norwegian labor law.
        </p>
        <BlogComingSoonCapture />
        <ul className="mt-10 space-y-4">
          <li className="rounded-xl border border-border bg-surface p-5">
            <Link href="/blog/ansette-utenlandske-arbeidere-lovlig" className="text-lg font-semibold text-navy hover:text-gold">
              Slik ansetter du lovlig utenlandske arbeidere i Norge i 2025
            </Link>
            <p className="mt-2 text-sm text-text-secondary">
              Sjekkliste for arbeidsgivere: EØS vs. utenfor EØS, kontrakt, allmenngjøring og HMS.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
}
