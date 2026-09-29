import { describe, expect, it } from "vitest";

import { DIALOG_META, dialogForLink, dialogFromHash, hashFor, PORTAL_DIALOGS } from "@/lib/prosjekter/dialogs";
import { portalHeader } from "@/lib/prosjekter/portalNav";
import { STAFFING_AREA_NO } from "@/lib/prosjekter/staffingArea";

const ORIGIN = "https://www.arbeidmatch.no";

describe("which hash opens which dialog", () => {
  it("knows the two forms, with or without the #", () => {
    expect(dialogFromHash("#tilgang")).toBe("tilgang");
    expect(dialogFromHash("tilgang")).toBe("tilgang");
    expect(dialogFromHash("#logg-inn")).toBe("logg-inn");
    expect(dialogFromHash("#LOGG-INN")).toBe("logg-inn");
  });

  it("opens nothing for any other hash", () => {
    for (const h of ["", "#", "#top", "#tilgang-h", "#logg", null, undefined]) expect(dialogFromHash(h)).toBeNull();
  });

  it("round-trips through hashFor", () => {
    for (const d of PORTAL_DIALOGS) expect(dialogFromHash(hashFor(d))).toBe(d);
  });

  it("gives every dialog a title and a width", () => {
    expect(DIALOG_META.tilgang).toEqual({ title: "Be om tilgang", size: "wide" });
    expect(DIALOG_META["logg-inn"]).toEqual({ title: "Logg inn", size: "narrow" });
  });
});

describe("a clicked link opens a dialog in place", () => {
  it("when it is a bare hash, on any page", () => {
    expect(dialogForLink("#tilgang", "/for-employers", ORIGIN)).toBe("tilgang");
    expect(dialogForLink("#logg-inn", "/prosjekt/abc", ORIGIN)).toBe("logg-inn");
    expect(dialogForLink("#tilgang", "/", ORIGIN)).toBe("tilgang");
  });

  it("when it names this very page", () => {
    expect(dialogForLink("/prosjekter#tilgang", "/prosjekter", ORIGIN)).toBe("tilgang");
    expect(dialogForLink("/prosjekter/#logg-inn", "/prosjekter", ORIGIN)).toBe("logg-inn");
    expect(dialogForLink(`${ORIGIN}/prosjekter#tilgang`, "/prosjekter", ORIGIN)).toBe("tilgang");
  });

  it("not when it leads to another page: that one opens the dialog on arrival", () => {
    expect(dialogForLink("/prosjekter#tilgang", "/for-employers", ORIGIN)).toBeNull();
  });

  it("not for another site, another hash or no hash", () => {
    expect(dialogForLink("https://evil.example/prosjekter#tilgang", "/prosjekter", ORIGIN)).toBeNull();
    expect(dialogForLink("#tilgang-h", "/prosjekter", ORIGIN)).toBeNull();
    expect(dialogForLink("/prosjekter", "/prosjekter", ORIGIN)).toBeNull();
    expect(dialogForLink(null, "/prosjekter", ORIGIN)).toBeNull();
    expect(dialogForLink("mailto:post@example.no#tilgang", "/prosjekter", ORIGIN)).toBeNull();
  });

  it("from the portal header's links", () => {
    const h = portalHeader("/prosjekter");
    expect(h && dialogForLink(h.quiet.href, "/prosjekter", ORIGIN)).toBe("logg-inn");
    expect(h && dialogForLink(h.gold.href, "/prosjekter", ORIGIN)).toBe("tilgang");
    const own = portalHeader("/prosjekter/1f0e9c7a-0000-4000-8000-000000000000");
    expect(own && dialogForLink(own.quiet.href, "/prosjekter/1f0e9c7a-0000-4000-8000-000000000000", ORIGIN)).toBeNull();
  });
});

describe("where we staff", () => {
  it("is all of Norway for recruitment, Trondheim today for staffing", () => {
    expect(STAFFING_AREA_NO).toContain("Rekruttering og sourcing gjør vi i hele Norge.");
    expect(STAFFING_AREA_NO).toContain("Bemanning (innleie) har vi i dag i Trondheim-regionen");
    expect(STAFFING_AREA_NO).toContain("seriøse prosjekter");
  });
});
