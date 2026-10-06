import { describe, expect, it } from "vitest";

import { buildArbeidmatchLetter, emailPreheaderText, letterParagraph } from "@/lib/arbeidmatchEmailShell";
import { contactReceiptLang, contactReceiptLetter, requestOtpLetter } from "@/lib/emails/letters";

const visible = (html: string) => html.replace(/<!--AM_PREHEADER-->[\s\S]*?<!--\/AM_PREHEADER-->/g, "");
const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

describe("the website letter, aligned with the ATS", () => {
  const html = buildArbeidmatchLetter({
    title: "Forespørselen er mottatt",
    innerHtml: letterParagraph("Takk. Vi har mottatt forespørselen deres. Svar på denne e-posten hvis noe er feil."),
    recipient: "client@example.no",
    unsubscribeUrl: "https://arbeidmatch.no/api/unsubscribe?token=t",
  });

  it("names the system RecOS beta, never ArbeidMatch ATS", () => {
    expect(html).toContain("RecOS beta");
    expect(html).not.toContain("ArbeidMatch ATS");
  });

  it("gives the address as Ranheim, Norway", () => {
    expect(html).toContain("7056 Ranheim, Norway");
    expect(html).not.toContain("Ranheim, Trondheim");
  });

  it("asks for a reply once, in the body, not again in the footer", () => {
    expect(count(visible(html).toLowerCase(), "svar på denne e-posten")).toBe(1);
  });

  it("carries a hidden preheader and an emblem without alt text", () => {
    expect(html).toContain("<!--AM_PREHEADER-->");
    expect(html).toMatch(/<img [^>]*alt=""/);
    expect(html).toContain("https://www.arbeidmatch.no/brand/arbeidmatch-emblem-email.png");
  });

  it("is Norwegian unless told otherwise", () => {
    expect(html).toContain('<html lang="no">');
  });
});

describe("the preheader", () => {
  it("skips a greeting and takes the first sentence", () => {
    expect(emailPreheaderText("<p>Hei,</p><p>Vi har mottatt forespørselen deres. Mer tekst.</p>")).toBe(
      "Vi har mottatt forespørselen deres.",
    );
  });
});

describe("the verification code letter", () => {
  const letter = requestOtpLetter({ code: "123456", to: "client@example.no", unsubscribeUrl: "https://x", role: "Carpenter" });

  it("is in Norwegian and says why only once", () => {
    expect(letter.subject).toContain("bekreftelseskode");
    expect(letter.html).toContain("Du ba om kandidater til stillingen som <strong>Carpenter</strong>");
    const text = visible(letter.html);
    expect(text).not.toContain("You are receiving this because");
    expect(count(text, "Du får denne e-posten fordi")).toBe(1);
  });

  it("does not put the code in the inbox preview", () => {
    const preheader = /<!--AM_PREHEADER-->([\s\S]*?)<!--\/AM_PREHEADER-->/.exec(letter.html)?.[1] ?? "";
    expect(preheader).not.toContain("123456");
  });
});


describe("contact form receipt language", () => {
  const args = { name: "Navn", need: "Employer inquiry", to: "recipient@example.test", unsubscribeUrl: "https://example.test/unsubscribe" };

  it("sends a Norwegian receipt for the Norwegian form", () => {
    const receipt = contactReceiptLetter({ ...args, lang: "nb" });
    expect(receipt.subject).toBe("Vi har mottatt meldingen din - ArbeidMatch");
    expect(receipt.html).toContain('<html lang="no">');
    expect(receipt.html).toContain("Hei Navn,");
    expect(receipt.html).toContain("Takk for at du tok kontakt med oss. Vi har mottatt meldingen din og svarer så snart vi kan.");
    expect(receipt.html).toContain("Med vennlig hilsen,");
    expect(receipt.html).not.toContain("Kind regards");
  });

  it("sends an English receipt for the foreign form", () => {
    const receipt = contactReceiptLetter({ ...args, lang: "en" });
    expect(receipt.subject).toBe("We received your message - ArbeidMatch");
    expect(receipt.html).toContain('<html lang="en">');
    expect(receipt.html).toContain("Hi Navn,");
    expect(receipt.html).toContain("Thank you for contacting us. We received your message and will respond shortly.");
    expect(receipt.html).toContain("Kind regards,");
    expect(receipt.html).not.toContain("Med vennlig hilsen");
  });

  it("uses the form context for a missing or invalid language", () => {
    expect(contactReceiptLang(undefined, "nb")).toBe("nb");
    expect(contactReceiptLang("fr", "nb")).toBe("nb");
    expect(contactReceiptLang(undefined, "en")).toBe("en");
    expect(contactReceiptLang("no", "en")).toBe("en");
    expect(contactReceiptLang("nb", "en")).toBe("nb");
    expect(contactReceiptLang("en", "nb")).toBe("en");
  });
});
