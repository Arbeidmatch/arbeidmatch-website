# Task 3 - robots.txt, hreflang og Wix

## 1) robots.txt (lim inn i Wix *SEO (Google)* → *Robots.txt Editor* eller tilsvarende)

**Merk:** Wix kan begrense avanserte mønstre. Test i *URL Inspection* etter publisering.

```txt
User-agent: *
Allow: /
Disallow: /request
Disallow: /request/
Disallow: /feedback
Disallow: /feedback/
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /*?

User-agent: Googlebot
Allow: /
Disallow: /request
Disallow: /request/
Disallow: /feedback
Disallow: /feedback/
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /*?

User-agent: Bingbot
Allow: /
Disallow: /request
Disallow: /request/
Disallow: /feedback
Disallow: /feedback/
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /*?

Sitemap: https://www.arbeidmatch.no/sitemap.xml
Host: https://www.arbeidmatch.no
```

### Wix-begrensninger og workaround

- **Robots.txt-editor** støtter ikke alltid komplekse wildcards likt som på egen server. Hvis `/*?` ikke aksepteres, bruk **Google Search Console → URL Parameters** (der det fortsatt finnes verktøy for parametre) og **Canonical** på sider for å redusere duplikatindeksering.
- Wix kan **overstyre** robots.txt delvis; verifiser alltid med *Vis som Google* / *Live test* i Search Console.
- For **admin** og **interne verktøy**: bruk i tillegg **noindex** på sider som ikke skal indekseres, og passord/Wix Members der det passer.

---

## 2) HTML `<head>` - hreflang (språkversjoner)

Lim inn i **Custom Code** i `<head>` for hele nettstedet (Wix: *Settings → Custom Code → Head*), eller i Next.js `layout.tsx` via `metadata.alternates.languages` (allerede satt i kodebasen).

```html
<link rel="alternate" hreflang="nb-NO" href="https://www.arbeidmatch.no/" />
<link rel="alternate" hreflang="en" href="https://www.arbeidmatch.no/en" />
<link rel="alternate" hreflang="ro" href="https://www.arbeidmatch.no/ro" />
<link rel="alternate" hreflang="pl" href="https://www.arbeidmatch.no/pl" />
<link rel="alternate" hreflang="x-default" href="https://www.arbeidmatch.no/" />
```

**Sjekkliste:** Hver språk-URL må returnere **HTTP 200** og ha **gjensidige** hreflang-lenker (alle sider peker til hverandre). Unngå å blande `http` og `https`, eller `www` og non-`www`.

---

## 3) Plassering i Wix SEO-panelet (kort)

1. **Site SEO → Homepage SEO:** tittel og beskrivelse for norsk forside.  
2. **Site SEO → Robots.txt:** lim inn robots-teksten over (dersom tilgjengelig i din Wix-plan/region).  
3. **Settings → Custom Code → Add Custom Code → Head:** lim inn hreflang-blokken.  
4. **Google Search Console:** legg inn `sitemap.xml` og overvåk *Coverage* / *Page indexing*.
