import { describe, expect, it } from "vitest";

import { cleanVatNumber, isFreeMail, judgeForeignCompany, phoneInEea } from "./foreignCompany";

describe("who may write as a company from another EU/EEA country (ORDER 44)", () => {
  it("reads the phone's country by its international prefix; UK and Switzerland are outside", () => {
    expect(phoneInEea("+49 30 1234567")).toBe(true);
    expect(phoneInEea("0048 600 123 456")).toBe(true);
    expect(phoneInEea("+47 400 00 000")).toBe(true);
    expect(phoneInEea("+44 20 7946 0958")).toBe(false);
    expect(phoneInEea("+41 44 123 45 67")).toBe(false);
    expect(phoneInEea("+1 212 555 0100")).toBe(false);
    expect(phoneInEea("600 123 456")).toBeNull();
  });

  it("refuses free mail services, keeps company domains", () => {
    expect(isFreeMail("ola@gmail.com")).toBe(true);
    expect(isFreeMail("ola@outlook.de")).toBe(true);
    expect(isFreeMail("ola@bygg-gmbh.de")).toBe(false);
  });

  it("cleans the VAT number for VIES, Greece as EL", () => {
    expect(cleanVatNumber("DE", "de 123.456.789")).toBe("123456789");
    const greek = judgeForeignCompany({ country: "GR", email: "a@firm.gr", phone: "+30 21 0000 0000", vatNumber: "EL094014298" });
    expect(greek).toEqual({ ok: true, viesCountry: "EL", vat: "094014298" });
  });

  it("decides before the network, in order: country, phone, mail", () => {
    expect(judgeForeignCompany({ country: "GB", email: "a@firm.co.uk", phone: "+44 20 0000 0000", vatNumber: "GB1" })).toEqual({ ok: false, reason: "unknown_country" });
    expect(judgeForeignCompany({ country: "DE", email: "a@firm.de", phone: "+1 212 555 0100", vatNumber: "DE1" })).toEqual({ ok: false, reason: "outside_eea" });
    expect(judgeForeignCompany({ country: "DE", email: "a@gmail.com", phone: "+49 30 1234567", vatNumber: "DE1" })).toEqual({ ok: false, reason: "free_mail" });
  });
});
