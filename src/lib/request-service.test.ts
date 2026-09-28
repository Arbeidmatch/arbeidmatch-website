import { describe, expect, it } from "vitest";

import {
  contractTypeForService,
  presentationRequesterKind,
  STAFFING_CONTRACT_TYPE,
  isServiceAllowedFor,
  keepServiceIfAllowed,
  readCarriedServiceChoice,
  REQUEST_SERVICE_CARDS_NB,
  serviceCardsFor,
  withServiceChoice,
} from "./request-service";

describe("known company type from a presentation", () => {
  it("skips reclassification for either presentation audience, including older tickets", () => {
    for (const kind of ["agency", "own_operation"] as const) {
      expect(presentationRequesterKind(new URLSearchParams({ kind, source: "presentation" }))).toBe(kind);
      expect(presentationRequesterKind(new URLSearchParams({ kind }), true)).toBe(kind);
    }
  });
  it("leaves ordinary visitors and invalid context unanswered", () => {
    for (const query of ["", "kind=agency", "source=presentation", "source=presentation&kind=unknown"]) {
      expect(presentationRequesterKind(new URLSearchParams(query))).toBe("");
    }
  });
  it("carries the known kind through the normal verified-email redirect", () => {
    const url = withServiceChoice("/request/test", { service: "sourcing", kind: "agency", fromPresentation: true });
    expect(presentationRequesterKind(new URL(url, "https://example.com").searchParams)).toBe("agency");
    expect(serviceCardsFor(REQUEST_SERVICE_CARDS_NB, "agency").map(card => card.key)).not.toContain("staffing");
  });
});

describe("which services a firm may ask for", () => {
  // His rule, 28 September 2026: a client chooses staffing or recruitment, an agency recruitment or sourcing.
  it("offers a firm hiring for its own work staffing or recruitment, never sourcing", () => {
    for (const s of ["staffing", "recruitment"]) expect(isServiceAllowedFor(s, "own_operation")).toBe(true);
    expect(isServiceAllowedFor("sourcing", "own_operation")).toBe(false);
  });

  it("never offers staffing to an agency", () => {
    expect(isServiceAllowedFor("staffing", "agency")).toBe(false);
    expect(isServiceAllowedFor("recruitment", "agency")).toBe(true);
    expect(isServiceAllowedFor("sourcing", "agency")).toBe(true);
  });

  it("refuses advertising and anything unknown, whoever asks", () => {
    for (const kind of ["own_operation", "agency", null] as const) {
      expect(isServiceAllowedFor("advertising", kind)).toBe(false);
      expect(isServiceAllowedFor("Recruitment of personnel for companies", kind)).toBe(false);
      expect(isServiceAllowedFor("", kind)).toBe(false);
    }
  });

  it("clears a staffing choice when the firm turns out to be an agency", () => {
    expect(keepServiceIfAllowed("staffing", "agency")).toBe("");
    expect(keepServiceIfAllowed("sourcing", "agency")).toBe("sourcing");
    expect(keepServiceIfAllowed("staffing", "own_operation")).toBe("staffing");
  });
});

describe("the cards", () => {
  it("shows a firm hiring for its own work Bemanning and Rekruttering", () => {
    const cards = serviceCardsFor(REQUEST_SERVICE_CARDS_NB, "own_operation");
    expect(cards.map((c) => c.label)).toEqual(["Bemanning", "Rekruttering"]);
  });

  it("shows an agency Rekruttering and Sourcing", () => {
    const cards = serviceCardsFor(REQUEST_SERVICE_CARDS_NB, "agency");
    expect(cards.map((c) => c.label)).toEqual(["Rekruttering", "Sourcing"]);
  });

  it("carries no en or em dash and no exclamation mark", () => {
    const text = REQUEST_SERVICE_CARDS_NB.map((c) => `${c.label} ${c.blurb}`).join(" ");
    expect(text).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}!]`));
  });
});

describe("carrying the choice into the wizard", () => {
  it("puts it on the wizard's address", () => {
    expect(withServiceChoice("/request/abc", { service: "sourcing", kind: "agency" })).toBe(
      "/request/abc?service=sourcing&kind=agency",
    );
    expect(withServiceChoice("/request/abc", { service: "", kind: "" })).toBe("/request/abc");
  });

  it("takes back only an allowed pair", () => {
    expect(readCarriedServiceChoice("recruitment", "agency")).toEqual({ service: "recruitment", kind: "agency" });
    expect(readCarriedServiceChoice("staffing", "agency")).toEqual({ service: "", kind: "agency" });
    expect(readCarriedServiceChoice("advertising", "own_operation")).toEqual({ service: "", kind: "own_operation" });
    expect(readCarriedServiceChoice("staffing", "nonsense")).toEqual({ service: "staffing", kind: "" });
    expect(readCarriedServiceChoice(null, null)).toEqual({ service: "", kind: "" });
  });
});

describe("staffing: no contract type to choose", () => {
  it("gives a staffing request the staffing contract type, whatever was sent", () => {
    expect(contractTypeForService("staffing", "Permanent employment")).toBe(STAFFING_CONTRACT_TYPE);
    expect(contractTypeForService("staffing", "")).toBe("Temporary hire");
  });

  it("keeps the client's answer for the other services", () => {
    expect(contractTypeForService("recruitment", " Permanent employment ")).toBe("Permanent employment");
    expect(contractTypeForService("sourcing", undefined)).toBe("");
  });
});
