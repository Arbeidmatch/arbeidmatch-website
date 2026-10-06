import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { REQUEST_WORDS } from "@/app/request/[token]/request-words";
import { buildCvEmail } from "@/lib/cv/emails";
import { EMAIL_REPLY_TO } from "@/lib/emailPremiumTemplate";
import { partnerRejectedLetter } from "@/lib/emails/letters";
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
