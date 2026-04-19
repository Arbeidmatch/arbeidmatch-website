import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PremiumArticleClient from "@/components/premium/PremiumArticleClient";
import { PREMIUM_ARTICLE_SLUGS } from "@/lib/premium/articleSlugs";
import { getPremiumArticleBySlug } from "@/lib/premium/articles";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PREMIUM_ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getPremiumArticleBySlug(slug);
  if (!article) return {};
  const canonical = `https://www.arbeidmatch.no/premium/article/${slug}`;
  return {
    title: `${article.title} | ArbeidMatch Premium`,
    description: article.excerpt,
    alternates: { canonical },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: canonical,
      locale: "nb_NO",
      type: "article",
    },
  };
}

export default async function PremiumArticleRoute({ params }: Props) {
  const { slug } = await params;
  const article = getPremiumArticleBySlug(slug);
  if (!article) notFound();
  return <PremiumArticleClient article={article} />;
}
