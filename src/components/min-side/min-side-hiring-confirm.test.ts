import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MinSideHiring, { BetaNotice, type ProjectsTrial } from "@/components/min-side/MinSideHiring";
import { BillingFields, HiringBillingScreen } from "@/components/min-side/MinSideHiringBilling";
import { ConfirmFields, matchesLine, type Matches } from "@/components/min-side/MinSideHiringConfirm";
import {
  NO_BILLING,
  PLANS_CLOSED_LINE,
  confirmMatchesFrom,
  hiringBillingBody,
  hiringBillingReady,
  hiringBillingValues,
  hiringConfirmBody,
  hiringConfirmCountBody,
  hiringConfirmReady,
  hiringConfirmValues,
  hiringFrom,
  hiringPlansFrom,
  hiringRequest,
  isHiringAction,
  type Hiring,
  type HiringBilling,
  type HiringBillingValues,
  type HiringConfirm,
  type HiringConfirmValues,
} from "@/lib/min-side/profile";

/** ORDER 171 and 181: "Bekreft og start", the one screen before the hiring list, the beta notice, and billing at the first paid plan. */

const callAts = vi.fn();
vi.mock("@/lib/prosjekter/ats", () => ({ callAts: (...args: unknown[]) => callAts(...args), callAtsRaw: vi.fn() }));

const source = (file: string) => readFileSync(path.resolve(__dirname, file), "utf8");

const confirmRaw = (extra: Record<string, unknown> = {}) => ({
  person: { full_name: "Test Person", role: "Daglig leder", email: "test@eksempel.invalid" },
  // The ATS still sends the billing fields; the screen shows only the name and the number.
  company: { name: "Test AS", org_number: "912345678", address: "Testveien 1", postal_code: "7010", city: "Trondheim", delivery: null, invoice_email: "faktura@eksempel.invalid" },
  receive: { counties: ["NO050"], trades: [], frequency: "weekly", only_new: false, suggested: false },
  options: {
    counties: [
      { code: "NO050", name: "Trøndelag" },
      { code: "NO030", name: "Oslo" },
    ],
    trades: [
      { key: "electrician", name: "Elektriker" },
      { key: "carpenter", name: "Tømrer" },
    ],
  },
  matches: 12,
  beta: "Jeg forstår at tjenesten er i beta og kan endre seg",
  ...extra,
});

const terms = { accepted: false, ready: true, title: "Vilkår for Bedrifter som ansetter", paragraphs: ["Første avsnitt.", "Andre avsnitt."], version: "2", consent: "Jeg godtar" };

const rawHiring = (extra: Record<string, unknown> = {}) => ({
  subscription: { status: "active", counties: ["Trøndelag"], trades: ["Tømrer"], free_until: "2026-12-31", tier: "premium", frequency: "weekly" },
  terms,
  rows: [{ orgnr: "998877665", name: "Annen Bygg AS", status: "new" }],
  last_viewed_at: null,
  filters: { counties: [], trades: [] },
  projects: null,
  confirm: confirmRaw(),
  ...extra,
});

const hiring = (extra: Record<string, unknown> = {}) => hiringFrom(rawHiring(extra)) as Hiring;
const noTrial: ProjectsTrial = { start: () => {}, busy: false, error: null, dialog: null };
const props = (h: Hiring) => ({ token: "00000000-0000-4000-8000-0000000000a1", hiring: h, since: null, send: vi.fn(), sendData: vi.fn(), trial: noTrial, onAskPeople: () => {} });

const confirmOf = (extra: Record<string, unknown> = {}) => hiring({ confirm: confirmRaw(extra) }).confirm as HiringConfirm;
const valid = (c: HiringConfirm): HiringConfirmValues => ({ ...hiringConfirmValues(c), trades: ["electrician"], counties: ["NO050"], accept_terms: true, accept_beta: true });

const fields = (c: HiringConfirm, value: HiringConfirmValues, matches: Matches = 12, failed: { message: string; field: string | null } | null = null) =>
  renderToStaticMarkup(createElement(ConfirmFields, { confirm: c, terms, value, onChange: () => {}, busy: false, failed, matches }));
const submit = (html: string) => html.match(/<button type="submit"[^>]*>[^<]*<\/button>/)?.[0] ?? "";
const disabled = (html: string) => /<button type="submit"[^>]*disabled=""/.test(submit(html));
/** The controls of each block, as data-block id -> count. */
function controlsPerBlock(html: string): Record<string, number> {
  const out: Record<string, number> = {};
  const parts = html.split(/<section data-block="/).slice(1);
  for (const part of parts) {
    const id = part.slice(0, part.indexOf('"'));
    const body = part.slice(0, part.indexOf("</section>"));
    out[id] = (body.match(/data-control=""/g) ?? []).length;
  }
  return out;
}

describe("the confirm part of the ATS's answer", () => {
  it("is typed, and null once the terms are accepted or when absent", () => {
    const c = confirmOf();
    expect(c.person.full_name).toBe("Test Person");
    expect(c.company).toEqual({ name: "Test AS", org_number: "912345678" });
    expect(c.receive).toEqual({ counties: ["NO050"], trades: [], frequency: "weekly", only_new: false, suggested: false });
    expect(c.options.trades.map((t) => t.key)).toEqual(["electrician", "carpenter"]);
    expect(c.matches).toBe(12);
    expect(hiring({ terms: { ...terms, accepted: true } }).confirm).toBeNull();
    expect(hiring({ confirm: undefined }).confirm).toBeNull();
    expect(hiring({ confirm: "x" }).confirm).toBeNull();
    expect(hiring().beta_notice).toBeNull();
    expect(hiring({ beta_notice: "Tjenesten er i beta." }).beta_notice).toBe("Tjenesten er i beta.");
  });

  it("keeps as chosen only what is among the options, and falls back for a bad frequency", () => {
    const c = confirmOf({ receive: { counties: ["NO050", "NO999", "Oslo"], trades: ["electrician", "plumber", "<b>"], frequency: "hourly", only_new: "yes", suggested: true } });
    expect(c.receive).toEqual({ counties: ["NO050"], trades: ["electrician"], frequency: "weekly", only_new: false, suggested: true });
    // An ATS without receive or options gives an empty choice, not a broken screen.
    const bare = confirmOf({ receive: undefined, options: undefined, matches: undefined });
    expect(bare.receive.counties).toEqual([]);
    expect(bare.options).toEqual({ counties: [], trades: [] });
    expect(bare.matches).toBe(0);
  });

  it("starts with both boxes unticked and the prefill of what he receives", () => {
    const v = hiringConfirmValues(confirmOf({ receive: { counties: ["NO030"], trades: ["carpenter"], frequency: "daily", only_new: true, suggested: true } }));
    expect(v).toMatchObject({ accept_terms: false, accept_beta: false, full_name: "Test Person", counties: ["NO030"], trades: ["carpenter"], frequency: "daily", only_new: true });
  });
});

describe("Bekreft og start", () => {
  it("replaces the terms dialog for an invited client, with the three blocks and nothing of the list", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring())));
    expect(html).toContain("Bekreft og start");
    expect(html).toContain("Dine opplysninger");
    expect(html).toContain("Hva vil du motta");
    expect(html).toContain("Vilkår");
    expect(html).toContain("Første avsnitt.");
    expect(html).toContain("Versjon 2");
    expect(html).toContain("Jeg godtar vilkårene");
    expect(html).toContain("Jeg forstår at tjenesten er i beta og kan endre seg");
    expect(html).not.toContain("Les vilkår");
    expect(html).not.toContain("Annen Bygg AS");
  });

  it("asks no billing: no Firma og fakturering, no address, no E-post or EHF", () => {
    const html = fields(confirmOf(), valid(confirmOf()));
    for (const gone of ["Firma og fakturering", "Fakturaadresse", "Faktura sendes som", "EHF", "Faktura-e-post", "faktura@eksempel.invalid", "Testveien 1"]) expect(html).not.toContain(gone);
    // The firm's name and number stay, read-only, with his details.
    const person = html.slice(html.indexOf('data-block="person"'), html.indexOf('data-block="receive"'));
    expect(person).toContain("Test AS");
    expect(person).toContain("912 345 678");
    expect(source("MinSideHiringConfirm.tsx")).not.toMatch(/billing|delivery|invoice/);
  });

  it("puts Hva vil du motta before the terms, with exactly trades, counties, how often and only new", () => {
    const c = confirmOf();
    const html = fields(c, hiringConfirmValues(c));
    expect(Object.keys(controlsPerBlock(html))).toEqual(["person", "receive", "terms"]);
    expect(controlsPerBlock(html)).toEqual({ person: 3, receive: 4, terms: 2 });
    const receive = html.slice(html.indexOf('data-block="receive"'), html.indexOf('data-block="terms"'));
    for (const word of ["Fag", "Fylker", "Hvor ofte", "Elektriker", "Tømrer", "Trøndelag", "Oslo", "Daglig", "Ukentlig", "Månedlig", "Bare nye stillinger siden sist"]) expect(receive).toContain(word);
    // His rule P4: nothing else on this screen.
    for (const gone of ["Steder", "Bedriftsstørrelse", "Type signal", "Mottakere", "Språk", "Pause", "Klokkeslett"]) expect(html).not.toContain(gone);
    // The prefill is pressed.
    expect(receive).toMatch(/aria-pressed="true"[^>]*>Trøndelag</);
    expect(receive).toMatch(/aria-pressed="false"[^>]*>Oslo</);
    expect(receive).toMatch(/aria-pressed="true"[^>]*>Ukentlig</);
  });

  it("shows the live count, and asks for a county when none is chosen", () => {
    const c = confirmOf();
    expect(fields(c, hiringConfirmValues(c), 12)).toMatch(/data-matches=""[^>]*aria-live="polite"[^>]*>Treff nå: 12 bedrifter</);
    expect(fields(c, hiringConfirmValues(c), 1)).toContain("Treff nå: 1 bedrift<");
    expect(fields(c, { ...hiringConfirmValues(c), counties: [] }, 12)).toContain("Velg minst ett fylke for å se treff.");
    expect(matchesLine(["NO050"], null)).toBe("Treff nå: ...");
    expect(matchesLine([], 5)).toBe("Velg minst ett fylke for å se treff.");
    expect(confirmMatchesFrom({ matches: 7 })).toBe(7);
    expect(confirmMatchesFrom({ matches: "7" })).toBeNull();
    expect(hiringConfirmCountBody({ counties: ["NO050"], trades: ["electrician"] })).toEqual({ action: "hiring_confirm_count", counties: ["NO050"], trades: ["electrician"] });
  });

  it("asks the count debounced, as the trades or counties change", () => {
    const src = source("MinSideHiringConfirm.tsx");
    expect(src).toContain("export const COUNT_DELAY_MS = 300;");
    expect(src).toContain("window.setTimeout(");
    expect(src).toContain("window.clearTimeout(t)");
    expect(src).toContain("}, [counties, trades, sendData, confirm.matches]);");
    // An answer to an older choice is dropped.
    expect(src).toContain("if (id !== asked.current) return;");
  });

  it("keeps Godta og start disabled until a trade, a county and both boxes are there", () => {
    const c = confirmOf();
    // As it opens: a county from the register, no trade, no box ticked.
    expect(disabled(fields(c, hiringConfirmValues(c)))).toBe(true);
    expect(hiringConfirmReady({ ...valid(c), trades: [] })).toBe(false);
    expect(hiringConfirmReady({ ...valid(c), counties: [] })).toBe(false);
    expect(disabled(fields(c, { ...valid(c), trades: [] }))).toBe(true);
    expect(disabled(fields(c, { ...valid(c), counties: [] }))).toBe(true);
    // Only one box ticked.
    expect(disabled(fields(c, { ...valid(c), accept_beta: false }))).toBe(true);
    expect(disabled(fields(c, { ...valid(c), accept_terms: false }))).toBe(true);
    // A name too short, a work e-mail not of the form x@y.zz.
    expect(hiringConfirmReady({ ...valid(c), full_name: " A " })).toBe(false);
    expect(hiringConfirmReady({ ...valid(c), email: "test@eksempel" })).toBe(false);
    expect(hiringConfirmReady({ ...valid(c), email: "test@eksempel.n" })).toBe(false);
    // All valid.
    expect(disabled(fields(c, valid(c)))).toBe(false);
    expect(submit(fields(c, valid(c)))).toContain("Godta og start");
  });

  it("shows a refusal under its own field", () => {
    const c = confirmOf();
    const email = fields(c, valid(c), 12, { message: "Ugyldig e-post.", field: "email" });
    const at = email.indexOf("Ugyldig e-post.");
    expect(at).toBeGreaterThan(email.indexOf('id="ms-cf-email"'));
    expect(at).toBeLessThan(email.indexOf("Hva vil du motta"));
    const trades = fields(c, valid(c), 12, { message: "Velg minst ett fag.", field: "trades" });
    expect(trades.indexOf("Velg minst ett fag.")).toBeGreaterThan(trades.indexOf(">Fag<"));
    expect(trades.indexOf("Velg minst ett fag.")).toBeLessThan(trades.indexOf(">Fylker<"));
    const counties = fields(c, valid(c), 12, { message: "Velg minst ett fylke.", field: "counties" });
    expect(counties.indexOf("Velg minst ett fylke.")).toBeGreaterThan(counties.indexOf(">Fylker<"));
    expect(counties.indexOf("Velg minst ett fylke.")).toBeLessThan(counties.indexOf(">Hvor ofte<"));
    // A refusal with no field of its own sits above the button.
    const other = fields(c, valid(c), 12, { message: "Noe gikk galt.", field: null });
    expect(other.indexOf("Noe gikk galt.")).toBeLessThan(other.indexOf('type="submit"'));
    expect(other.indexOf("Noe gikk galt.")).toBeGreaterThan(other.indexOf("Jeg godtar vilkårene"));
  });

  it("sends the person, what he chose and the two boxes, and no billing", () => {
    const c = confirmOf();
    const body = hiringConfirmBody({ ...valid(c), frequency: "daily", only_new: true });
    expect(body).toEqual({
      action: "hiring_confirm",
      person: { full_name: "Test Person", role: "Daglig leder", email: "test@eksempel.invalid" },
      receive: { trades: ["electrician"], counties: ["NO050"], frequency: "daily", only_new: true },
      accept_terms: true,
      accept_beta: true,
    });
  });

  it("falls back to the old terms card when the ATS sends no confirm", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring({ confirm: null }))));
    expect(html).toContain("Les vilkår");
    expect(html).not.toContain("Bekreft og start");
  });
});

describe("the actions through the proxy", () => {
  const token = "00000000-0000-4000-8000-0000000000a1";
  const post = async (body: unknown) => {
    const { NextRequest } = await import("next/server");
    const { POST } = await import("@/app/api/min-side/[token]/route");
    const req = new NextRequest(`https://www.arbeidmatch.no/api/min-side/${token}`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.81" } });
    return POST(req, { params: Promise.resolve({ token }) });
  };
  beforeEach(() => {
    callAts.mockReset();
    callAts.mockResolvedValue({ status: 200, body: { ok: true, data: { matches: 3 } } });
  });

  it("are allowed and passed on with only their fields", () => {
    expect(isHiringAction("hiring_confirm")).toBe(true);
    expect(isHiringAction("hiring_beta_ack")).toBe(true);
    expect(isHiringAction("hiring_confirm_count")).toBe(true);
    expect(hiringRequest({ action: "hiring_beta_ack", extra: 1 })).toEqual({ action: "hiring_beta_ack" });
    const body = hiringConfirmBody(valid(confirmOf()));
    expect(hiringRequest({ ...body, extra: "x", billing: { delivery: "email" } })).toEqual(body);
    expect(hiringRequest({ action: "hiring_confirm_count", counties: ["NO050"], trades: [], extra: 1 })).toEqual({ action: "hiring_confirm_count", counties: ["NO050"], trades: [] });
    // No county is a valid question; the ATS answers 0.
    expect(hiringRequest({ action: "hiring_confirm_count" })).toEqual({ action: "hiring_confirm_count", counties: [], trades: [] });
  });

  it("passes an empty choice on, so the ATS's refusal lands at its field", () => {
    const body = hiringConfirmBody({ ...valid(confirmOf()), trades: [], counties: [] });
    expect(hiringRequest(body)).toEqual(body);
  });

  it("refuses a body that is not shaped like one", () => {
    const body = hiringConfirmBody(valid(confirmOf())) as Record<string, unknown> & { receive: Record<string, unknown>; person: Record<string, unknown> };
    expect(hiringRequest({ ...body, person: "x" })).toBeNull();
    expect(hiringRequest({ ...body, receive: undefined })).toBeNull();
    expect(hiringRequest({ ...body, receive: { ...body.receive, counties: ["Oslo"] } })).toBeNull();
    expect(hiringRequest({ ...body, receive: { ...body.receive, trades: ["<b>"] } })).toBeNull();
    expect(hiringRequest({ ...body, receive: { ...body.receive, trades: Array.from({ length: 21 }, () => "electrician") } })).toBeNull();
    expect(hiringRequest({ ...body, receive: { ...body.receive, frequency: "hourly" } })).toBeNull();
    expect(hiringRequest({ ...body, receive: { ...body.receive, only_new: "yes" } })).toBeNull();
    expect(hiringRequest({ ...body, person: { ...body.person, full_name: "x".repeat(121) } })).toBeNull();
    expect(hiringRequest({ ...body, accept_terms: "yes" })).toBeNull();
    expect(hiringRequest({ action: "hiring_confirm_count", counties: ["Oslo"] })).toBeNull();
    expect(hiringRequest({ action: "hiring_confirm_count", trades: "electrician" })).toBeNull();
  });

  it("passes the count and returns its number, in the settings' own rate-limit bucket", async () => {
    const res = await post({ action: "hiring_confirm_count", counties: ["NO050"], trades: ["electrician"] });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, data: { matches: 3 } });
    expect(callAts.mock.calls[0][1].body).toEqual({ action: "hiring_confirm_count", counties: ["NO050"], trades: ["electrician"] });
    expect(source("../../app/api/min-side/[token]/route.ts")).toContain('isHiringPrefsAction(action) || action === "hiring_confirm_count"');
  });
});

describe("the beta notice", () => {
  it("is shown above the list with OK once the terms are accepted", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring({ terms: { ...terms, accepted: true }, beta_notice: "Tjenesten er i beta." }))));
    expect(html).toContain("Tjenesten er i beta.");
    expect(html.indexOf("data-beta-notice")).toBeLessThan(html.indexOf("Annen Bygg AS"));
    expect(renderToStaticMarkup(createElement(MinSideHiring, props(hiring({ terms: { ...terms, accepted: true } }))))).not.toContain("data-beta-notice");
  });

  it("sends hiring_beta_ack from OK", () => {
    const html = renderToStaticMarkup(createElement(BetaNotice, { text: "Beta.", send: vi.fn(), onSeen: () => {} }));
    expect(html).toMatch(/<button type="button"[^>]*>OK<\/button>/);
  });
});

// ---------------------------------------------------------------------------
// ORDER 181: no plan before 1 January, and "Fakturering" when a paid plan starts.
// ---------------------------------------------------------------------------

const billingRaw = (extra: Record<string, unknown> = {}) => ({
  name: "Test AS",
  org_number: "912345678",
  address: "Testveien 1",
  postal_code: "7010",
  city: "Trondheim",
  billing_same_as_address: true,
  billing_address: "",
  billing_postal_code: "",
  billing_city: "",
  delivery: null,
  invoice_email: "faktura@eksempel.invalid",
  invoice_email_locked: false,
  ...extra,
});
const billingOf = (extra: Record<string, unknown> = {}) => hiringPlansFrom({ open: true, billing_needed: true, billing: billingRaw(extra) }).billing as HiringBilling;
const validBilling = (b: HiringBilling): HiringBillingValues => ({ ...hiringBillingValues(b), delivery: "email" });
const billingHtml = (b: HiringBilling, v: HiringBillingValues) => renderToStaticMarkup(createElement(BillingFields, { billing: b, value: v, onChange: () => {}, errorFor: () => null }));

const basis = (plans: unknown) =>
  hiring({ terms: { ...terms, accepted: true }, subscription: { ...rawHiring().subscription, tier: "basis" }, rows: [{ orgnr: "998877665", name: "Annen Bygg AS", status: "new" }], plans });

describe("the plans part of the ATS's answer", () => {
  it("reads as closed when absent or malformed", () => {
    expect(hiring().plans).toEqual({ open: false, opens_on: null, billing_needed: false, billing: null });
    expect(hiringPlansFrom("x").open).toBe(false);
    expect(hiringPlansFrom({ open: "yes" }).open).toBe(false);
    const p = hiringPlansFrom({ open: true, opens_on: "2027-01-01", billing_needed: true, billing: billingRaw({ delivery: "ehf", invoice_email_locked: true }) });
    expect(p).toMatchObject({ open: true, opens_on: "2027-01-01", billing_needed: true });
    expect(p.billing).toMatchObject({ name: "Test AS", org_number: "912345678", delivery: "ehf", invoice_email_locked: true });
  });
});

describe("Premium while the plans are closed", () => {
  it("shows no Premium button on the Basis card, one quiet line instead", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(basis({ open: false, opens_on: "2027-01-01", billing_needed: false, billing: null }))));
    expect(html).toContain("Prøveperioden er over");
    expect(html).toContain(PLANS_CLOSED_LINE);
    expect(html).not.toMatch(/<button[^>]*>Premium<\/button>/);
    expect(PLANS_CLOSED_LINE).toBe("Fra 1. januar velger dere abonnement.");
  });

  it("shows the Premium button once the plans are open", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(basis({ open: true, billing_needed: false }))));
    expect(html).toMatch(/<button type="button"[^>]*>Premium<\/button>/);
    expect(html).not.toContain(PLANS_CLOSED_LINE);
  });

  it("the lead dialog and the settings offer have no Premium button while closed", () => {
    const src = source("MinSideHiring.tsx");
    expect(src).toContain("{premium.open ? (");
    expect(src).toContain("{PLANS_CLOSED_LINE}");
    const settings = source("MinSideHiringSettings.tsx");
    expect(settings).toContain("if (!premium.open) {");
    // One Premium path for the section: the settings no longer send hiring_premium themselves.
    expect(settings).not.toContain('action: "hiring_premium"');
    expect(src.match(/action: "hiring_premium"/g)).toHaveLength(2);
  });

  it("does not ask the ATS while closed, and opens Fakturering when billing is needed", () => {
    const src = source("MinSideHiring.tsx");
    expect(src).toContain("if (!plans.open || busy || sent) return;");
    expect(src).toContain("if (plans.billing_needed) {");
    expect(src).toContain('else if (r.field === "billing") setBilling(true);');
    expect(src).toContain('send({ action: "hiring_premium", billing: hiringBillingBody(v) })');
  });
});

describe("Fakturering", () => {
  it("is the billing block of ORDER 171, moved, with the firm read-only", () => {
    const b = billingOf();
    const html = billingHtml(b, validBilling(b));
    expect(html).toContain("Fakturering");
    expect(html).toContain("Test AS");
    expect(html).toContain("912 345 678");
    expect(html).toContain("Samme som firmaadressen");
    expect(html).toContain("Testveien 1, 7010 Trondheim");
    expect(html).toContain('id="ms-bl-inv-email"');
    expect(controlsPerBlock(html).billing).toBeLessThanOrEqual(7);
    // Moved, not duplicated: the confirm screen has none of it.
    expect(source("MinSideHiringConfirm.tsx")).not.toContain("BillingFields");
  });

  it("prefills from what the ATS holds, and drops an EHF choice without a number", () => {
    expect(hiringBillingValues(billingOf({ delivery: "ehf" })).delivery).toBe("ehf");
    expect(hiringBillingValues(billingOf({ delivery: "ehf", org_number: null })).delivery).toBeNull();
    expect(hiringBillingValues(billingOf({ billing_same_as_address: false, billing_address: "Annen vei 2" }))).toMatchObject({ billing_same_as_address: false, billing_address: "Annen vei 2" });
  });

  it("is ready only with a delivery, a valid invoice e-mail for E-post and the other address in full", () => {
    const b = billingOf();
    expect(hiringBillingReady(hiringBillingValues(b), b)).toBe(false);
    expect(hiringBillingReady(validBilling(b), b)).toBe(true);
    expect(hiringBillingReady({ ...validBilling(b), invoice_email: "" }, b)).toBe(false);
    expect(hiringBillingReady({ ...validBilling(b), delivery: "ehf", invoice_email: "" }, b)).toBe(true);
    expect(hiringBillingReady({ ...validBilling(b), billing_same_as_address: false }, b)).toBe(false);
    expect(hiringBillingReady({ ...validBilling(b), billing_same_as_address: false, billing_address: "Annen vei 2", billing_postal_code: "0150" }, b)).toBe(true);
    const noOrg = billingOf({ org_number: "12345" });
    expect(hiringBillingReady({ ...validBilling(noOrg), delivery: "ehf" }, noOrg)).toBe(false);
    expect(billingHtml(noOrg, hiringBillingValues(noOrg))).toMatch(/<input type="radio"[^>]*disabled=""[^>]*value="ehf"/);
  });

  it("hides the invoice e-mail for EHF, and shows it read-only when locked", () => {
    const b = billingOf();
    const ehf = billingHtml(b, { ...validBilling(b), delivery: "ehf" });
    expect(ehf).not.toContain('id="ms-bl-inv-email"');
    expect(ehf).toContain("EHF-adresse: org.nr 912 345 678");
    const locked = billingOf({ invoice_email_locked: true });
    expect(billingHtml(locked, validBilling(locked))).toMatch(/<input id="ms-bl-inv-email"[^>]*readOnly=""|<input id="ms-bl-inv-email"[^>]*readonly=""/);
  });

  it("the screen keeps its button disabled until ready, with Avbryt beside it", () => {
    const html = renderToStaticMarkup(createElement(HiringBillingScreen, { billing: NO_BILLING, submit: vi.fn(), onCancel: () => {} }));
    expect(html).toMatch(/<button type="submit"[^>]*disabled=""[^>]*>Bekreft<\/button>/);
    expect(html).toContain(">Avbryt<");
  });

  it("sends the billing with hiring_premium through the proxy, and refuses a bad one", () => {
    const b = billingOf();
    const billing = hiringBillingBody({ ...validBilling(b), invoice_email: " faktura@eksempel.invalid " });
    expect(billing).toEqual({ delivery: "email", invoice_email: "faktura@eksempel.invalid", billing_same_as_address: true, billing_address: "", billing_postal_code: "", billing_city: "" });
    expect(hiringRequest({ action: "hiring_premium", billing: { ...billing, extra: 1 } })).toEqual({ action: "hiring_premium", billing });
    expect(hiringRequest({ action: "hiring_premium", extra: 1 })).toEqual({ action: "hiring_premium" });
    expect(hiringRequest({ action: "hiring_premium", billing: { ...billing, delivery: "post" } })).toBeNull();
    expect(hiringRequest({ action: "hiring_premium", billing: { ...billing, billing_same_as_address: "yes" } })).toBeNull();
    expect(hiringRequest({ action: "hiring_premium", billing: { ...billing, billing_address: "x".repeat(201) } })).toBeNull();
    expect(hiringRequest({ action: "hiring_premium", billing: "x" })).toBeNull();
  });
});

describe("the label on each row of the list", () => {
  it("shows the label as a tag when there is one, in the table and on the phone", () => {
    const h = hiring({
      terms: { ...terms, accepted: true },
      rows: [
        { orgnr: "998877665", name: "Annen Bygg AS", status: "new", label: "Nye stillinger: Elektrikere (1), Tømrere (2)" },
        { orgnr: "912345678", name: "Ny Bygg AS", status: "new", label: "Ny bedrift" },
        { orgnr: "912345679", name: "Uten Bygg AS", status: "new", label: null },
      ],
    });
    expect(h.rows.map((r) => r.label)).toEqual(["Nye stillinger: Elektrikere (1), Tømrere (2)", "Ny bedrift", null]);
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(h)));
    expect(html.match(/>Nye stillinger: Elektrikere \(1\), Tømrere \(2\)</g)).toHaveLength(2);
    expect(html.match(/>Ny bedrift</g)).toHaveLength(2);
    expect(html.match(/rounded-full border border-\[#E9D9A6\] bg-\[#FBF6E8\] px-2\.5/g)).toHaveLength(4);
  });
});
