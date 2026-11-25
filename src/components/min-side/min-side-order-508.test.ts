import { describe, expect, it } from "vitest";

import { isSignoffAction, signoffFrom, signoffRequest } from "@/lib/min-side/signoff";

const billing = {
  name: "TEST Firma AS",
  org_number: "999999999",
  address: "Testveien 1",
  postal_code: "0001",
  city: "Oslo",
  billing_same_as_address: true,
  billing_address: "",
  billing_postal_code: "",
  billing_city: "",
  delivery: null,
  invoice_email: "",
  invoice_email_locked: false,
};
const snapshot = {
  monthly: 490,
  period: 4900,
  priceLines: [{ label: "Per måned", value: "490 kr" }],
  priceSummary: "490 kr per måned eks. mva.",
  coverage: "Trøndelag",
  domains: "Alle fag",
  frequency: "Hver uke",
  terms: ["Hva dere får: ...", "Pris: 490 kr per måned eks. mva."],
  termsTitle: "Vilkår for prosjektvarsler",
  hash: "a".repeat(64),
};

describe("ORDER 508: Min side reads the signoff block", () => {
  it("the user's card with the register's signer", () => {
    const v = signoffFrom({ kind: "card", free_until: "2027-01-07", ended: false, title: "Prøveperioden slutter 7. januar 2027. Hvem signerer for firmaet?", suggestion: { name: "Test Leder", role: "Daglig leder", email: "leder@test.invalid" } });
    expect(v).toMatchObject({ kind: "card", suggestion: { name: "Test Leder" } });
  });

  it("the waiting line once the trial ended", () => {
    const v = signoffFrom({ kind: "user", status: "invited", signer_name: "Test Leder", ended: true, waiting: "Venter på signatur fra daglig leder", can_remind: true, note: "" });
    expect(v).toMatchObject({ kind: "user", waiting: "Venter på signatur fra daglig leder", can_remind: true });
  });

  it("the signer's screen needs its snapshot and billing, and takes only an https signing link", () => {
    expect(signoffFrom({ kind: "signer", step: "terms", snapshot, joint_names: [], sign_url: null, billing })).toMatchObject({ kind: "signer", step: "terms" });
    expect(signoffFrom({ kind: "signer", step: "terms", snapshot: null, billing })).toBeNull();
    const v = signoffFrom({ kind: "signer", step: "signing", snapshot, joint_names: [], sign_url: "javascript:alert(1)", billing });
    expect(v && v.kind === "signer" ? v.sign_url : "x").toBeNull();
  });

  it("anything unknown reads as nothing", () => {
    expect(signoffFrom(null)).toBeNull();
    expect(signoffFrom({ kind: "other" })).toBeNull();
  });
});

describe("ORDER 508: only the signoff's own fields go to the ATS", () => {
  it("names the signer by one press or by name and e-mail", () => {
    expect(signoffRequest({ action: "signoff_name", confirm: true, extra: 1 })).toEqual({ action: "signoff_name", confirm: true });
    expect(signoffRequest({ action: "signoff_name", name: "Test Leder", email: "leder@test.invalid" })).toEqual({ action: "signoff_name", name: "Test Leder", email: "leder@test.invalid" });
    expect(signoffRequest({ action: "signoff_name", name: "Test Leder" })).toBeNull();
  });

  it("the acceptance carries the hash of the terms and price shown", () => {
    expect(signoffRequest({ action: "signoff_accept", accept: true, hash: snapshot.hash })).toEqual({ action: "signoff_accept", accept: true, hash: snapshot.hash });
    expect(signoffRequest({ action: "signoff_accept", accept: true })).toBeNull();
    expect(signoffRequest({ action: "signoff_accept", accept: false, hash: snapshot.hash })).toBeNull();
  });

  it("the invoice details pass with their six fields only", () => {
    const body = signoffRequest({ action: "signoff_billing", billing: { delivery: "email", invoice_email: "faktura@test.invalid", billing_same_as_address: true, secret: "x" } });
    expect(body).toEqual({ action: "signoff_billing", billing: { delivery: "email", invoice_email: "faktura@test.invalid", billing_same_as_address: true, billing_address: "", billing_postal_code: "", billing_city: "" } });
  });

  it("knows its actions", () => {
    expect(isSignoffAction("signoff_sign")).toBe(true);
    expect(isSignoffAction("signoff_delete")).toBe(false);
  });
});
