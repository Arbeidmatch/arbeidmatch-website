import { describe, expect, it } from "vitest";

import { legalRequestReceiptLetter } from "./letters";

/** Legal review, 25 September 2026: post@ is the contact for privacy and terms matters. */
describe("privacy contact address", () => {
  it("the receipt for a data request points the reader to post@, not legal@", () => {
    const { html } = legalRequestReceiptLetter({
      fullName: "Test Person",
      requestType: "access",
      reference: "LR-TEST",
      timestamp: "2026-09-25T10:00:00Z",
      to: "someone@example.invalid",
      unsubscribeUrl: "https://www.arbeidmatch.no/unsubscribe?t=x",
    });
    expect(html).toContain("post@arbeidmatch.no");
    expect(html).not.toContain("legal@arbeidmatch.no");
  });
});
