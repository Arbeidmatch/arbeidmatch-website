import { describe, expect, it } from "vitest";
import { buildArbeidmatchLetter } from "./arbeidmatchEmailShell";
import { positionNb } from "./request-position-nb";

/** The client's receipt of a request, as his test of 24 September 2026 corrected it. */
describe("the receipt a client gets for a request", () => {
  const html = buildArbeidmatchLetter({
    title: "Forespørselen er mottatt",
    innerHtml: "<p>Takk.</p>",
    lang: "no",
    recipient: "client@example.invalid",
    contactPerson: { name: "Mirel Manoliu", phone: "+47 967 34 730", email: "mirel@arbeidmatch.no" },
    serviceLetter: true,
  });

  it("names a person to answer to, not the office", () => {
    expect(html).toContain("Mirel Manoliu");
    expect(html).toContain("mirel@arbeidmatch.no");
    expect(html).not.toContain(">Kontoret<");
  });

  it("carries no unsubscribe link, since it is a service letter", () => {
    expect(html).not.toContain("Meld av");
    expect(html).toContain("Du får denne e-posten fordi du er i kontakt med ArbeidMatch.");
  });

  it("keeps the unsubscribe link on letters that are not service letters", () => {
    const other = buildArbeidmatchLetter({ title: "x", innerHtml: "<p>x</p>", lang: "no", unsubscribeUrl: "https://example.invalid/u" });
    expect(other).toContain("Meld av");
    expect(other).toContain(">Kontoret<");
  });

  it("says the position in Norwegian, and leaves a typed one as typed", () => {
    expect(positionNb("Carpenter")).toBe("Tømrer");
    expect(positionNb("tile layer")).toBe("Flislegger");
    expect(positionNb("Steinlegger")).toBe("Steinlegger");
  });
});
