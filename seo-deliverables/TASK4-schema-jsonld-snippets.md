# Task 4 — JSON-LD (lim inn som separate `<script type="application/ld+json">`)

**Kilde i repo (single source of truth):**

- `LocalBusiness` + `Organization`: `src/components/seo/HomeJsonLd.tsx`
- `FAQPage`: `src/components/seo/HomeFaqJsonLd.tsx` (kun hjemmeside)
- `BreadcrumbList` for bygg: `src/components/seo/BreadcrumbByggAnleggJsonLd.tsx`

For å lime inn i Wix eller annet CMS: åpne filene over og kopier innholdet i `JSON.stringify(...)` / objektet som JSON.

**Validering:** Lim inn i [Rich Results Test](https://search.google.com/test/rich-results) etter publisering.

**Merk:** `Organization.sameAs` bør oppdateres med ekte LinkedIn/Facebook/GBP-lenker når de foreligger.
