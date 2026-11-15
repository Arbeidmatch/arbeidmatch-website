import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuidePage } from "@/components/site/candidates/LifeInNorway";
import { DEFAULT_OG_IMAGE } from "@/lib/nbPageMetadata";
import { PREMIUM_ARTICLE_SLUGS } from "@/lib/premium/articleSlugs";
import { getPremiumArticleBySlug } from "@/lib/premium/articles";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PREMIUM_ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getPremiumArticleBySlug(slug);
  if (!article) return {};
  const path = `/for-candidates/life-in-norway/${slug}`;
  const url = `https://www.arbeidmatch.no${path}`;
  return {
    title: { absolute: `${article.title} | ArbeidMatch` },
    description: article.excerpt,
    alternates: { canonical: path, languages: { en: url, "x-default": url } },
    openGraph: { title: article.title, description: article.excerpt, url: path, locale: "en_US", siteName: "ArbeidMatch", type: "article", images: [DEFAULT_OG_IMAGE] },
  };
}

/** One Life in Norway guide, on the mockup's guide template (ORDER 295, stage 5). */
export default async function GuideRoute({ params }: Props) {
  const { slug } = await params;
  const article = getPremiumArticleBySlug(slug);
  if (!article) notFound();
  return <GuidePage article={article} />;
}
