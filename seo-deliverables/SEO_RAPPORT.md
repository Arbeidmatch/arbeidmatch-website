# SEO-rapport - ArbeidMatch (Next.js App Router)

**Dato:** 2026-04-19  
**Status:** `npm run build` OK · endrede filer i oppgaver 11–14 er `eslint`-rene (se avsnitt om lint nederst)

---

## Executive summary (norsk)

ArbeidMatch-siten har nå **samkjørte norske metadata** (tittel, beskrivelse, canonical, `hreflang`-stubber nb/en/ro/pl, Open Graph og Twitter) på alle kjernetjenester som arbeidsgivere og kandidater treffer først: arbeidsgiver/kandidat-side, om oss, kontakt, DSB-sjekkliste, partnerprogram og partnere. **Navigasjonen** er utvidet med «Tjenester» og «Steder» (desktop hover, mobil trekkspill) pluss **Blog** og **DSB**, uten å fjerne eksisterende lenker. **Footer** har fått egne kolonner for tjenester, steder og ressurser, samt en tydelig bedriftslinje med org.nr. og adresse. **Internlenking** er styrket med «Se også»-blokker på bransje-, by- og utvalgte fagsider for bedre krysskobling og crawl-dybde. Bygget validerer uten TypeScript-feil.

---

## Oppgaveoversikt (1–15)

| Oppgave | Innhold | Status |
|---------|---------|--------|
| 1–10 | Sitemap, robots, hreflang, JSON-LD, JobPosting-mal, bransje-/by-sider, blogg, DSB-pilar, GBP-notater, m.m. | ✅ Levert tidligere |
| **11** | Norsk `metadata` (+ canonical, `alternates.languages`, `openGraph`, `twitter`) via `nbPageMetadata()` på: `for-employers`, `for-candidates`, `about`, `contact`, `dsb-checklist`, `recruiter-network`, `partners`. I tillegg: `dsb-support`, `blog`, `blog/ansette-utenlandske-arbeidere-lovlig` med full pakke der det manglet. | ✅ |
| **12** | `Navbar.tsx`: «Tjenester»- og «Steder»-dropdown (hover desktop, accordion mobil), **Blog** og **DSB** som enkle lenker, `usePathname` for aktiv stil, `Link` overalt. | ✅ |
| **13** | `Footer.tsx`: kolonner Tjenester, Steder, Ressurser; snarveier + app; bedriftslinje under copyright. Interne lenker med `Link`. | ✅ |
| **14** | `SeeAlsoSection` + «Se også» på angitte sider (bygg, bransjer, byer, bloggartikkel, DSB-support). | ✅ |
| **15** | Build + lint + verifikasjon + denne rapporten. | ✅ |

### Viktige filer (oppgave 11–14)

- `src/lib/nbPageMetadata.ts` - gjenbrukbar metadata-fabrikk  
- `src/components/seo/SeeAlsoSection.tsx` - «Se også»-blokk  
- `src/components/Navbar.tsx` - oppdatert navigasjon  
- `src/components/Footer.tsx` - oppdatert footer  
- Oppdaterte `page.tsx` / innholdsfiler som listet i PR-beskrivelse / git status

---

## Ruteverifikasjon

| Rute | Fil | Metadata | Schema JSON-LD | Interne «Se også»-lenker |
|------|-----|----------|----------------|---------------------------|
| `/` | `src/app/page.tsx` | ✅ (nb, egen) | ✅ (layout + FAQ hjem) | - |
| `/for-employers` | `src/app/for-employers/page.tsx` | ✅ `nbPageMetadata` | - | - |
| `/for-candidates` | `src/app/for-candidates/page.tsx` | ✅ | - | - |
| `/about` | `src/app/about/page.tsx` | ✅ | - | - |
| `/contact` | `src/app/contact/page.tsx` | ✅ | - | - |
| `/dsb-support` | `src/app/dsb-support/page.tsx` | ✅ | - (artikkel) | ✅ |
| `/dsb-checklist` | `src/app/dsb-checklist/page.tsx` | ✅ | - | - |
| `/recruiter-network` | `src/app/recruiter-network/page.tsx` | ✅ | - | - |
| `/partners` | `src/app/partners/page.tsx` | ✅ | - | - |
| `/blog` | `src/app/blog/page.tsx` | ✅ | - | - |
| `/blog/ansette-utenlandske-arbeidere-lovlig` | `src/app/blog/ansette-utenlandske-arbeidere-lovlig/page.tsx` | ✅ | - | ✅ |
| `/bemanning-bygg-anlegg` | `src/app/bemanning-bygg-anlegg/page.tsx` + `BemanningByggAnleggNb.tsx` | ✅ `nbPageMetadata` | ✅ Breadcrumb | ✅ |
| `/bemanning-logistikk` | `src/app/bemanning-logistikk/page.tsx` | ✅ (tittel/desc/canonical) | - | ✅ |
| `/bemanning-industri` | `src/app/bemanning-industri/page.tsx` | ✅ | - | ✅ |
| `/bemanning-renhold` | `src/app/bemanning-renhold/page.tsx` | ✅ | - | ✅ |
| `/bemanning-horeca` | `src/app/bemanning-horeca/page.tsx` | ✅ | - | ✅ |
| `/bemanning-helse` | `src/app/bemanning-helse/page.tsx` | ✅ | - | ✅ |
| `/bemanningsbyrå-trondheim` | `src/app/bemanningsbyrå-trondheim/page.tsx` | ✅ | - | ✅ |
| `/bemanningsbyrå-bergen` | `src/app/bemanningsbyrå-bergen/page.tsx` | ✅ | - | ✅ |
| `/bemanningsbyrå-stavanger` | `src/app/bemanningsbyrå-stavanger/page.tsx` | ✅ | - | ✅ |
| `/bemanningsbyrå-kristiansand` | `src/app/bemanningsbyrå-kristiansand/page.tsx` | ✅ | - | ✅ |
| `/en` | `src/app/en/page.tsx` | Delvis (ikke omfattet av oppg. 11) | - | - |
| `/ro` | `src/app/ro/page.tsx` | Delvis | - | - |
| `/pl` | `src/app/pl/page.tsx` | Delvis | - | - |
| `/sitemap.xml` | `src/app/sitemap.ts` | N/A | N/A | N/A |
| `/robots.txt` | `src/app/robots.ts` | N/A | N/A | N/A |

**Forklaring schema:** Organisasjon/lokalbedrift og FAQ ligger i layout/hjem; `BreadcrumbList` kun på `/bemanning-bygg-anlegg`. Øvrige landingsider kan få `FAQPage` eller `BreadcrumbList` senere etter mal.

---

## ESLint (oppgave 15)

- **Endrede filer** i denne leveransen: ingen ESLint-feil ved målrettet kjøring på disse stiene.  
- **Hele repoet** (`npm run lint`): det finnes fortsatt **feil i andre filer** (f.eks. `AnimatedNumber.tsx`, `CookieConsent.tsx`, `DsbGuideViewer.tsx`, m.fl.) som **ikke** ble introdusert i oppgaver 11–14. Disse bør ryddes i egen teknisk gjeld-PR om dere krever helt grønn global lint.

---

## Anbefalte neste steg

1. **Google Business Profile** - samle anmeldelser, post ukentlig, hold NAP identisk med footer.  
2. **Lenkebygging** - bransjeorganisasjoner, leverandørnettverk, case-sider mot store prosjekt.  
3. **Bloggkalender** - 1–2 fagartikler/måned (HMS, allmenngjøring, DSB-oppdateringer).  
4. **Full `nbPageMetadata`** på alle landingsider (bransje/by) for identisk OG/Twitter/hreflang-mønster.  
5. **Språkversjoner** - når `/en/...` faktisk finnes, oppdater `alternates.languages` per side i stedet for rotkun på en/ro/pl.  
6. **Search Console** - overvåk indeksering etter internlenke-endring.

---

*Rapport generert som del av leveranse oppgave 15.*
