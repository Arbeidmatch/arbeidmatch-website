import type { Metadata } from "next";
import BlogPostFromMarkdown from "@/components/blog/BlogPostFromMarkdown";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/blog/ansette-utenlandske-arbeidere-lovlig",
  "Ansatte utenlandske arbeidere lovlig Norge 2025 | ArbeidMatch",
  "Sjekkliste for arbeidsgivere: EØS vs. utenfor EØS, kontrakt, allmenngjøring og HMS. Unngå vanlige feil, les guiden og ta kontakt.",
);

export default function BlogPostAnsatteLovligPage() {
  return (
    <article className="bg-surface">
      <BlogPostFromMarkdown filename="blog-ansette-utenlandske-arbeidere-lovlig.md" />
      <SeeAlsoSection
        variant="white"
        items={[
          { href: "/for-employers", label: "For arbeidsgivere" },
          { href: "/bemanning-bygg-anlegg", label: "Bemanning bygg & anlegg" },
          { href: "/dsb-support", label: "DSB-godkjenning" },
          { href: "/request", label: "Be om kandidater" },
        ]}
      />
    </article>
  );
}
