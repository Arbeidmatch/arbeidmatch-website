import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ARBEIDSTILSYNET_MINSTELONN_URL, EQUAL_TREATMENT_TEXT } from "@/lib/pay-conditions";

import AnswerModeStep from "./AnswerModeStep";
import CodeStep from "./CodeStep";
import ContactStep, { contactProblem } from "./ContactStep";
import CountStep from "./CountStep";
import { COUNTIES, EMPTY_ANSWERS, firstOpenStep, isOutsideOurTrades, summaryLine, type RaskAnswers } from "./data";
import DoneStep from "./DoneStep";
import PayAndConditions from "./PayAndConditions";
import PayStep from "./PayStep";
import { buildRaskPayload } from "./payload";
import PlaceStep from "./PlaceStep";
import { shouldOpenRask } from "./RaskForesporselRoot";
import RoleStep from "./RoleStep";
import TradeStep from "./TradeStep";
import WhenStep from "./WhenStep";

/**
 * "Rask forespørsel" (ORDER 224): every step renders its question and its
 * tiles in Norwegian; step 7 cannot be passed without the equal-treatment
 * confirmation; an amount under the floor is refused with the floor and the
 * Arbeidstilsynet link on screen.
 */

const noop = () => {};
const props = (answers: Partial<RaskAnswers> = {}) => ({
  answers: { ...EMPTY_ANSWERS, ...answers },
  update: noop,
  onNext: noop,
  onBack: noop,
  titleId: "t",
});
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const primaryButton = (html: string, label: string) => {
  const m = new RegExp(`<button[^>]*>${label}</button>`).exec(html);
  if (!m) throw new Error(`no button ${label}`);
  return m[0];
};

const ROLLE: Partial<RaskAnswers> = {
  answerMode: "rolle",
  trade: "bygg",
  roles: ["Betongarbeider"],
  count: "3",
  when: "Så snart som mulig",
  county: "Trøndelag",
  town: "Trondheim",
};

describe("step 1, Hvordan vil dere ha svar?", () => {
  it("offers a candidate on the role, faster, and on the details, slower", () => {
    const t = text(renderToStaticMarkup(<AnswerModeStep value="" onChoose={noop} />));
    for (const w of ["Hvordan vil dere ha svar?", "Kandidat på rolle", "Raskere svar", "Kandidat på detaljer", "Tar lengre tid"]) expect(t).toContain(w);
  });
});

describe("step 2, Hvilket fagområde?", () => {
  it("shows the eight trades", () => {
    const t = text(renderToStaticMarkup(<TradeStep {...props()} />));
    for (const w of ["Bygg og anlegg", "Elektro og teknikk", "Industri", "Logistikk", "Helse", "Horeca", "Renhold", "Annet"]) expect(t).toContain(w);
    expect(primaryButton(renderToStaticMarkup(<TradeStep {...props()} />), "Neste")).toContain('aria-disabled="true"');
  });
});

describe("step 3, Hvilken rolle?", () => {
  it("lists the trade's roles as multi-select tiles plus Annen rolle", () => {
    const html = renderToStaticMarkup(<RoleStep {...props({ trade: "bygg", roles: ["Tømrer"] })} />);
    expect(text(html)).toContain("Tømrer");
    expect(text(html)).toContain("Annen rolle");
    expect(html).toContain('aria-pressed="true"');
  });

  it("offers only Annen rolle, with its field, for Annet, and marks it outside our trades", () => {
    const answers = { trade: "annet" as const, otherRoleChosen: true, otherRole: "Smed" };
    const html = renderToStaticMarkup(<RoleStep {...props(answers)} />);
    expect(html.match(/<button/g)?.length).toBe(3); // Annen rolle, Neste, Tilbake
    expect(html).toContain('id="rf-other-role"');
    expect(isOutsideOurTrades({ ...EMPTY_ANSWERS, ...answers })).toBe(true);
    expect(isOutsideOurTrades({ ...EMPTY_ANSWERS, ...ROLLE } as RaskAnswers)).toBe(false);
  });
});

describe("step 4, Hvor mange?", () => {
  it("offers 1, 2, 3, 5, 10 and Flere, which opens 15 to 50", () => {
    const closed = text(renderToStaticMarkup(<CountStep {...props()} />));
    expect(closed).toContain("Flere");
    expect(closed).not.toContain("50");
    const open = text(renderToStaticMarkup(<CountStep {...props({ showMoreCounts: true })} />));
    for (const n of ["15", "20", "30", "50"]) expect(open).toContain(n);
  });
});

describe("step 5, Når?", () => {
  it("offers the three starts and a date field from today", () => {
    const html = renderToStaticMarkup(<WhenStep {...props({ when: "Velg dato" })} />);
    for (const w of ["Når?", "Så snart som mulig", "Om 2 uker", "Neste måned", "Velg dato"]) expect(text(html)).toContain(w);
    expect(html).toMatch(/type="date"[^>]*min="\d{4}-\d{2}-\d{2}"/);
  });
});

describe("step 6, Hvor?", () => {
  it("shows the fifteen counties, then the towns of the chosen one", () => {
    expect(COUNTIES).toHaveLength(15);
    const counties = text(renderToStaticMarkup(<PlaceStep {...props()} />));
    for (const c of COUNTIES) expect(counties).toContain(c.name);
    const towns = text(renderToStaticMarkup(<PlaceStep {...props({ county: "Trøndelag" })} />));
    expect(towns).toContain("Hvor i Trøndelag?");
    expect(towns).toContain("Trondheim");
    expect(towns).toContain("Annet sted i fylket");
  });
});

describe("step 7, Lønn og vilkår", () => {
  it("cannot be passed without the equal-treatment confirmation", () => {
    const html = renderToStaticMarkup(<PayStep {...props({ ...ROLLE, payFrom: "260" })} floor={null} />);
    expect(text(html)).toContain(EQUAL_TREATMENT_TEXT);
    expect(text(html)).toContain("arbeidsmiljøloven § 14-12 a");
    expect(primaryButton(html, "Neste")).toContain('aria-disabled="true"');
    const confirmed = renderToStaticMarkup(<PayStep {...props({ ...ROLLE, payFrom: "260", equalTreatment: true })} floor={null} />);
    expect(primaryButton(confirmed, "Neste")).not.toContain('aria-disabled="true"');
  });

  it("refuses an amount under the floor, shows the floor and links to Arbeidstilsynet", () => {
    const html = renderToStaticMarkup(<PayStep {...props({ ...ROLLE, payFrom: "200", payFromTouched: true, equalTreatment: true })} floor={250} />);
    const t = text(html);
    expect(t).toContain("Under minstelønn (250 kr per time).");
    expect(t).toContain("Minstelønn for faget: 250 kr per time");
    expect(html).toContain(`href="${ARBEIDSTILSYNET_MINSTELONN_URL}"`);
    expect(html).toMatch(/target="_blank" rel="noopener noreferrer"[^>]*>Arbeidstilsynet: minstelønn</);
    expect(primaryButton(html, "Neste")).toContain('aria-disabled="true"');
  });

  it("shows only the link when no floor is known, and lists the benefits", () => {
    const html = renderToStaticMarkup(
      <PayAndConditions
        idPrefix="x"
        floor={null}
        equalTreatment={false}
        onEqualTreatment={noop}
        payFrom=""
        payTo=""
        onPayFrom={noop}
        onPayTo={noop}
        benefits={["Kost"]}
        onToggleBenefit={noop}
      />,
    );
    const t = text(html);
    expect(t).not.toContain("Minstelønn for faget");
    expect(t).toContain("Arbeidstilsynet: minstelønn");
    for (const b of ["Bolig uten trekk", "Bolig med trekk i lønn", "Transport til arbeidsstedet", "Kost", "Arbeidstøy og verneutstyr", "Verktøy", "Reise hjem betalt", "Ingen tillegg"]) {
      expect(t).toContain(b);
    }
  });

  it("shows the confirmation message after an attempt without it", () => {
    const html = renderToStaticMarkup(
      <PayAndConditions idPrefix="x" floor={null} equalTreatment={false} onEqualTreatment={noop} payFrom="" payTo="" onPayFrom={noop} onPayTo={noop} benefits={[]} onToggleBenefit={noop} showConfirmError />,
    );
    expect(text(html)).toContain("Bekreft likebehandling for å gå videre.");
  });
});

describe("step 8, Hvem svarer vi?", () => {
  it("asks the company through the register and the e-mail, shows the request in one line, and says a code follows", () => {
    const html = renderToStaticMarkup(
      <ContactStep {...props({ ...ROLLE, payFrom: "260", payTo: "300", equalTreatment: true })} onSend={noop} busy={false} error={null} />,
    );
    const t = text(html);
    expect(html).toContain('id="rf-company"');
    expect(html).toContain('id="rf-email"');
    expect(t).toContain("3 personer: betongarbeider, Trondheim, Trøndelag, så snart som mulig, 260-300 kr/t");
    expect(t).toContain("Vi sender en kode til e-posten for å bekrefte den.");
    expect(t).toContain("Fant ikke firmaet?");
    expect(primaryButton(html, "Send")).toContain('aria-disabled="true"');
  });

  it("names what is missing before Send", () => {
    const company = { name: "Test Bygg AS", orgNumber: "999999999" };
    expect(contactProblem({ ...EMPTY_ANSWERS })).toContain("Brønnøysundregistrene");
    expect(contactProblem({ ...EMPTY_ANSWERS, company, email: "a@b.invalid", privacyAccepted: true, termsAccepted: true })).toBeNull();
  });

  it("shows the code entry and Mottatt with one outline button", () => {
    expect(text(renderToStaticMarkup(<CodeStep email="a@b.invalid" titleId="t" busy={false} error={null} notice={null} onVerify={noop} onResend={noop} onBack={noop} />))).toContain("a@b.invalid");
    const done = renderToStaticMarkup(<DoneStep titleId="t" reference="AM-ER-2026-00042" onClose={noop} />);
    expect(text(done)).toContain("Mottatt");
    expect(done.match(/<button/g)?.length).toBe(1);
    expect(text(done)).toContain("Lukk");
  });
});

describe("the request the popup sends", () => {
  it("carries the rask keys, Til as Fra when left empty, and nothing unasked", () => {
    const answers = { ...EMPTY_ANSWERS, ...ROLLE, payFrom: "260", equalTreatment: true, benefits: ["Kost" as const], company: { name: "Test Bygg AS", orgNumber: "999999999" }, email: "Post@Test.invalid" };
    const p = buildRaskPayload(answers, "11111111-2222-4333-8444-555555555555", 250);
    expect(p).toMatchObject({
      sourceVariant: "rask",
      answerMode: "rolle",
      category: "Construction",
      position: "Betongarbeider",
      numberOfPositions: "3",
      city: "Trondheim, Trøndelag",
      payFrom: 260,
      payTo: 260,
      payFloorAtSubmit: 250,
      equalTreatmentConfirmed: true,
      benefits: ["Kost"],
      outsideOurTrades: false,
      email: "post@test.invalid",
    });
    expect(p).not.toHaveProperty("full_name");
    expect(p).not.toHaveProperty("phone");
    expect(summaryLine(answers)).toContain("260 kr/t");
  });

  it("never opens further than the first unanswered step", () => {
    expect(firstOpenStep({ ...EMPTY_ANSWERS })).toBe(1);
    expect(firstOpenStep({ ...EMPTY_ANSWERS, answerMode: "rolle", trade: "bygg" })).toBe(3);
    expect(firstOpenStep({ ...EMPTY_ANSWERS, ...ROLLE } as RaskAnswers)).toBe(7);
  });
});

describe("the links that open the popup", () => {
  const link = (attrs: Record<string, string> = {}) => ({
    closest: vi.fn((sel: string) => (sel === "a[data-rask-foresporsel]" ? { getAttribute: (k: string) => attrs[k] ?? null } : null)),
  });
  const click = (over: Partial<MouseEvent> = {}, target: unknown = link()) =>
    ({ defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, target, ...over }) as unknown as MouseEvent;

  it("takes a plain click on a marked link", () => {
    expect(shouldOpenRask(click())).not.toBeNull();
  });

  it("leaves a modifier click, another button, a new tab or an unmarked link to the browser", () => {
    expect(shouldOpenRask(click({ ctrlKey: true }))).toBeNull();
    expect(shouldOpenRask(click({ metaKey: true }))).toBeNull();
    expect(shouldOpenRask(click({ button: 1 }))).toBeNull();
    expect(shouldOpenRask(click({}, link({ target: "_blank" })))).toBeNull();
    expect(shouldOpenRask(click({}, { closest: () => null }))).toBeNull();
  });
});
