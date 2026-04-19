# Site Audit - 18 Aprilie 2026

## Rezumat executiv
Starea generala a proiectului este buna: build-ul trece, TypeScript nu raporteaza erori, rutele principale sunt generate corect, iar interconectarea interna este functionala. Exista totusi cateva riscuri importante: logging de debug ramas in productie pe checkout DSB, lipsa metadata SEO pe mai multe pagini publice, configuratie de environment incompleta in `.env.example`, si suprafata larga de API-uri publice fara un strat uniform de autentificare/rate-limit.

## Erori critice (blocheaza functionalitatea)
- Nu au fost identificate erori critice care blocheaza build-ul sau runtime-ul de baza.

## Erori importante (afecteaza experienta)
- `src/app/api/dsb-guide/checkout/route.ts` contine `console.log` de debug (env check, slug, query result) in flow de productie.
- Mai multe pagini publice nu exporta metadata SEO (`metadata`/`generateMetadata`), ceea ce afecteaza discoverability.
- `src/app/api/dsb-guide/checkout/route.ts` si webhook-ul DSB expun procese sensibile de vanzare continut digital; lipseste un model unificat de audit/auth pentru rutele sensibile non-admin.
- `src/app/api/admin/tiktok-live/route.ts` foloseste parola in request body; functional, dar sub nivelul recomandat (preferabil auth session/JWT + role check).

## Avertismente (de rezolvat in viitor)
- Build warning: Next.js semnaleaza ca `middleware` este deprecated si trebuie migrat la `proxy`.
- Configuratia `.env.example` nu include toate variabilele citite in cod.
- In repository exista SQL doar pentru `dsb_leads`; pentru restul tabelelor utilizate de cod nu exista scripturi SQL in `docs/` sau `supabase/`.
- Exista pagini/sectiuni placeholder (`/partners` cu "Coming soon"), ceea ce poate crea asteptari nealiniate.

## Functionalitati verificate si OK
- `npm run build`: succes.
- `npx tsc --noEmit`: fara erori.
- Rutele app/API sunt generate corect (static vs dynamic).
- Link-urile interne verificate din navbar/footer/pagini principale duc la rute existente.
- Nu s-au gasit chei hardcodate direct in source (`src/`).
- Nu s-au detectat elemente `<img>` brute fara control (folosire moderna de componente/markup).

## 1) Erori de build
### Comanda rulata
- `npm run build`

### Rezultat
- Build: **OK**
- Warning:
  - `The "middleware" file convention is deprecated. Please use "proxy" instead.`

### Pagini/rute generate (din output build)
- Static (`○`): `/`, `/_not-found`, `/about`, `/admin/live`, `/contact`, `/download`, `/dsb-assistance`, `/dsb-checklist`, `/dsb-support`, `/feedback`, `/for-candidates`, `/for-employers`, `/outside-eu-eea`, `/partners`, `/privacy`, `/request`, `/robots.txt`, `/score`, `/sitemap.xml`, `/terms`, `/verified`
- Dynamic (`ƒ`): `/dsb-guide/eu`, `/dsb-guide/non-eu`, `/eligibility-assistance`, `/request/[token]`, toate rutele din `/api/*`

## 2) Erori de TypeScript
### Comanda rulata
- `npx tsc --noEmit`

### Rezultat
- **Fara erori TypeScript.**

## 3) Link-uri interne
### Verificare
- S-au verificat link-uri din:
  - `src/components/Navbar.tsx`
  - `src/components/Footer.tsx`
  - paginile principale (`/`, `/for-candidates`, `/for-employers`, `/request`, `/dsb-support`, `/partners`, etc.)

### Rezultat
- Nu au fost identificate link-uri interne care duc la rute inexistente.
- Link-ul `/#how-it-works` este un anchor intern valid pe homepage.

## 4) Variabile de environment
### Variabile folosite in cod (`process.env.*`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_PASS`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_DSB_EU`
- `STRIPE_PRICE_ID_DSB_NON_EU`
- `NEXT_PUBLIC_TIKTOK_LIVE_URL`
- `ADMIN_LIVE_PASSWORD`
- `EMAIL_VERIFICATION_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `SUPPORT_EMAIL`

### In `.env.example`
- Prezente:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SMTP_PASS`
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_BASE_URL`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ID_DSB_EU`
  - `STRIPE_PRICE_ID_DSB_NON_EU`

### Lipsa in `.env.example`
- `NEXT_PUBLIC_TIKTOK_LIVE_URL`
- `ADMIN_LIVE_PASSWORD`
- `EMAIL_VERIFICATION_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `SUPPORT_EMAIL`

### Observatie
- Cheile din `.env.example` sunt intentionat goale (template), dar setul este incomplet fata de cod.

## 5) Tabele Supabase folosite
### Tabele detectate in cod
- `site_settings`
- `request_tokens`
- `guide_interest_signups`
- `dsb_leads`
- `dsb_guides`
- `dsb_guide_purchases`
- `candidate_feedback_submissions`
- `employer_requests`
- `dsb_waitlist`

### SQL de creare in repo
- Gasit:
  - `docs/supabase-dsb-leads.sql` (pentru `dsb_leads`)
- Lipsesc in repo scripturi SQL pentru celelalte tabele de mai sus.

## 6) API Routes
### Rute API detectate (`src/app/api/**/route.ts`)
- `/api/admin/tiktok-live`
- `/api/confirmation-feedback`
- `/api/contact`
- `/api/dsb-guide/access-status`
- `/api/dsb-guide/checkout`
- `/api/dsb-guide/webhook`
- `/api/dsb-leads`
- `/api/dsb-waitlist`
- `/api/eligibility-candidate-activity`
- `/api/save-employer-request`
- `/api/send-dsb-assistance`
- `/api/send-eligibility-assistance`
- `/api/send-partnership-request`
- `/api/send-request-email`
- `/api/simple-request`
- `/api/site-feedback`
- `/api/tiktok-live-status`
- `/api/token-data/[token]`
- `/api/verify-notification-email`
- `/api/verify-token`
- `/api/weekly-candidate-feedback-report`
- `/api/weekly-guide-interest-report`

### Error handling
- Majoritatea rutelor au handling explicit (status codes + validari + `try/catch` in multe cazuri).
- Unele rute gestioneaza partial erorile prin return-uri conditionale, nu neaparat `try/catch` global.

### Rute care ar trebui protejate suplimentar (recomandare)
- `/api/admin/tiktok-live`: protejata doar prin parola transmisa in payload.
- `/api/weekly-candidate-feedback-report` si `/api/weekly-guide-interest-report`: depind de `CRON_SECRET`; recomand hardening (header-based auth strict + logging minim).
- `/api/dsb-guide/checkout`: publica by design, dar necesita cleanup de debug logs si control strict de abuz/rate limiting.

## 7) Pagini fara metadata SEO
### Pagini cu metadata detectata
- `/`
- `/about`
- `/admin/live`
- `/contact`
- `/dsb-checklist`
- `/dsb-guide/eu`
- `/dsb-guide/non-eu`
- `/dsb-support`
- `/eligibility-assistance`
- `/for-candidates`
- `/for-employers`
- `/partners`

### Pagini fara metadata detectata
- `/download`
- `/feedback`
- `/dsb-assistance`
- `/outside-eu-eea`
- `/privacy`
- `/terms`
- `/request`
- `/request/[token]`
- `/score`
- `/verified`

## 8) TODO / FIXME / HACK / console.log
### TODO / FIXME / HACK
- Nu au fost gasite comentarii `TODO`, `FIXME`, `HACK` in `src/`.

### `console.log` detectate (de verificat)
- `src/app/api/dsb-guide/checkout/route.ts`:
  - `ENV CHECK - Supabase URL...`
  - `ENV CHECK - Service key...`
  - `GUIDE SLUG received...`
  - `GUIDE QUERY result...`
- `src/app/api/send-eligibility-assistance/route.ts`:
  - multiple logs verbose pe flow (turnstile, request/response tracing)
- `src/app/api/verify-notification-email/route.ts`:
  - debug pentru token verification
- `src/lib/notificationToken.ts`:
  - logs interne token/timestamps

## 9) Functionalitati incomplete
- `/partners` foloseste explicit "Coming soon" pe carduri (placeholder intentional).
- Layer de monetizare/compliance este implementat, dar anumite mesaje sunt inca orientate MVP si necesita QA UX final pe mobile.
- Nu s-au identificat formulare publice complet fara validare; validarea exista in majoritatea flow-urilor (client + server), dar nivelul difera.

## 10) Securitate
### Verificari
- Nu au fost gasite chei API hardcodate in fisierele din `src/`.
- Exista verificari de baza pe rute sensibile (secrete, parole, semnaturi Stripe, rate limiting pe unele endpoint-uri).

### Potentiale vulnerabilitati / riscuri
- Logging excesiv in endpoint-uri sensibile poate expune date operationale.
- Admin endpoint cu parola in body (fara autentificare robusta pe user/session).
- Suprafata mare de endpoint-uri publice fara schema unificata de auth/authorization.
- Recomandare: standardizare pe middleware de auth pentru rute administrative si reducere logging in productie.

## 11) Performance
- Nu au fost detectate tag-uri `<img>` brute in `src/`.
- Nu exista erori de compilare/performance blocking.
- Potentiale optimizari:
  - split pentru componente foarte mari de formular/API orchestration (ex. `send-eligibility-assistance` flow + pagini lungi de policy).
  - reducerea logging-ului runtime.

## 12) Stare generala per pagina (publica)
- `/`: OK build, metadata, link-uri principale valide, layout responsive din clase Tailwind.
- `/for-candidates`: OK build, metadata, link-uri functionale, responsive.
- `/for-employers`: OK build, metadata, link-uri functionale, responsive.
- `/dsb-support`: OK build, metadata, link-uri functionale, responsive.
- `/dsb-checklist`: OK build, metadata, responsive.
- `/partners`: OK build, metadata, pagina placeholder.
- `/about`, `/contact`: OK build, metadata prezenta.
- `/privacy`, `/terms`: continut complet legal, responsive; metadata lipsa.
- `/request`, `/score`, `/feedback`, `/download`, `/verified`, `/outside-eu-eea`, `/dsb-assistance`: build OK; unele fara metadata SEO.
- `/dsb-guide/eu` si `/dsb-guide/non-eu`: dynamic, metadata prezenta, protectii de continut implementate.

## Next steps recomandate (prioritizate)
1. **P1 - Security/Operations:** elimina `console.log` de debug din endpoint-uri de productie (`dsb-guide/checkout`, `notificationToken`, flows verbose).
2. **P1 - Config reliability:** completeaza `.env.example` cu toate variabilele citite de cod.
3. **P1 - Data layer reproducibility:** adauga SQL/migrations pentru toate tabelele Supabase utilizate.
4. **P2 - SEO:** adauga metadata pentru paginile publice lipsa (`privacy`, `terms`, `request`, `score`, etc.).
5. **P2 - API hardening:** standardizeaza autentificarea pentru endpoint-uri administrative/cron si formalizeaza rate limiting.
6. **P3 - Cleanup:** revizie pentru componente/pagini placeholder si consistenta UX copy.

## Cum sa folosesti acest raport
Intr-o sesiune noua Claude/GPT, lipeste:

`Continuam pe arbeidmatch-website. Iata auditul complet al site-ului:`

Apoi adauga ce vrei sa faci mai departe (de ex. "rezolva P1 si P2 in ordinea din audit", "doar SEO metadata", "hardening API admin").
