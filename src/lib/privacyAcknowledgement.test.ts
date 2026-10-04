import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Legal review, 25 September 2026, approved by the owner: nobody is asked to
 * accept or agree to the privacy notice. It is information, so a form says
 * "I have read the privacy notice", and any consent sits in a box of its own.
 * A job applicant is not a party to our Terms either, so the Apply window
 * asks for neither.
 *
 * The check reads the source as a visitor would read the page: JSX spacing and
 * tags removed, whitespace collapsed, so a sentence split over lines and links
 * is still caught.
 */

const ROOT = join(__dirname, "..");

// The seed legal documents are placeholders, not forms; tests quote the rule.
const SKIP = [/legal-seed-documents/, /\.test\.tsx?$/];

const FORBIDDEN: RegExp[] = [
  /\baccept(s|ing)? (the|our) (privacy|personvern)/i,
  /\bread and accept\b/i,
  /\bagree(s)? to (the|our) (privacy|terms)/i,
  /\byou agree to our\b/i,
  /\bin accordance with the privacy/i,
  /\baccording to the privacy/i,
  /godta(r)? (dere )?personvernerkl/i,
  /godtar dere personvernerkl/i,
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(name) && !SKIP.some((re) => re.test(full))) out.push(full);
  }
  return out;
}

function asRead(source: string): string {
  return source
    .replace(/\{"\s*"\}/g, " ")
    .replace(/<[^<>]*>/g, " ")
    .replace(/\s+/g, " ");
}

describe("the privacy notice is acknowledged, never accepted", () => {
  it("normalises JSX the way a visitor reads it", () => {
    const jsx = 'I have read and accept the{" "}\n  <Link href="/privacy" className="x">\n    privacy policy\n  </Link>';
    expect(FORBIDDEN.some((re) => re.test(asRead(jsx)))).toBe(true);
    expect(FORBIDDEN.some((re) => re.test(asRead('I have read the{" "}<Link href="/privacy">privacy notice</Link>.')))).toBe(false);
  });

  it("no form or sentence on the site asks anyone to accept or agree to it", () => {
    const hits: string[] = [];
    for (const file of sourceFiles(ROOT)) {
      const text = asRead(readFileSync(file, "utf8"));
      for (const re of FORBIDDEN) {
        const m = text.match(re);
        if (m) hits.push(`${relative(ROOT, file)}: "${m[0]}"`);
      }
    }
    expect(hits).toEqual([]);
  });

  /**
   * ONE BOX SINCE 4 OCTOBER 2026, and the legal rule is unchanged.
   *
   * HIS WORDS: "aici in loc de 2 casute sa fie numai una care sa le includa pe
   * amandoua". This used to require the two sentences in two boxes, which was
   * the shape the 25 September review happened to arrive in, not the rule it
   * set. The rule is that the notice is READ and never accepted, that the
   * consent to process is given in so many words, and that an applicant is
   * asked for no Terms. All three still hold in the single sentence, and the
   * FORBIDDEN sweep above still catches any wording that would accept it.
   */
  it("the Apply window asks for no Terms, reads the notice and gives the consent", () => {
    const text = asRead(readFileSync(join(ROOT, "components/jobs/ApplyGateButton.tsx"), "utf8"));
    expect(text).not.toMatch(/Terms of Service/);
    expect(text).toMatch(/I have read the privacy notice/);
    expect(text).toMatch(/consent to ArbeidMatch processing my personal data/);
    // Read, never accepted - the thing the review was actually about.
    expect(text).not.toMatch(/accept (the )?privacy/i);
  });
});
