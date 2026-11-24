import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NumbersProvider } from "@/components/NumbersProvider";
import type { SiteNumbers } from "@/lib/numbers";

/**
 * ORDER 302: the pages print what RecOS answers. Every value here is a fake no
 * page has ever shown, so finding it proves the page read it rather than a typed
 * copy; and with no answer at all, the sentence goes without its number.
 */

const FAKE: SiteNumbers = {
  reply_promise_contact: 3,
  reply_hours_helper: 37,
  reply_days_employer_request_min: 4,
  reply_days_employer_request_max: 6,
  reply_hours_partner: 71,
  reply_days_invite: 9,
  first_profiles_weeks: 5,
  wage_electrician_min: 271,
  wage_electrician_certified_min: 293,
  wage_electrician_max: 347,
  wage_welder_min: 283,
  wage_welder_max: 351,
  company_org_number: "123 456 789",
  company_street_address: "Prøvegata 9",
  company_opening_hours: "Mo-Th 07:30-15:00",
  project_alerts_trial_until: "2027-03-31",
  hiring_plans_from: "2027-04-01",
  alerts_trial_max_users: 6,
};

const state = vi.hoisted(() => ({ numbers: {} as Record<string, unknown> }));
vi.mock("@/lib/numbers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/numbers")>()),
  getSiteNumbers: async () => state.numbers,
}));

const html = (el: ReactElement, numbers: SiteNumbers = FAKE) => renderToStaticMarkup(createElement(NumbersProvider, { numbers }, el));

describe("English pages and letters", () => {
  it("the electricians page prints both ranges from RecOS", async () => {
    state.numbers = FAKE;
    const { default: Page } = await import("@/components/candidates/ElectriciansNorwayPage");
    const out = html(await Page());
    expect(out).toContain("271 to 347 NOK per hour");
    expect(out).toContain("approx. 293 to 347 NOK/hour");
  });

  it("the welding page prints the range, the weeks and the hours", async () => {
    state.numbers = FAKE;
    const { default: Page } = await import("@/components/welding/WeldingSpecialistsPage");
    const out = html(await Page());
    expect(out).toContain("283 to 351 NOK per hour");
    expect(out).toContain("within approximately five weeks of receiving a request");
    expect(out).toContain("We assess your needs within 37 hours.");
    expect(out).toContain("within about five weeks.");
  });

  it("candidate support prints the reply promise", async () => {
    state.numbers = FAKE;
    const { default: Page } = await import("@/components/site/candidates/CandidateSupport");
    expect(html(await Page())).toContain("We reply within 3 working days.");
  });

  it("the partner letters print RecOS's times", async () => {
    const { partnerContactedLetter, recruiterApplicationReceiptLetter } = await import("@/lib/emails/letters");
    expect(partnerContactedLetter({ to: "a@example.invalid", unsubscribeUrl: "https://example.invalid/u", numbers: FAKE }).html).toContain("within 4 to 6 business days");
    const receipt = recruiterApplicationReceiptLetter({ fullName: "A", country: "B", region: "C", partnerType: "D", monthlyReach: "1", to: "a@example.invalid", unsubscribeUrl: "https://example.invalid/u", numbers: FAKE });
    expect(receipt.html).toContain("contact you within 71 hours.");
  });

  it("the home page data carries the company facts", async () => {
    const { default: HomeJsonLd } = await import("@/components/seo/HomeJsonLd");
    const out = html(createElement(HomeJsonLd, { numbers: FAKE }));
    expect(out).toContain('"streetAddress":"Prøvegata 9"');
    expect(out).toContain('"taxID":"123456789"');
    expect(out).toContain('"dayOfWeek":["Monday","Tuesday","Wednesday","Thursday"]');
    expect(out).toContain('"opens":"07:30"');
  });
});

describe("Norwegian pages", () => {
  it("the contact page description carries the reply promise", async () => {
    state.numbers = FAKE;
    const { generateMetadata } = await import("@/app/contact/page");
    expect((await generateMetadata()).description).toContain("Vi svarer innen 3 virkedager.");
  });

  it("Min side's contact card and plans line read RecOS", async () => {
    const { MinSideContactCard } = await import("@/components/min-side/MinSideCityQuestion");
    const card = html(createElement(MinSideContactCard, { person: { name: "Test Person", phone: null, avatar_url: null } as never }));
    expect(card).toContain("Vi svarer innen 3 arbeidsdager.");
    const { plansClosedLine } = await import("@/lib/min-side/profile");
    expect(plansClosedLine(FAKE.hiring_plans_from as string)).toBe("Fra 1. april velger dere abonnement.");
  });
});

describe("step 5: with no answer from RecOS at all", () => {
  it("each sentence reads without its number, or its block is left out", async () => {
    state.numbers = {};
    const { default: Electricians } = await import("@/components/candidates/ElectriciansNorwayPage");
    const el = html(await Electricians(), {});
    expect(el).not.toContain("NOK per hour");
    expect(el).not.toContain("Typical market rate (certified)");

    const { default: Welding } = await import("@/components/welding/WeldingSpecialistsPage");
    const we = html(await Welding(), {});
    expect(we).not.toContain("NOK per hour");
    expect(we).not.toContain("Timeline");
    expect(we).toContain("and project location.</p>");
    expect(we).toContain("Tell us your project requirements.</p>");

    const { default: Support } = await import("@/components/site/candidates/CandidateSupport");
    expect(html(await Support(), {})).toContain("Pick the subject and write to us.</p>");

    const { generateMetadata } = await import("@/app/contact/page");
    expect((await generateMetadata()).description).toBe("Har dere spørsmål, eller er dere klare til å finne arbeidskraft til bedriften? Kontakt ArbeidMatch.");

    const { MinSideContactCard } = await import("@/components/min-side/MinSideCityQuestion");
    expect(html(createElement(MinSideContactCard, { person: { name: "Test Person", phone: null, avatar_url: null } as never }), {})).not.toContain("Vi svarer");

    const { partnerContactedText } = await import("@/lib/emails/letters");
    expect(partnerContactedText({})).toBe("Thank you for your interest in becoming an ArbeidMatch partner. Our team will review your request and contact you.");

    const { default: HomeJsonLd } = await import("@/components/seo/HomeJsonLd");
    const ld = html(createElement(HomeJsonLd, { numbers: {} }), {});
    expect(ld).not.toContain("openingHoursSpecification");
    expect(ld).not.toContain("taxID");
  });
});
