import { describe, expect, it } from "vitest";
import { authenticatedFrom } from "./createSmtpTransporter";

describe("authenticatedFrom (D3)", () => {
  it("keeps the name and uses the account that signs in", () => {
    expect(authenticatedFrom('"ArbeidMatch Norge AS" <no-reply@arbeidmatch.no>', "post@arbeidmatch.no")).toBe('"ArbeidMatch Norge AS" <post@arbeidmatch.no>');
  });
  it("leaves an address that already agrees, and anything when no account is set", () => {
    expect(authenticatedFrom("Post <post@arbeidmatch.no>", "POST@arbeidmatch.no")).toBe("Post <post@arbeidmatch.no>");
    expect(authenticatedFrom("no-reply@arbeidmatch.no", "")).toBe("no-reply@arbeidmatch.no");
  });
});
