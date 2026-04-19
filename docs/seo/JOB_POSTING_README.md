# JobPosting JSON-LD (Google for Jobs)

## `jobLocationType` og «TELECOMMUTE: false»

Google bruker `jobLocationType` primært for **fjernarbeid**. For stillinger på norsk byggeplass: **utelat** feltet, eller bruk `ONSITE`-modellering kun dersom dere følger oppdatert Schema.org/Google-dokumentasjon. Ikke sett `TELECOMMUTE` med «false» som tekststreng — det er ikke et gyldig enum‑trekk i JSON-LD.

## Obligatoriske felt (Google, 2025)

Google krever typisk at disse er sannferdige og synlige for brukeren på annonse-siden:

- `title`
- `description` (HTML tillatt; må gjenspeile det kandidaten ser)
- `datePosted` (ISO 8601)
- `hiringOrganization` (med `name`; `sameAs` og `logo` anbefales)
- `jobLocation` **eller** `jobLocationType` der det er relevant (hybrid/remote)

Anbefales sterkt for kvalitet og visning:

- `employmentType` (bruk Schema.org enumerations, f.eks. `FULL_TIME`, `TEMPORARY`)
- `baseSalary` (valuta + intervall + `unitText` som `HOUR`, `MONTH`, `YEAR`)
- `validThrough`
- `identifier` (unik jobb-ID fra Recman)
- `url` (kanonisk URL til stillingsannonse, gjerne på `jobs.arbeidmatch.no`)
- `directApply` når søknad skjer på samme URL

## Anbefalte felt

- `occupationalCategory` (ESCO-kode der dere har det)
- `experienceRequirements`, `qualifications`, `educationRequirements`, `skills`
- `industry`
- `workHours` (f.eks. heltid/deltid tekstlig)

## Eksempel og mal

- Mal: `job-posting-template.json` (erstatt `{{...}}` og fjern kommentarer i egen kopi — JSON tillater ikke kommentarer i produksjon)
- Utfylt eksempel: `job-posting-example-betongarbeider-oslo.json`

## Dynamisk generering i Recman / ATS

1. **Webhook eller eksport**: Når en annonse publiseres/endres, hent feltene `title`, `description`, `city`, `employmentType`, `salaryMin/Max`, `postedAt`, `deadline`, `jobId`, `applyUrl`.
2. **Server-side rendering**: Generer JSON-LD i HTML `<head>` eller rett før `</body>` på stillingssiden på `jobs.arbeidmatch.no` — ikke kun i klientbundle.
3. **Synk med synlig innhold**: `description` i JSON-LD skal matche synlig stillingstekst (Google sammenligner).
4. **Validering**: Kjør URL i [Rich Results Test](https://search.google.com/test/rich-results) etter deploy.
5. **Expiry**: Oppdater `validThrough` eller fjern blokken når stillingen stenges, for å unngå «utløpt»-feil i Search Console.

## Lønn i Norge (kollektiv avtale)

Sett `minValue` / `maxValue` i tråd med gjeldende byggeoverenskomst / relevant tariff for stillingen. Bruk `unitText: "MONTH"` for månedslønn eller `HOUR` for timelønn dersom annonsen er timelønnet — vær konsekvent med det som faktisk annonseres.

## Viktig om rekrutterer vs. sluttkunde

Når ArbeidMatch står som rekrutterer, er `hiringOrganization` ArbeidMatch. Navnet på sluttkunde kan beskrives i `description` og eventuelt struktureres med `hiringOrganization` + `subOrganization` dersom dere juridisk skal modellere oppdragsgiver — avklar med juridisk rådgiver før dere endrer modellen.
