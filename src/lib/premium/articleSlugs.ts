/** Static slugs for sitemap and routing. */
export const PREMIUM_ARTICLE_SLUGS = [
  "workers-rights-norway-eu-eea",
  "tax-registration-norway-foreign-workers",
  "employment-contract-norway-what-to-check",
  "nav-benefits-foreign-workers-norway",
  "registering-as-worker-norway-eu-eea-checklist",
] as const;

export type PremiumArticleSlug = (typeof PREMIUM_ARTICLE_SLUGS)[number];
