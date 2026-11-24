import { afterEach, describe, expect, it } from "vitest";

import { buildArbeidmatchLetter, fillLetterCompanyFacts, letterNeedsCompanyFacts } from "@/lib/arbeidmatchEmailShell";
import { buildOtpEmail } from "@/lib/cv/emails";
import { controllerFooter, cvController } from "@/lib/cv/org";
import { legalSeedMarkdown } from "@/lib/legal-seed-documents-data";
import { forgetNumbersForTests } from "@/lib/numbers";
import { fillPublicDpaText } from "@/lib/publicDpaFill";

/**
 * ORDER 302, the company facts: the org number and the street in the letters,
 * the CV documents, the DPA and the legal stand-in come from RecOS. Faked
 * values are found; with none, the piece is left out and nothing is typed in.
 */
const FAKE = { company_org_number: "123 456 785", company_street_address: "Testveien 9" };

afterEach(() => forgetNumbersForTests());

describe("the letter's foot", () => {
  const letter = () => buildArbeidmatchLetter({ title: "Test", lang: "no", innerHtml: "<p>Hei</p>", audience: "client", serviceLetter: true });

  it("marks the place when the server has read no numbers, and the send fills it", () => {
    const html = letter();
    expect(letterNeedsCompanyFacts(html)).toBe(true);
    expect(html).toContain("ArbeidMatch Norge AS<br/>");
    const sent = fillLetterCompanyFacts(html, FAKE);
    expect(letterNeedsCompanyFacts(sent)).toBe(false);
    expect(sent).toContain("ArbeidMatch Norge AS &middot; Org.nr 123 456 785<br/>");
    expect(sent).toContain("Testveien 9, 7056 Ranheim, Norway<br/>");
  });

  it("with no numbers at all, the foot names the company and leaves the rest out", () => {
    const sent = fillLetterCompanyFacts(letter(), {});
    expect(sent).toContain("ArbeidMatch Norge AS<br/>");
    expect(sent).not.toContain("Org.nr");
    expect(sent).not.toContain("Ranheim");
  });
});

describe("the CV documents and letters", () => {
  it("read the faked numbers", () => {
    expect(controllerFooter(FAKE)).toBe("ArbeidMatch Norge AS, org.nr. 123 456 785, Testveien 9, 7056 Ranheim, Norway");
    expect(buildOtpEmail("123456", "en", FAKE)).toContain("org.nr. 123 456 785, Testveien 9");
  });

  it("leave a missing one out", () => {
    expect(controllerFooter({})).toBe("ArbeidMatch Norge AS, Norway");
    expect(cvController({})).toMatchObject({ orgNumber: null, address: null });
  });
});

describe("the DPA and the legal stand-in", () => {
  it("fill from the faked numbers, and a missing one reads as its label", () => {
    expect(fillPublicDpaText("{{PROCESSOR_ORG_NUMBER}} / {{PROCESSOR_REGISTERED_ADDRESS}}", FAKE)).toBe(
      "123 456 785 / Testveien 9, 7056 Ranheim, Norway",
    );
    expect(fillPublicDpaText("{{PROCESSOR_ORG_NUMBER}}", {})).toBe("[processor org number]");
  });

  it("the stand-in says who we are with what RecOS gives", () => {
    expect(legalSeedMarkdown("Privacy Notice", FAKE)).toContain(
      "ArbeidMatch Norge AS, organisation number 123 456 785 MVA, Testveien 9, 7056 Ranheim, Trondheim, Norway.",
    );
    expect(legalSeedMarkdown("Privacy Notice", {})).toContain("ArbeidMatch Norge AS, Trondheim, Norway.");
  });
});
