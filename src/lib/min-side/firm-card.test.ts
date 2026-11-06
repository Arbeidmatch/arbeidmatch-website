import { describe, expect, it } from "vitest";

import { firmCardFrom, hiringCardFrom } from "./profile";

/** ORDER 244: the firm card the ATS writes, drawn as given, links only of the firm's own kinds. */
describe("the firm card on Min side", () => {
  const firm = {
    sections: [
      { key: "oversikt", title: "Oversikt", source: "Brønnøysundregistrene, lest 06.11.2026", rows: [{ label: "Ansatte", value: "42" }, { label: "Konkurs", value: "Registrert konkurs", tone: "danger" }] },
      {
        key: "kontakt",
        title: "Kontakt",
        source: "Brønnøysundregistrene, lest 06.11.2026",
        rows: [
          { label: "Telefon", value: "73 00 00 00", href: "tel:73000000" },
          { label: "E-post", value: "post@firma.no", href: "mailto:post@firma.no" },
          { label: "Nettsted", value: "firma.no", href: "https://www.firma.no" },
          { label: "Lure", value: "x", href: "javascript:alert(1)" },
        ],
      },
      { key: "ansettelser", title: "Ansettelser", source: "Egne annonser fra 11.09.2026", rows: [{ label: "Annonser", value: "5 annonser" }], bars: [{ month: "nov 26", adverts: 2 }] },
      { key: "tom", title: "Tom", source: "x", rows: [] },
    ],
    footer: "Kilde: offentlige registre (Brønnøysundregistrene, Doffin) og offentlige stillingsannonser.",
  };

  it("keeps the sections with rows, their sources and the danger tone", () => {
    const card = firmCardFrom(firm)!;
    expect(card.sections.map((s) => s.key)).toEqual(["oversikt", "kontakt", "ansettelser"]);
    expect(card.sections[0].rows[1]).toEqual({ label: "Konkurs", value: "Registrert konkurs", tone: "danger", href: null });
    expect(card.sections[2].bars).toEqual([{ month: "nov 26", adverts: 2 }]);
    expect(card.footer).toContain("Brønnøysundregistrene");
  });

  it("drops a link that is not a phone, an e-mail or a website", () => {
    const hrefs = firmCardFrom(firm)!.sections[1].rows.map((r) => r.href);
    expect(hrefs).toEqual(["tel:73000000", "mailto:post@firma.no", "https://www.firma.no/", null]);
  });

  it("an answer without the card leaves it out", () => {
    expect(firmCardFrom(null)).toBeNull();
    expect(firmCardFrom({ sections: [] })).toBeNull();
    const row = { orgnr: "912345678", name: "Firma AS", trades: [], trade_names: [], positions: 1, status: "new" };
    const card = hiringCardFrom({ ...row, firm_no: firm });
    expect(card?.firm?.sections.length).toBe(3);
    expect(hiringCardFrom(row)?.firm).toBeNull();
  });
});
