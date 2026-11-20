import { describe, expect, it } from "vitest";
import { legalRequestPrefill } from "./legalRequestPrefill";
import { LEGAL_REQUEST_WORDS } from "./legalRequestWords";

describe("legal request prefill (ORDER 360)", () => {
  it("opens on Deletion with the name and e-mail", () => {
    expect(legalRequestPrefill({ kind: "deletion", name: " Test  Kandidat ", email: "test@example.invalid" })).toEqual({
      requestType: "GDPR Erasure (Art. 17)",
      fullName: "Test Kandidat",
      email: "test@example.invalid",
    });
  });
  it("maps to a request type the form has, in both languages", () => {
    const type = legalRequestPrefill({ kind: "deletion" }).requestType;
    expect(LEGAL_REQUEST_WORDS.en.requestTypes.map((t) => t.value)).toContain(type);
    expect(LEGAL_REQUEST_WORDS.no.requestTypes.map((t) => t.value)).toContain(type);
  });
  it("ignores an unknown kind and a broken e-mail", () => {
    expect(legalRequestPrefill({ kind: "drop-tables", email: "not an email" })).toEqual({ requestType: null, fullName: "", email: "" });
  });
});
