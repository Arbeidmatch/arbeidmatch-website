import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addressProblem,
  checkedFrom,
  counterWords,
  decideRecommendPopup,
  fieldsAllowed,
  filledAddresses,
  landingFrom,
  recommenderWords,
  recommendFrom,
  recommendRequest,
  RECOMMEND_NO,
  trialRequestBody,
  type RecommendState,
} from "@/lib/min-side/recommend";
import { profileFrom } from "@/lib/min-side/profile";

const callAts = vi.fn();
vi.mock("@/lib/prosjekter/ats", () => ({ callAts: (...args: unknown[]) => callAts(...args) }));

const TOKEN = "00000000-0000-4000-8000-0000000000a1";
const REC = "00000000-0000-4000-8000-0000000000c1";
const ROW = "00000000-0000-4000-8000-0000000000d1";

const state = (part: Partial<RecommendState> = {}): RecommendState => ({ limit: 5, used: 1, due: true, rows: [], ...part });

describe("the recommend block (ORDER 274)", () => {
  it("is read strictly and left out when the ATS says nothing", () => {
    expect(recommendFrom(null)).toBeNull();
    expect(recommendFrom({ used: 1 })).toBeNull();
    expect(recommendFrom({ limit: 5, used: -1 })).toBeNull();
    const r = recommendFrom({ limit: 5, used: 2, due: true, rows: [{ id: ROW, email: "a@firma.no", company_name: "Firma AS", status: "sent", status_no: "Sendt", created_at: "2026-11-13T00:00:00Z" }, { id: "nope" }] });
    expect(r).toEqual({ limit: 5, used: 2, due: true, rows: [{ id: ROW, email: "a@firma.no", company_name: "Firma AS", status: "sent", status_no: "Sendt", created_at: "2026-11-13T00:00:00Z" }] });
  });

  it("travels with the profile", () => {
    const p = profileFrom({ me: { email: "x@firma.no" }, company: { id: TOKEN, name: "Firma AS" }, recommend: { limit: 5, used: 0, due: false, rows: [] } });
    expect(p?.recommend).toEqual({ limit: 5, used: 0, due: false, rows: [] });
    expect(profileFrom({ me: { email: "x@firma.no" }, company: { id: TOKEN, name: "Firma AS" } })?.recommend).toBeNull();
  });

  it("counts five segments and never more than the limit", () => {
    expect(counterWords(2)).toBe("2 av 5 firmaer anbefalt");
    expect(counterWords(9)).toBe("5 av 5 firmaer anbefalt");
    expect(fieldsAllowed(0)).toBe(5);
    expect(fieldsAllowed(3)).toBe(2);
    expect(fieldsAllowed(5)).toBe(0);
  });
});

describe("addresses", () => {
  it("refuses free mail with his sentence and accepts a company address", () => {
    expect(addressProblem("ola@gmail.com")).toBe(RECOMMEND_NO.companyOnly);
    expect(addressProblem("ola@hotmail.de")).toBe(RECOMMEND_NO.companyOnly);
    expect(addressProblem("ola@online.no")).toBe(RECOMMEND_NO.companyOnly);
    expect(addressProblem("ola@")).toBe(RECOMMEND_NO.invalid);
    expect(addressProblem("ola@nordbygg.no")).toBeNull();
    expect(addressProblem("  ")).toBeNull();
  });

  it("drops empty fields and repeats, lowercased", () => {
    expect(filledAddresses([" Ola@Firma.no", "", "ola@firma.no", "kari@bygg.no"])).toEqual(["ola@firma.no", "kari@bygg.no"]);
  });

  it("reads the marks the ATS answers", () => {
    const got = checkedFrom({ rows: [{ email: "A@Firma.no", company_name: "Firma AS", mark: "customer", mark_no: "Allerede kunde" }], used: 3, limit: 5 });
    expect(got).toEqual({ rows: [{ email: "a@firma.no", company_name: "Firma AS", mark_no: "Allerede kunde" }], used: 3 });
  });
});

describe("what is passed on", () => {
  it("only the named fields, at most five addresses and a 200-character greeting", () => {
    expect(recommendRequest({ action: "recommend_check", emails: ["a@firma.no"], note: "x", extra: 1 })).toEqual({ action: "recommend_check", emails: ["a@firma.no"] });
    expect(recommendRequest({ action: "recommend_send", emails: ["a@firma.no"], note: "Hei" })).toEqual({ action: "recommend_send", emails: ["a@firma.no"], note: "Hei" });
    expect(recommendRequest({ action: "recommend_send", emails: ["a@firma.no"], note: "x".repeat(201) })).toBeNull();
    expect(recommendRequest({ action: "recommend_send", emails: Array(6).fill("a@firma.no") })).toBeNull();
    expect(recommendRequest({ action: "recommend_send", emails: [] })).toBeNull();
    expect(recommendRequest({ action: "recommend_send", emails: [{ a: 1 }] })).toBeNull();
    expect(recommendRequest({ action: "recommend_prompt_later", emails: ["x"] })).toEqual({ action: "recommend_prompt_later" });
    expect(recommendRequest({ action: "something_else" })).toBeNull();
  });

  it("the trial request keeps its five fields, bounded", () => {
    expect(trialRequestBody({ action: "trial_request", name: "Ola", email: "ola@firma.no", phone: "+4790000000", org_number: "912345678", company_name: "Firma AS", status: "given" })).toEqual({
      action: "trial_request",
      name: "Ola",
      email: "ola@firma.no",
      phone: "+4790000000",
      org_number: "912345678",
      company_name: "Firma AS",
    });
    expect(trialRequestBody({ action: "optout", email: "someone@else.no" })).toEqual({ action: "optout" });
    expect(trialRequestBody({ action: "give" })).toBeNull();
  });
});

describe("the popup opens by itself only on its turn", () => {
  it("due, not read-only, not after the key dialog, and only when no window had the visit", () => {
    const base = { state: state(), readOnly: false, keyDialogThisVisit: false, shownThisVisit: null };
    expect(decideRecommendPopup(base)).toBe(true);
    expect(decideRecommendPopup({ ...base, state: state({ due: false }) })).toBe(false);
    expect(decideRecommendPopup({ ...base, state: null })).toBe(false);
    expect(decideRecommendPopup({ ...base, readOnly: true })).toBe(false);
    expect(decideRecommendPopup({ ...base, keyDialogThisVisit: true })).toBe(false);
    expect(decideRecommendPopup({ ...base, shownThisVisit: "install_app" })).toBe(false);
    expect(decideRecommendPopup({ ...base, state: state({ used: 5 }) })).toBe(false);
  });
});

describe("the landing", () => {
  it("names who recommended, and nothing for anything else", () => {
    expect(landingFrom({ recommended_by: { name: "Kari Nord", firm: "Nord Bygg AS" }, opted_out: false })).toEqual({ name: "Kari Nord", firm: "Nord Bygg AS", optedOut: false });
    expect(landingFrom({ error: "x" })).toBeNull();
    expect(recommenderWords({ name: "Kari Nord", firm: "Nord Bygg AS" })).toBe("Kari Nord fra Nord Bygg AS");
    expect(recommenderWords({ name: null, firm: "Nord Bygg AS" })).toBe("Nord Bygg AS");
  });
});

describe("the proxies", () => {
  beforeEach(() => {
    callAts.mockReset();
    callAts.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  const req = (url: string, body?: unknown) =>
    new NextRequest(url, { method: body === undefined ? "GET" : "POST", body: body === undefined ? undefined : JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 200)}` } });

  it("Min side passes a recommend action on with its named fields only", async () => {
    const { POST } = await import("@/app/api/min-side/[token]/route");
    const res = await POST(req(`https://x.no/api/min-side/${TOKEN}`, { action: "recommend_send", emails: ["a@firma.no"], note: "Hei", from_company_id: "z" }), { params: Promise.resolve({ token: TOKEN }) });
    expect(res.status).toBe(200);
    expect(callAts).toHaveBeenCalledWith(`/api/public/client-profile/${TOKEN}`, expect.objectContaining({ body: { action: "recommend_send", emails: ["a@firma.no"], note: "Hei" } }));
    const bad = await POST(req(`https://x.no/api/min-side/${TOKEN}`, { action: "recommend_send", emails: Array(6).fill("a@firma.no") }), { params: Promise.resolve({ token: TOKEN }) });
    expect(bad.status).toBe(400);
  });

  it("the recommendation link refuses a made-up token without asking the ATS", async () => {
    const { GET, POST } = await import("@/app/api/prosjektvarsler/anbefalt/[token]/route");
    const res = await GET(req("https://x.no/api/prosjektvarsler/anbefalt/abc"), { params: Promise.resolve({ token: "abc" }) });
    expect(res.status).toBe(404);
    expect(callAts).not.toHaveBeenCalled();
    const ok = await POST(req(`https://x.no/api/prosjektvarsler/anbefalt/${REC}`, { action: "optout", email: "other@firma.no" }), { params: Promise.resolve({ token: REC }) });
    expect(ok.status).toBe(200);
    expect(callAts).toHaveBeenCalledWith(`/api/public/project-recommendation/${REC}`, expect.objectContaining({ method: "POST", body: { action: "optout" } }));
    const bad = await POST(req(`https://x.no/api/prosjektvarsler/anbefalt/${REC}`, { action: "give" }), { params: Promise.resolve({ token: REC }) });
    expect(bad.status).toBe(400);
  });
});

describe("no reward text anywhere (beta)", () => {
  it("the popup, the landing and the texts say nothing of a discount or a price", () => {
    const files = [
      "src/lib/min-side/recommend.ts",
      "src/components/min-side/MinSideRecommend.tsx",
      "src/components/prosjektvarsler/RecommendationForms.tsx",
      "src/app/prosjektvarsler/anbefalt/[token]/page.tsx",
      "src/app/prosjektvarsler/anbefalt/[token]/stopp/page.tsx",
    ];
    for (const f of files) {
      const src = readFileSync(path.join(process.cwd(), f), "utf8");
      expect(src, f).not.toMatch(/rabatt|discount|kr\s?\d|pris|belønning/i);
    }
  });
});
