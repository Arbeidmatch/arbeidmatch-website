import { describe, expect, it } from "vitest";

import {
  cleanPreviewToken,
  filterMarketSearch,
  isMarketId,
  marketCardView,
  mergeNewestFirst,
  safePreviewNext,
  validateEventBody,
} from "./pure";
import type { MarketSiteCard } from "./types";

function card(over: Partial<MarketSiteCard> = {}): MarketSiteCard {
  return {
    id: "M-12",
    kind: "market",
    state: "open",
    privateTest: false,
    trade: { key: "carpenter", en: "Carpenter", no: "tømrer" },
    title: "Carpenter",
    place: "Rælingen",
    zone: "Oslo area",
    employer: "local employer",
    pay: null,
    perks: ["Company car", "Tools and equipment", "Permanent job", "Full time"],
    englishWorks: false,
    experienceInsteadOfCertificate: false,
    newToday: false,
    positions: 1,
    applyBy: null,
    postedAt: "2026-11-20T08:00:00Z",
    recruitmentOnly: false,
    ...over,
  };
}

describe("the preview route's next path", () => {
  it("allows the list and one market job only", () => {
    expect(safePreviewNext("/jobs")).toBe("/jobs");
    expect(safePreviewNext("/jobs/m/M-12")).toBe("/jobs/m/M-12");
  });

  it("sends everything else to the list", () => {
    for (const bad of [null, undefined, "", "/", "//evil.example", "https://evil.example/jobs", "/jobs/m/12", "/jobs/m/M-12/x", "/jobs/carpenter", "/jobs/m/M-12?x=1", "/jobs/m/M-1a"]) {
      expect(safePreviewNext(bad)).toBe("/jobs");
    }
  });

  it("keeps only token-shaped values", () => {
    expect(cleanPreviewToken("abc.def-123_456")).toBe("abc.def-123_456");
    expect(cleanPreviewToken("short")).toBeNull();
    expect(cleanPreviewToken("has space inside")).toBeNull();
    expect(cleanPreviewToken(undefined)).toBeNull();
  });

  it("recognises market ids", () => {
    expect(isMarketId("M-12")).toBe(true);
    expect(isMarketId("m-12")).toBe(false);
    expect(isMarketId("M-")).toBe(false);
  });
});

describe("the event body", () => {
  it("takes the simple events without a reason", () => {
    for (const kind of ["view", "keep", "interested", "send", "recommend", "check_source"]) {
      expect(validateEventBody({ kind, reason: "pay", note: "x" })).toEqual({ ok: true, value: { kind } });
    }
  });

  it("refuses an unknown kind or no body", () => {
    expect(validateEventBody({ kind: "apply" })).toEqual({ ok: false, error: "invalid_kind" });
    expect(validateEventBody(null)).toEqual({ ok: false, error: "invalid_body" });
  });

  it("needs a reason from the right list for pass and report", () => {
    expect(validateEventBody({ kind: "pass", reason: "pay" })).toEqual({ ok: true, value: { kind: "pass", reason: "pay" } });
    expect(validateEventBody({ kind: "pass", reason: "fraud" })).toEqual({ ok: false, error: "invalid_reason" });
    expect(validateEventBody({ kind: "report", reason: "fraud" })).toEqual({ ok: true, value: { kind: "report", reason: "fraud" } });
    expect(validateEventBody({ kind: "report" })).toEqual({ ok: false, error: "invalid_reason" });
  });

  it("needs a note for other, and trims and caps it", () => {
    expect(validateEventBody({ kind: "pass", reason: "other", note: "   " })).toEqual({ ok: false, error: "note_required" });
    expect(validateEventBody({ kind: "report", reason: "other", note: " odd " })).toEqual({ ok: true, value: { kind: "report", reason: "other", note: "odd" } });
    const long = validateEventBody({ kind: "pass", reason: "other", note: "x".repeat(900) });
    expect(long.ok && long.value.note?.length).toBe(500);
  });
});

describe("a market card in the list", () => {
  it("says local employer and never another employer", () => {
    const v = marketCardView(card());
    expect(v.placeLine).toBe("Rælingen, Oslo area, local employer");
    expect(marketCardView(card({ place: null, zone: null })).placeLine).toBe("local employer");
    expect(v.idLine).toBe("Job ID M-12");
    expect(v.href).toBe("/jobs/m/M-12");
  });

  it("shows the first three perks and the badges that apply", () => {
    const v = marketCardView(card({ englishWorks: true, experienceInsteadOfCertificate: true, newToday: true, positions: 3 }));
    expect(v.perks).toEqual(["Company car", "Tools and equipment", "Permanent job"]);
    expect(v.badges.map((b) => b.label)).toEqual(["English works", "Experience vs trade certificate", "New today", "3 positions"]);
    expect(marketCardView(card()).badges.map((b) => b.label)).toEqual(["1 position"]);
  });

  it("shows pay only when the advert states it", () => {
    expect(marketCardView(card()).pay).toBeNull();
    expect(marketCardView(card({ pay: "250 NOK/hour" })).pay).toBe("250 NOK/hour");
  });

  it("marks a private test from the list or the card", () => {
    expect(marketCardView(card()).privateTest).toBe(false);
    expect(marketCardView(card(), true).privateTest).toBe(true);
    expect(marketCardView(card({ privateTest: true })).privateTest).toBe(true);
  });
});

describe("mixing the lists", () => {
  const own = [
    { id: "a", at: "2026-11-25T00:00:00Z" },
    { id: "b", at: "2026-11-10T00:00:00Z" },
  ];
  const at = (j: { at: string }) => j.at;

  it("leaves our list untouched without market jobs", () => {
    expect(mergeNewestFirst(own, [], at)).toEqual(own.map((job) => ({ kind: "own", job })));
  });

  it("weaves market jobs in by date, newest first", () => {
    const merged = mergeNewestFirst(own, [card({ id: "M-1", postedAt: "2026-11-01T00:00:00Z" }), card({ id: "M-2", postedAt: "2026-11-20T00:00:00Z" })], at);
    expect(merged.map((e) => (e.kind === "own" ? e.job.id : e.card.id))).toEqual(["a", "M-2", "b", "M-1"]);
  });

  it("filters market jobs by title, trade and place", () => {
    const cards = [card(), card({ id: "M-2", title: "Mason", trade: { key: "mason", en: "Mason", no: "murer" }, place: "Trondheim", zone: null })];
    expect(filterMarketSearch(cards, "murer", "").map((c) => c.id)).toEqual(["M-2"]);
    expect(filterMarketSearch(cards, "", "raelingen").map((c) => c.id)).toEqual(["M-12"]);
    expect(filterMarketSearch(cards, "carpenter", "Trondheim")).toEqual([]);
  });
});
