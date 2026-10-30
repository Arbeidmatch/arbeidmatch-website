import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import MinSideHiring, { BetaNotice, type ProjectsTrial } from "@/components/min-side/MinSideHiring";
import { ConfirmFields } from "@/components/min-side/MinSideHiringConfirm";
import { hiringConfirmBody, hiringConfirmReady, hiringConfirmValues, hiringFrom, hiringRequest, isHiringAction, type Hiring, type HiringConfirm, type HiringConfirmValues } from "@/lib/min-side/profile";

/** ORDER 171: "Bekreft og start", the one screen before the hiring list, and the beta notice. */

const confirmRaw = (company: Record<string, unknown> = {}) => ({
  person: { full_name: "Test Person", role: "Daglig leder", email: "test@eksempel.invalid" },
  company: {
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
    ...company,
  },
  beta: "Jeg forstår at tjenesten er i beta og kan endre seg",
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

const confirmOf = (company: Record<string, unknown> = {}) => hiring({ confirm: confirmRaw(company) }).confirm as HiringConfirm;
const valid = (c: HiringConfirm): HiringConfirmValues => ({ ...hiringConfirmValues(c), delivery: "email", accept_terms: true, accept_beta: true });

const fields = (c: HiringConfirm, value: HiringConfirmValues) => renderToStaticMarkup(createElement(ConfirmFields, { confirm: c, terms, value, onChange: () => {}, busy: false, failed: null }));
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
    expect(c.company).toMatchObject({ name: "Test AS", org_number: "912345678", delivery: null, billing_same_as_address: true });
    expect(hiring({ terms: { ...terms, accepted: true } }).confirm).toBeNull();
    expect(hiring({ confirm: undefined }).confirm).toBeNull();
    expect(hiring({ confirm: "x" }).confirm).toBeNull();
    expect(hiring().beta_notice).toBeNull();
    expect(hiring({ beta_notice: "Tjenesten er i beta." }).beta_notice).toBe("Tjenesten er i beta.");
  });

  it("starts with both boxes unticked and the delivery the ATS holds", () => {
    expect(hiringConfirmValues(confirmOf())).toMatchObject({ delivery: null, accept_terms: false, accept_beta: false, full_name: "Test Person" });
    expect(hiringConfirmValues(confirmOf({ delivery: "ehf" })).delivery).toBe("ehf");
    // EHF on file without a 9-digit number is not kept as a choice.
    expect(hiringConfirmValues(confirmOf({ delivery: "ehf", org_number: null })).delivery).toBeNull();
  });
});

describe("Bekreft og start", () => {
  it("replaces the terms dialog for an invited client, with the three blocks and nothing of the list", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring())));
    expect(html).toContain("Bekreft og start");
    expect(html).toContain("Dine opplysninger");
    expect(html).toContain("Firma og fakturering");
    expect(html).toContain("Vilkår");
    expect(html).toContain("Første avsnitt.");
    expect(html).toContain("Versjon 2");
    expect(html).toContain("Jeg godtar vilkårene");
    expect(html).toContain("Jeg forstår at tjenesten er i beta og kan endre seg");
    expect(html).not.toContain("Les vilkår");
    expect(html).not.toContain("Annen Bygg AS");
  });

  it("falls back to the old terms card when the ATS sends no confirm", () => {
    const html = renderToStaticMarkup(createElement(MinSideHiring, props(hiring({ confirm: null }))));
    expect(html).toContain("Les vilkår");
    expect(html).not.toContain("Bekreft og start");
  });

  it("has at most seven controls in each block", () => {
    const c = confirmOf();
    for (const v of [hiringConfirmValues(c), { ...valid(c), billing_same_as_address: false }, { ...valid(c), delivery: "ehf" as const }]) {
      const counts = controlsPerBlock(fields(c, v));
      expect(Object.keys(counts)).toEqual(["person", "company", "terms"]);
      for (const n of Object.values(counts)) expect(n).toBeLessThanOrEqual(7);
    }
    expect(controlsPerBlock(fields(c, { ...valid(c), billing_same_as_address: false }))).toEqual({ person: 3, company: 6, terms: 2 });
  });

  it("keeps Godta og start disabled until everything is valid", () => {
    const c = confirmOf();
    // As it opens: no delivery chosen, no box ticked.
    expect(disabled(fields(c, hiringConfirmValues(c)))).toBe(true);
    expect(hiringConfirmReady({ ...valid(c), delivery: null }, c)).toBe(false);
    expect(disabled(fields(c, { ...valid(c), delivery: null }))).toBe(true);
    // Only one box ticked.
    expect(disabled(fields(c, { ...valid(c), accept_beta: false }))).toBe(true);
    expect(disabled(fields(c, { ...valid(c), accept_terms: false }))).toBe(true);
    // A name too short, a work e-mail not of the form x@y.zz, an invoice e-mail missing.
    expect(hiringConfirmReady({ ...valid(c), full_name: " A " }, c)).toBe(false);
    expect(hiringConfirmReady({ ...valid(c), email: "test@eksempel" }, c)).toBe(false);
    expect(hiringConfirmReady({ ...valid(c), email: "test@eksempel.n" }, c)).toBe(false);
    expect(hiringConfirmReady({ ...valid(c), invoice_email: "" }, c)).toBe(false);
    // EHF needs no invoice e-mail.
    expect(hiringConfirmReady({ ...valid(c), delivery: "ehf", invoice_email: "" }, c)).toBe(true);
    // Another address needs the address and the postnummer.
    expect(hiringConfirmReady({ ...valid(c), billing_same_as_address: false }, c)).toBe(false);
    expect(hiringConfirmReady({ ...valid(c), billing_same_as_address: false, billing_address: "Annen vei 2" }, c)).toBe(false);
    expect(hiringConfirmReady({ ...valid(c), billing_same_as_address: false, billing_address: "Annen vei 2", billing_postal_code: "0150" }, c)).toBe(true);
    // All valid.
    expect(disabled(fields(c, valid(c)))).toBe(false);
    expect(submit(fields(c, valid(c)))).toContain("Godta og start");
  });

  it("hides the invoice e-mail field for EHF and shows the org. number as its address", () => {
    const c = confirmOf();
    const email = fields(c, valid(c));
    expect(email).toContain('id="ms-cf-inv-email"');
    const ehf = fields(c, { ...valid(c), delivery: "ehf" });
    expect(ehf).not.toContain('id="ms-cf-inv-email"');
    expect(ehf).not.toContain("Faktura-e-post");
    expect(ehf).toContain("EHF-adresse: org.nr 912 345 678");
  });

  it("disables EHF without a 9-digit org. number, and never lets it be chosen", () => {
    const c = confirmOf({ org_number: "12345" });
    const html = fields(c, hiringConfirmValues(c));
    expect(html).toMatch(/<input type="radio"[^>]*disabled=""[^>]*value="ehf"/);
    expect(html).toContain("EHF krever et gyldig org.nr.");
    expect(hiringConfirmReady({ ...valid(c), delivery: "ehf" }, c)).toBe(false);
  });

  it("shows the invoice e-mail read-only when it is locked", () => {
    const c = confirmOf({ invoice_email_locked: true });
    expect(fields(c, valid(c))).toMatch(/<input id="ms-cf-inv-email"[^>]*readOnly=""|<input id="ms-cf-inv-email"[^>]*readonly=""/);
  });

  it("shows the firm address read-only for Samme som firmaadressen, and the fields for En annen adresse", () => {
    const c = confirmOf();
    const same = fields(c, valid(c));
    expect(same).toContain("Testveien 1, 7010 Trondheim");
    expect(same).not.toContain('id="ms-cf-b-address"');
    const other = fields(c, { ...valid(c), billing_same_as_address: false });
    expect(other).toContain('id="ms-cf-b-address"');
    expect(other).toContain('id="ms-cf-b-postal"');
  });

  it("shows a refusal under its own field", () => {
    const c = confirmOf();
    const html = renderToStaticMarkup(createElement(ConfirmFields, { confirm: c, terms, value: valid(c), onChange: () => {}, busy: false, failed: { message: "Ugyldig e-post.", field: "email" } }));
    const at = html.indexOf("Ugyldig e-post.");
    expect(at).toBeGreaterThan(html.indexOf('id="ms-cf-email"'));
    expect(at).toBeLessThan(html.indexOf("Firma og fakturering"));
  });
});

describe("the two new actions through the proxy", () => {
  it("are allowed and passed on with only their fields", () => {
    expect(isHiringAction("hiring_confirm")).toBe(true);
    expect(isHiringAction("hiring_beta_ack")).toBe(true);
    expect(hiringRequest({ action: "hiring_beta_ack", extra: 1 })).toEqual({ action: "hiring_beta_ack" });
    const c = confirmOf();
    const body = hiringConfirmBody(valid(c));
    expect(hiringRequest({ ...body, extra: "x" })).toEqual(body);
    expect(body).toMatchObject({ action: "hiring_confirm", accept_terms: true, accept_beta: true, billing: { delivery: "email", billing_same_as_address: true } });
  });

  it("refuses a body that is not shaped like one", () => {
    const body = hiringConfirmBody(valid(confirmOf()));
    expect(hiringRequest({ ...body, person: "x" })).toBeNull();
    expect(hiringRequest({ ...body, billing: { ...(body.billing as object), delivery: "post" } })).toBeNull();
    expect(hiringRequest({ ...body, person: { ...(body.person as object), full_name: "x".repeat(121) } })).toBeNull();
    expect(hiringRequest({ ...body, accept_terms: "yes" })).toBeNull();
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
