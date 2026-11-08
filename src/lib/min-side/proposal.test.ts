import { describe, expect, it } from "vitest";

import { isProposalKey, nearestThreshold, preselectedOpinion, proposalPageOf, proposalRequest } from "./proposal";

const KEY = `${"eyJ2IjoxLCJsIjoiYWJjIn0".padEnd(40, "A")}.${"c2lnbmF0dXJl".padEnd(43, "B")}`;

describe("the proposals letter's answer page (ORDER 210 b)", () => {
  it("accepts only a signed key's shape", () => {
    expect(isProposalKey(KEY)).toBe(true);
    expect(isProposalKey("abc")).toBe(false);
    expect(isProposalKey(`${KEY}/../x`)).toBe(false);
    expect(isProposalKey(`a.b.c`)).toBe(false);
    expect(isProposalKey(null)).toBe(false);
  });

  it("passes on one kind of press with only its fields", () => {
    expect(proposalRequest({ t: KEY })).toEqual({ t: KEY });
    expect(proposalRequest({ t: KEY, answer: "much", extra: "x" })).toEqual({ t: KEY, answer: "much" });
    expect(proposalRequest({ t: KEY, answer: "lots" })).toBeNull();
    expect(proposalRequest({ t: KEY, threshold_mnok: 5 })).toEqual({ t: KEY, threshold_mnok: 5 });
    expect(proposalRequest({ t: KEY, threshold_mnok: 9000 })).toBeNull();
    expect(proposalRequest({ t: KEY, text: "  En  idé  " })).toEqual({ t: KEY, text: "En idé" });
    expect(proposalRequest({ t: KEY, text: "x" })).toBeNull();
    expect(proposalRequest({ t: KEY, more: "Bedre kart" })).toEqual({ t: KEY, more: "Bedre kart" });
    expect(proposalRequest({ t: KEY, more: "   " })).toBeNull();
    expect(proposalRequest({ t: KEY, text: "x".repeat(5000) })?.text).toHaveLength(2000);
    expect(proposalRequest({ t: "nope" })).toBeNull();
    expect(proposalRequest([KEY])).toBeNull();
  });

  it("pre-selects only a known opinion", () => {
    expect(preselectedOpinion("much")).toBe("much");
    expect(preselectedOpinion("not_yet")).toBe("not_yet");
    expect(preselectedOpinion("<script>")).toBeNull();
    expect(preselectedOpinion(null)).toBeNull();
  });

  it("reads the ATS's page and its earlier answer", () => {
    const p = proposalPageOf({ company: "Test AS", target: "same_day", title: "Varsel samme dag", line: "", button: "Bekreft", options: null, same_day: { threshold_mnok: 2, sms: false }, answered: null });
    expect(p?.same_day).toEqual({ threshold_mnok: 2, sms: false });
    expect(p?.line).toBeNull();
    const a = proposalPageOf({ target: "idea", title: "Del ideen", button: "Send", answered: { answer: "sent", message: "Dette er allerede svart. Ingenting er endret." } });
    expect(a?.answered?.message).toMatch(/allerede svart/);
    expect(proposalPageOf({ error: "x" })).toBeNull();
  });

  it("passes on one more address, lower case, and nothing that is not one (ORDER 210 d)", () => {
    expect(proposalRequest({ t: KEY, email: " Kalk@Firma.NO " })).toEqual({ t: KEY, email: "kalk@firma.no" });
    expect(proposalRequest({ t: KEY, email: "a@b.no, c@d.no" })).toBeNull();
    expect(proposalRequest({ t: KEY, email: "nope" })).toBeNull();
    expect(proposalRequest({ t: KEY, email: "*@firma.no" })).toBeNull();
    const p = proposalPageOf({ target: "more_addresses", title: "Flere mottakere", button: "Bekreft", address_field: { label: "E-post" }, answered: null });
    expect(p?.address_field).toEqual({ label: "E-post" });
    expect(proposalPageOf({ target: "who_won", title: "Hvem vant", button: "Bekreft" })?.address_field).toBeNull();
  });

  it("chooses the offered threshold nearest the suggestion", () => {
    expect(nearestThreshold(2)).toBe(2);
    expect(nearestThreshold(3)).toBe(2);
    expect(nearestThreshold(4)).toBe(5);
    expect(nearestThreshold(100)).toBe(20);
  });
});
