import type { Metadata } from "next";
import BlogPostFromMarkdown from "@/components/blog/BlogPostFromMarkdown";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/blog/ansette-utenlandske-arbeidere-lovlig",
  // No year in the title: it dated the article and went stale a year later.
  "Ansette utenlandske arbeidere i Norge: praktisk sjekkliste | ArbeidMatch",
  "Praktisk sjekkliste for arbeidsgivere som henter fagarbeidere fra utlandet: hva som må avklares før oppstart, hvilken dokumentasjon som samles, og hva som oftest går galt.",
);

const ARTICLE_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Ansette utenlandske arbeidere i Norge: praktisk sjekkliste",
  inLanguage: "nb",
  datePublished: "2026-04-19",
  dateModified: "2026-07-25",
  mainEntityOfPage: "https://www.arbeidmatch.no/blog/ansette-utenlandske-arbeidere-lovlig",
  image: "https://www.arbeidmatch.no/og-image.png",
  author: { "@type": "Organization", name: "ArbeidMatch Norge AS", url: "https://www.arbeidmatch.no" },
  publisher: { "@id": "https://www.arbeidmatch.no/#organization" },
};

export default function BlogPostAnsatteLovligPage() {
  return (
    <article className="bg-surface">
      {/* Our own fixed text, not user input. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_LD) }} />
      <BlogPostFromMarkdown filename="blog-ansette-utenlandske-arbeidere-lovlig.md" />
      <SeeAlsoSection
        variant="white"
        items={[
          { href: "/for-employers", label: "For arbeidsgivere" },
          { href: "/bemanning-bygg-anlegg", label: "Bemanning bygg & anlegg" },
          { href: "/electricians-norway", label: "Electricians in Norway" },
          { href: "/request", label: "Be om kandidater" },
        ]}
      />
    </article>
  );
}
