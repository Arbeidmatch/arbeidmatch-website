import { describe, expect, it, vi } from "vitest";

import {
  ARBEIDSTILSYNET_MINSTELONN_URL,
  checkPayConditions,
  fetchPayFloors,
  PAY_MESSAGES,
  payFieldErrors,
  selectPayFloor,
  toggleBenefit,
  tradeKeyForWizardIndustry,
} from "./pay-conditions";

/** ORDER 224, the owner, 5 November 2026: equal treatment, a range at or above the floor, never an invented floor. */

describe("selectPayFloor", () => {
  const floors = [
    { role: null, rate_per_hour: 230, valid_from: "2026-01-01", source_url: null },
    { role: "Betongarbeider", rate_per_hour: 245, valid_from: "2026-01-01", source_url: null },
    { role: "Tømrer", rate_per_hour: 260, valid_from: "2026-01-01", source_url: null },
  ];

  it("takes the highest of the trade-wide rows and the chosen roles' rows", () => {
    expect(selectPayFloor(floors, ["Betongarbeider"])).toBe(245);
    expect(selectPayFloor(floors, ["Betongarbeider", "Tømrer"])).toBe(260);
  });

  it("matches a role ignoring case and spaces at the ends", () => {
    expect(selectPayFloor(floors, ["  tømrer "])).toBe(260);
  });

  it("falls back to the trade-wide row for a role with no row of its own", () => {
    expect(selectPayFloor(floors, ["Maler"])).toBe(230);
  });

  it("is null when no row applies, the list is empty, or the rates are not usable", () => {
    expect(selectPayFloor([{ role: "Tømrer", rate_per_hour: 260 }], ["Maler"])).toBeNull();
    expect(selectPayFloor([], ["Maler"])).toBeNull();
    expect(selectPayFloor(null, ["Maler"])).toBeNull();
    expect(selectPayFloor([{ role: null, rate_per_hour: Number.NaN }, { role: null, rate_per_hour: 0 }], [])).toBeNull();
  });
});

describe("fetchPayFloors", () => {
  it("is an empty list when the route answers 404, so no floor is invented", async () => {
    const fetcher = vi.fn(async () => new Response("not found", { status: 404 }));
    expect(await fetchPayFloors("bygg", fetcher as unknown as typeof fetch)).toEqual([]);
  });

  it("is an empty list when the request fails", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("offline");
    });
    expect(await fetchPayFloors("bygg", fetcher as unknown as typeof fetch)).toEqual([]);
  });

  it("reads the floors of a trade", async () => {
    const body = { ok: true, trade: "bygg", link: ARBEIDSTILSYNET_MINSTELONN_URL, floors: [{ role: null, rate_per_hour: 230, valid_from: "2026-01-01", source_url: null }] };
    const fetcher = vi.fn(async () => Response.json(body));
    const rows = await fetchPayFloors("bygg", fetcher as unknown as typeof fetch);
    expect(rows).toHaveLength(1);
    expect(String((fetcher.mock.calls[0] as unknown[])[0])).toContain("/api/public/pay-floor?trade=bygg");
  });

  it("asks nothing for an unknown trade or for Annet", async () => {
    const fetcher = vi.fn();
    expect(await fetchPayFloors("annet", fetcher as unknown as typeof fetch)).toEqual([]);
    expect(await fetchPayFloors("x", fetcher as unknown as typeof fetch)).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("checkPayConditions", () => {
  const ok = { answerMode: "rolle" as const, equalTreatmentConfirmed: true, payFrom: "250", payTo: "280", payFloorAtSubmit: 250 };

  it("requires the equal-treatment confirmation", () => {
    expect(checkPayConditions({ ...ok, equalTreatmentConfirmed: false })).toBe(PAY_MESSAGES.confirm);
    expect(checkPayConditions({ ...ok, equalTreatmentConfirmed: undefined })).toBe(PAY_MESSAGES.confirm);
  });

  it("refuses an amount under the floor, naming the floor", () => {
    expect(checkPayConditions({ ...ok, payFrom: "240" })).toBe("Under minstelønn (250 kr per time).");
    expect(checkPayConditions({ ...ok, payFrom: "250", payTo: "249" })).toBe("Under minstelønn (250 kr per time).");
  });

  it("refuses Til under Fra", () => {
    expect(checkPayConditions({ ...ok, payFrom: "300", payTo: "280" })).toBe(PAY_MESSAGES.order);
  });

  it("requires both amounts on the detailed variant only", () => {
    expect(checkPayConditions({ ...ok, answerMode: "detaljer", payTo: "" })).toBe(PAY_MESSAGES.range);
    expect(checkPayConditions({ ...ok, answerMode: "rolle", payFrom: "", payTo: "", payFloorAtSubmit: null })).toBeNull();
  });

  it("takes any amount at or above zero when no floor is known", () => {
    expect(checkPayConditions({ ...ok, payFrom: "10", payTo: "10", payFloorAtSubmit: null })).toBeNull();
  });
});

describe("payFieldErrors", () => {
  it("refuses each field under the floor, inline", () => {
    expect(payFieldErrors({ from: "200", to: "", floor: 250 })).toEqual({ from: "Under minstelønn (250 kr per time)." });
    expect(payFieldErrors({ from: "", to: "", floor: 250 })).toEqual({});
  });
});

describe("toggleBenefit", () => {
  it("keeps Ingen tillegg alone and the two housing answers apart", () => {
    expect(toggleBenefit(["Kost", "Verktøy"], "Ingen tillegg")).toEqual(["Ingen tillegg"]);
    expect(toggleBenefit(["Ingen tillegg"], "Kost")).toEqual(["Kost"]);
    expect(toggleBenefit(["Bolig uten trekk", "Kost"], "Bolig med trekk i lønn")).toEqual(["Kost", "Bolig med trekk i lønn"]);
    expect(toggleBenefit(["Kost"], "Kost")).toEqual([]);
  });
});

describe("tradeKeyForWizardIndustry", () => {
  it("maps the wizard's categories it can, and gives no trade for the rest", () => {
    expect(tradeKeyForWizardIndustry("Construction")).toBe("bygg");
    expect(tradeKeyForWizardIndustry("Welding and Metal")).toBe("industri");
    expect(tradeKeyForWizardIndustry("Plumbing and HVAC (VVS)")).toBeNull();
    expect(tradeKeyForWizardIndustry("")).toBeNull();
  });
});
