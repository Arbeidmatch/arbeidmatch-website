import { describe, expect, it } from "vitest";
import { isPlausibleEmail, isRecipientRefused } from "./visitorMail";

describe("isPlausibleEmail", () => {
  it.each(["a@b.no", "kari.nordmann+jobb@firma.example.com", " ola@firma.no "])("accepts %s", (v) => expect(isPlausibleEmail(v)).toBe(true));
  it.each(["", "a@", "@b.no", "a@b", "a b@c.no", "a@@b.no", "a@b..no", "a@b.c", "a,b@c.no", "x@y.no;z@w.no", "<a@b.no>"])("refuses %j", (v) => expect(isPlausibleEmail(v)).toBe(false));
});

describe("isRecipientRefused", () => {
  it("knows a refused recipient", () => {
    expect(isRecipientRefused({ responseCode: 550, command: "RCPT TO", response: "550 5.1.1 Invalid recipient" })).toBe(true);
    expect(isRecipientRefused({ code: "EENVELOPE" })).toBe(true);
    expect(isRecipientRefused({ response: "550 5.1.1 <x@y.invalid>: Recipient address rejected" })).toBe(true);
  });
  it("does not mistake a network or account fault for one", () => {
    expect(isRecipientRefused({ code: "ETIMEDOUT" })).toBe(false);
    expect(isRecipientRefused({ responseCode: 535, command: "AUTH PLAIN", response: "535 Authentication failed" })).toBe(false);
    expect(isRecipientRefused(new Error("boom"))).toBe(false);
    expect(isRecipientRefused(null)).toBe(false);
  });
});
