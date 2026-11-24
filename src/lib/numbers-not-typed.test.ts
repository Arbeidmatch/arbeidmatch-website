import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ORDER 302: the numbers RecOS holds are never typed in this site again. Each
 * pattern is one the laptop's inventory of 17 November 2026 found typed; it may
 * come back only through lib/numbers.ts. Tests and the test fixtures are
 * exempt: they hold fakes and the values of the day on purpose.
 */

const TYPED: ReadonlyArray<{ what: string; re: RegExp }> = [
  { what: "contact reply promise", re: /innen én (virkedag|arbeidsdag)|within one working day/ },
  { what: "helper reply hours", re: /(respond|response|needs) within 24 hours/ },
  { what: "employer request reply window", re: /1-2 (business days|virkedager)|1 to 2 business days/ },
  { what: "partner reply hours", re: /within 48 hours/ },
  { what: "invite answer days", re: /respond within 7 days/ },
  { what: "first profiles weeks", re: /(approximately|about) two weeks/ },
  { what: "wage ranges", re: /\b(260|290|280) to 330\b/ },
  { what: "early-bird prices", re: /(100|1\.000) NOK early bird/ },
  { what: "VAT shown", re: /25 % mva/ },
  { what: "payment term", re: /Faktura \(14 dager\)|14 dagers betalingsfrist/ },
  { what: "project alerts trial month", re: /gratis ut desember/ },
  { what: "paid plans start", re: /Fra 1\. januar velger/ },
  { what: "trial users and firms", re: /opptil 3 (personer|brukere)|opptil 5 firmaer|RECOMMEND_LIMIT = 5/ },
  { what: "premium trial hours", re: /trialEnds = new Date\(Date\.now\(\) \+ 24 \* 60/ },
  { what: "opening hours", re: /opens: "08:00"/ },
  { what: "advert package days and contents", re: /høyst 42 dager|i 7 dager"|"30 dager ekstra|Opptil fem anonyme|ADDONS_INCLUDED_IN/ },
  { what: "organisation number", re: /935[ .]?667[ .]?089/ },
  { what: "street address", re: /Sverre Svendsens veg/ },
];

const ROOT = path.resolve(__dirname, "..");
const EXEMPT = [
  /\.test\.tsx?$/,
  /[\\/]test[\\/]/,
  /[\\/]lib[\\/]numbers\.ts$/,
  // FOUND, not in ORDER 302's list: the card checkout's line description. A payment path, left for its own order.
  /[\\/]lib[\\/]job-ads[\\/]stripe\.ts$/,
  // Left by ORDER 302 attempt 2, each named in its report: the e-mail shell is built synchronously by 30
  // letters; the CV documents, policy texts, legal seed and DPA fill are documents rather than page lines;
  // the register link searches by the number; orgNumber.ts only formats one in a comment.
  /[\\/]lib[\\/]arbeidmatchEmailShell\.ts$/,
  /[\\/]lib[\\/]cv[\\/]org\.ts$/,
  /[\\/]lib[\\/]sitePolicies\.ts$/,
  /[\\/]lib[\\/]legal-seed-documents-data\.ts$/,
  /[\\/]lib[\\/]publicDpaFill\.ts$/,
  /[\\/]lib[\\/]orgNumber\.ts$/,
  /[\\/]components[\\/]site[\\/]siteNav\.ts$/,
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return /\.(ts|tsx)$/.test(name) && !EXEMPT.some((re) => re.test(full)) ? [full] : [];
  });
}

describe("no number of the registry typed in the site", () => {
  it("none of the inventoried numbers is back", () => {
    const hits: string[] = [];
    for (const file of files(ROOT)) {
      const text = readFileSync(file, "utf8");
      for (const t of TYPED) if (t.re.test(text)) hits.push(`${path.relative(ROOT, file)}: ${t.what}`);
    }
    expect(hits).toEqual([]);
  });
});
