import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import ContactPageClient from "./ContactPageClient";
import Footer from "./Footer";
import { CONTACT_FORM_COPY, ORIGIN_LABELS } from "@/lib/contactFormCopy";
import { EEA_COUNTRIES } from "@/lib/foreignCompany";

vi.mock("next/navigation", () => ({ usePathname: () => "/contact" }));

/** The EU's 27 and the EEA's three; Norway writes through Brreg, so it is not in the list. */
const EU_EEA = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO",
]);

function page(props: Parameters<typeof ContactPageClient>[0]): string {
  const { initialAudience = "employer", initialOrigin = "norway" } = props;
  return renderToStaticMarkup(createElement(ContactPageClient, { initialAudience, initialOrigin }));
}

function formOf(html: string): string {
  const match = html.match(/<form[\s\S]*<\/form>/);
  if (!match) throw new Error("no form rendered");
  return match[0];
}

function headingOf(html: string): string {
  return html.match(/<h1[\s\S]*?<\/h1>\s*<p[\s\S]*?<\/p>/)?.[0] ?? "";
}

/** The Norwegian words the English form must not show (the ones the two languages do not share). */
const NORWEGIAN_ONLY = Object.entries(CONTACT_FORM_COPY.nb)
  .filter(([key, value]) => CONTACT_FORM_COPY.en[key as keyof typeof CONTACT_FORM_COPY.en] !== value)
  .map(([, value]) => value)
  // A sample phone number is not a word of either language.
  .filter((value) => /[a-z]/i.test(value));

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("contact page: a company from another EU/EEA country reads English (W1)", () => {
  it("names the option in English, next to the Norwegian one", () => {
    const html = page({});
    expect(html).toContain(ORIGIN_LABELS.norway);
    expect(html).toContain(ORIGIN_LABELS.foreign);
    expect(html).not.toContain("Bedrift i et annet EU/EØS-land");
  });

  it("switches every word of the form to English once the foreign option is chosen", () => {
    const html = page({ initialOrigin: "foreign" });
    const form = formOf(html);
    for (const label of ["Name", "Company name", "Country", "VAT number (EU VAT)", "Email", "Phone", "Message", "Choose country", "Send message", "privacy notice"]) {
      expect(form).toContain(label);
    }
    for (const word of NORWEGIAN_ONLY) {
      expect(form, `Norwegian left in the English form: ${word}`).not.toContain(escape(word));
    }
    // The page framing follows the selected form language, except for the Norwegian choice label.
    for (const text of ["Company", "Address", "We are based in Trondheim", "Where is the company registered?", "7056 Ranheim, Trondheim, Norway"]) {
      expect(html).toContain(escape(text));
    }
    expect(html).toContain(escape("Norsk bedrift"));
    for (const text of ["Bedrift", "Adresse", "Vi holder til i Trondheim", "Hvor er bedriften registrert?", "Trondheim, Norge"]) {
      expect(html).not.toContain(escape(text));
    }
    // The heading above the form follows the form.
    const heading = headingOf(html);
    expect(heading).toContain("Contact us");
    expect(heading).not.toContain("Ta kontakt");
    expect(form).toContain('lang="en"');
  });

  it("keeps the Norwegian company's form Norwegian", () => {
    const form = formOf(page({}));
    for (const label of ["Navn", "E-post", "Melding", "Send melding", "personvernerklæringen"]) expect(form).toContain(escape(label));
    expect(form).not.toContain("Company name");
    const html = page({});
    for (const text of ["Bedrift", "Norsk bedrift", "Adresse", "Vi holder til i Trondheim"]) expect(html).toContain(escape(text));
  });

  it("gives the candidate an English form throughout", () => {
    const html = page({ initialAudience: "candidate" });
    const form = formOf(html);
    for (const word of NORWEGIAN_ONLY) {
      expect(form, `Norwegian left in the candidate form: ${word}`).not.toContain(escape(word));
    }
    expect(headingOf(html)).not.toContain("Ta kontakt");
  });
});

describe("contact page: the country list (W1)", () => {
  it("offers EU/EEA countries only: no United Kingdom, no Switzerland, nothing outside Europe", () => {
    for (const country of EEA_COUNTRIES) expect(EU_EEA.has(country.code), country.code).toBe(true);
    expect(EEA_COUNTRIES.map((c) => c.code)).not.toContain("GB");
    expect(EEA_COUNTRIES.map((c) => c.code)).not.toContain("CH");
    expect(EEA_COUNTRIES).toHaveLength(29);
  });

  it("renders only those countries in the select", () => {
    const form = formOf(page({ initialOrigin: "foreign" }));
    const values = [...form.matchAll(/<option value="([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
    expect(values).toHaveLength(EEA_COUNTRIES.length);
    for (const code of values) expect(EU_EEA.has(code), code).toBe(true);
  });
});

describe("support instead of an e-mail address (W1)", () => {
  function supportBlock(html: string): string {
    const match = html.match(/<div[^>]*data-testid="contact-support"[\s\S]*?<\/button><\/div>/);
    if (!match) throw new Error("no support block rendered");
    return match[0];
  }

  it("shows Kundestøtte and a Contact support button on the contact page, and no address", () => {
    const html = page({});
    const block = supportBlock(html);
    expect(block).toContain("Kundestøtte");
    expect(block).toContain("Kontakt support");
    expect(block).not.toContain("@");
    expect(block).not.toContain("mailto:");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("@arbeidmatch");
    expect(html).not.toContain("Vis e-postadressen");
  });

  it("says Support and Contact support in English", () => {
    const block = supportBlock(page({ initialOrigin: "foreign" }));
    expect(block).toContain("Support");
    expect(block).toContain("Contact support");
    expect(block).not.toContain("@");
  });

  it("leaves the footer with a support button and no support mailbox", () => {
    const html = renderToStaticMarkup(createElement(Footer));
    expect(html).toContain("Kontakt support");
    expect(html).not.toContain("support@");
    expect(html).not.toContain("Generelle henvendelser");
  });
});
