import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { REQUEST_WORDS } from "@/app/request/[token]/request-words";
import { buildCvEmail } from "@/lib/cv/emails";
import { EMAIL_REPLY_TO } from "@/lib/emailPremiumTemplate";
import {
  feedbackNoticeLetter,
  guideInterestLetter,
  partnerRejectedLetter,
  requestOtpLetter,
} from "@/lib/emails/letters";
import { buildArbeidmatchLetter, type EmailAudience } from "@/lib/arbeidmatchEmailShell";
import { legalSeedMarkdown } from "@/lib/legal-seed-documents-data";
import { SUPPORT_LABEL, SUPPORT_PAGE_PATH, SUPPORT_PAGE_URL } from "@/lib/supportPage";

/**
 * The owner's standing rule, 6 October 2026: no public e-mail address or phone is
 * given for questions; questions go to the support page. Privacy and legal (post@),
 * cv@ for CVs, the company identity and the mail sending addresses stay.
 */

const root = path.resolve(__dirname, "..", "..");
const source = (rel: string) => readFileSync(path.join(root, rel), "utf8");

// A mailbox or a Norwegian phone number offered to a reader.
const QUESTION_CONTACT = /support@arbeidmatch\.no|post@arbeidmatch\.no|tel:|\+47[\s-]?\d{2,3}[\s-]?\d{2}/;

describe("the support page is where questions go", () => {
  it("points at the support request on /contact", () => {
    expect(SUPPORT_PAGE_PATH).toBe("/contact?support=1");
    expect(SUPPORT_PAGE_URL).toBe("https://arbeidmatch.no/contact?support=1");
    expect(SUPPORT_LABEL.en).toBe("our support");
    expect(SUPPORT_LABEL.nb).toBe("vår support");
  });

  it("/terms carries no local text: it renders the platform's published terms", () => {
    const page = source("src/app/terms/page.tsx");
    expect(page).toContain('fetchAtsLegalDocument("tos-platform")');
    expect(page).not.toMatch(QUESTION_CONTACT);
  });

  it("the swept public pages give no mailbox or phone for questions", () => {
    for (const rel of [
      "src/app/newsletter/page.tsx",
      "src/components/about/AboutJsonLd.tsx",
      "src/components/about/AboutUnderConstruction.tsx",
      "src/app/api/slack/interactions/route.ts",
      "src/lib/cv/emails.ts",
      "src/lib/cv/org.ts",
    ]) {
      expect(source(rel), rel).not.toMatch(QUESTION_CONTACT);
    }
    // The wizard words carry phone placeholders for the form itself ("+47 000 00 000"), so only mailboxes are checked there.
    expect(source("src/app/request/[token]/request-words.ts")).not.toMatch(/(support|post)@arbeidmatch\.no/);
    expect(source("src/app/newsletter/page.tsx")).toContain("SUPPORT_PAGE_PATH");
    expect(source("src/components/about/AboutJsonLd.tsx")).not.toContain("telephone");
    expect(source("src/app/api/slack/interactions/route.ts")).toContain("SUPPORT_PAGE_URL");
  });

  it("the request wizard sends the reader to support to stop updates", () => {
    for (const words of Object.values(REQUEST_WORDS)) {
      expect(words.subscribeHelp).not.toContain("@");
    }
    expect(REQUEST_WORDS.en.subscribeHelpSupport).toBe(SUPPORT_LABEL.en);
    expect(REQUEST_WORDS.no.subscribeHelpSupport).toBe(SUPPORT_LABEL.nb);
    expect(source("src/app/request/[token]/page.tsx")).toContain("href={SUPPORT_PAGE_PATH}");
  });

  it("the CV letter links support for questions, in both languages", () => {
    for (const lang of ["en", "ro"] as const) {
      const html = buildCvEmail("https://www.arbeidmatch.no/my-data", lang);
      expect(html).toContain(`href="${SUPPORT_PAGE_URL}"`);
      expect(html).not.toMatch(/@arbeidmatch\.no/);
    }
  });

  it("the partner refusal letter links support, not a mailbox", () => {
    const letter = partnerRejectedLetter({ to: "someone@example.com", unsubscribeUrl: "https://example.com/u" });
    expect(letter.html).toContain(`href="${SUPPORT_PAGE_URL}"`);
    expect(letter.html).toContain(SUPPORT_LABEL.en);
  });
});

/** The foot of a letter: from the contact box to the end. The body is above it. */
function footerOf(html: string): string {
  const at = html.indexOf("border-left:2px solid #C9A84C;padding:14px 16px");
  expect(at, "the letter has a contact box").toBeGreaterThan(-1);
  return html.slice(at);
}

const FOOT_PHONE = /967\s?34\s?730|4796734730|tel:|\+47[\s-]?\d/;
const FOOT_ADDRESS = /\b(post|support|cv)@arbeidmatch\.no\b/;

/**
 * R106d, the owner's rule confirmed 6 October 2026: the foot of every mail carries
 * the support link and the company identity, and no telephone or office address.
 */
describe("R106d: the foot of every mail the website sends", () => {
  const WORDS = { no: "Spørsmål? Kontakt vår support", en: "Questions? Contact our support" } as const;

  for (const audience of ["client", "candidate", "support"] as EmailAudience[]) {
    for (const lang of ["no", "en"] as const) {
      it(`${audience}, ${lang}: the support link and the legal identity, no telephone, no office address`, () => {
        const html = buildArbeidmatchLetter({ title: "T", innerHtml: "<p>x</p>", audience, lang, recipient: "reader@example.com", unsubscribeUrl: "https://example.com/u" });
        const foot = footerOf(html);
        expect(foot).not.toMatch(FOOT_PHONE);
        expect(foot).not.toMatch(FOOT_ADDRESS);
        expect(foot).not.toContain("Kontoret");
        expect(foot).toContain(`href="${SUPPORT_PAGE_URL}"`);
        expect(foot).toContain(WORDS[lang]);
        expect(foot).toContain("ArbeidMatch Norge AS");
        expect(foot).toContain("935 667 089");
        expect(foot).toContain("Sverre Svendsens veg 38, 7056 Ranheim, Norway");
      });
    }
  }

  it("the real letters: a candidate's, a code, a legal receipt and an internal notice", () => {
    const letters = [
      guideInterestLetter({ specialty: "Welder", guideWanted: true, to: "reader@example.com", unsubscribeUrl: "https://example.com/u" }).html,
      requestOtpLetter({ code: "123456", to: "reader@example.com", unsubscribeUrl: "https://example.com/u" }).html,
      feedbackNoticeLetter({ score: 9, source: "s", purpose: "p", pageUrl: "https://example.com", submittedAt: "now", email: "", note: "" }).html,
    ];
    for (const html of letters) {
      const foot = footerOf(html);
      expect(foot).toContain(SUPPORT_PAGE_URL);
      expect(foot).not.toMatch(FOOT_PHONE);
      expect(foot).not.toMatch(/mailto:(post|support|cv)@arbeidmatch\.no/);
    }
  });

  it("a desk named by the caller is no longer printed in the foot", () => {
    const html = buildArbeidmatchLetter({ title: "T", innerHtml: "<p>x</p>", contactEmail: "legal@arbeidmatch.no" });
    expect(footerOf(html)).not.toContain("legal@arbeidmatch.no");
    expect(footerOf(html)).toContain(SUPPORT_PAGE_URL);
  });

  it("the guide sign-up's plain-text part gives the support link, not cv@", () => {
    const route = source("src/app/api/guide-interest-signup/route.ts");
    expect(route).toContain("Questions? Contact our support: ${SUPPORT_PAGE_URL}");
    expect(route).not.toContain("send your CV to: cv@arbeidmatch.no");
  });

  it("a letter that asks for a CV keeps cv@ in its body", () => {
    const html = buildArbeidmatchLetter({
      title: "T",
      innerHtml: "<p>Send your CV to <strong>cv@arbeidmatch.no</strong>.</p>",
      audience: "candidate",
      lang: "en",
    });
    const at = html.indexOf("border-left:2px solid #C9A84C;padding:14px 16px");
    expect(html.slice(0, at)).toContain("cv@arbeidmatch.no");
    expect(footerOf(html)).not.toMatch(FOOT_ADDRESS);
  });

  it("the shell source names no office telephone", () => {
    expect(source("src/lib/arbeidmatchEmailShell.ts")).not.toMatch(/967\s?34\s?730|tel:/);
  });
});

describe("the kept exceptions remain", () => {

  it("mail is still sent and replied to from the configured addresses", () => {
    expect(EMAIL_REPLY_TO).toBe("support@arbeidmatch.no");
    expect(source("src/app/api/contact/route.ts")).toContain('process.env.SUPPORT_EMAIL || "support@arbeidmatch.no"');
  });

  it("the privacy and legal contact stays post@", () => {
    expect(legalSeedMarkdown("Terms of Service")).toContain("post@arbeidmatch.no");
    expect(source("src/app/request/page.tsx")).toContain("Kontakt:</strong> post@arbeidmatch.no");
    expect(source("src/app/legal-request/LegalRequestForm.tsx")).toContain("post@arbeidmatch.no");
  });

  it("the company identity in the footer and the stand-in stays", () => {
    const footer = source("src/components/Footer.tsx");
    expect(footer).toContain("Org.nr 935 667 089 MVA");
    expect(footer).toContain('username="post"');
    expect(legalSeedMarkdown("Terms of Service")).toContain("935 667 089");
    expect(legalSeedMarkdown("Terms of Service")).toContain("Sverre Svendsens veg 38");
  });

  it("cv@ stays the address candidates send CVs to", () => {
    expect(source("src/app/api/contact/route.ts")).toContain('"cv@arbeidmatch.no"');
  });
});
