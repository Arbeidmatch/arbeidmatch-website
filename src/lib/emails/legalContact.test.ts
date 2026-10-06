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
    expect(html).not.toContain("legal@arbeidmatch.no");
    // R106d: post@ is named in the privacy note as the controller's contact; the foot is the support link.
    const foot = html.slice(html.indexOf("border-left:2px solid #C9A84C;padding:14px 16px"));
    expect(html.slice(0, html.length - foot.length)).toContain(
      "the data controller ArbeidMatch Norge AS is reached at post@arbeidmatch.no",
    );
    expect(foot).not.toContain("post@arbeidmatch.no");
    expect(foot).toContain("https://arbeidmatch.no/contact?support=1");
  });
});
